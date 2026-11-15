const express = require('express');
const http = require('node:http');
const cors = require('cors');
const { Server } = require('socket.io');
const crypto = require('node:crypto');
const avatarCatalog = require('./avatar-catalog.json');

const SCENARIOS = new Set(['ride', 'playlist', 'project', 'cafe', 'studio']);
const REFLECTIONS = new Set(['repair', 'pause', 'agree', 'set-aside', 'later']);
const AVATAR_FIELDS = ['hair', 'hairColor', 'clothing', 'accessory', 'facialHair', 'pose', 'expression'];
const AVATAR_OPTIONS = Object.fromEntries(Object.entries(avatarCatalog).map(([field, ids]) => [field, new Set(ids)]));
const MAX_DRAWING_LENGTH = 2_000_000;
const TOKEN = /^[a-f0-9]{64}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PNG_PREFIX = 'data:image/png;base64,';
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const slug = (value) => typeof value === 'string' && value.length <= 40 && SLUG.test(value);
const failure = (code, message) => ({ ok: false, error: { code, message } });
const randomToken = () => crypto.randomBytes(32).toString('hex');

function validateParticipant(value) {
  if (!object(value) || typeof value.name !== 'string' || !object(value.avatar)) return null;
  const name = value.name.trim();
  if (!name || name.length > 30 || /[\p{Cc}\p{Cf}]/u.test(name)) return null;
  const avatar = {};
  for (const field of AVATAR_FIELDS) {
    const selected = value.avatar[field] === undefined ? (field === 'hairColor' ? 'ink' : field === 'pose' ? 'bust' : undefined) : value.avatar[field];
    if (!slug(selected) || !AVATAR_OPTIONS[field].has(selected)) return null;
    avatar[field] = selected;
  }
  return { name, avatar };
}

function validateResponse(value) {
  if (!object(value) || !['draw', 'write'].includes(value.mode) || typeof value.text !== 'string' || value.text.length > 1200 || typeof value.drawing !== 'string' || value.drawing.length > MAX_DRAWING_LENGTH || typeof value.color !== 'string' || !/^#[a-f0-9]{6}$/i.test(value.color)) return null;
  if (value.drawing !== '') {
    if (!value.drawing.startsWith(PNG_PREFIX)) return null;
    const encoded = value.drawing.slice(PNG_PREFIX.length);
    if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.toString('ascii', 12, 16) !== 'IHDR') return null;
  }
  return { mode: value.mode, text: value.text, drawing: value.drawing, color: value.color, submitted: true };
}

function createSessionServer(options = {}) {
  const app = express();
  app.disable('x-powered-by');
  const server = http.createServer(app);
  const configuredOrigins = options.clientOrigin ?? process.env.CLIENT_ORIGIN ?? '*';
  const origins = String(configuredOrigins).split(',').map((origin) => origin.trim()).filter(Boolean);
  const allowsOrigin = (origin) => !origin || origins.includes('*') || origins.includes(origin);
  const corsOptions = { origin: (origin, callback) => callback(null, allowsOrigin(origin)), methods: ['GET', 'POST'] };
  app.use(cors(corsOptions));
  const io = new Server(server, {
    cors: corsOptions,
    maxHttpBufferSize: MAX_DRAWING_LENGTH + 16 * 1024,
    allowRequest: (request, callback) => callback(null, allowsOrigin(request.headers.origin)),
  });
  const sessions = new Map();
  const now = options.now ?? Date.now;
  const codeGenerator = options.codeGenerator ?? (() => crypto.randomBytes(3).toString('hex').toUpperCase());
  const maxSessions = options.maxSessions ?? 50;
  const sessionIdleMs = options.sessionIdleMs ?? 30 * 60 * 1000;
  let closing;

  function snapshot(session, participantIndex) {
    const state = {
      code: session.code,
      participantIndex,
      round: session.round,
      revision: session.revision,
      phase: session.phase,
      scenarioId: session.scenarioId,
      reflectionPath: session.reflectionPath,
      participants: session.participants.map((participant) => participant ? {
        name: participant.name,
        avatar: { ...participant.avatar },
        connected: Boolean(participant.socketId),
        submitted: participant.submitted,
      } : null),
    };
    if (session.phase === 'revealed') state.responses = session.participants.map((participant) => ({ ...participant.response }));
    return state;
  }

  function broadcast(session, recipients = session.participants.map((participant) => participant?.socketId)) {
    recipients.forEach((socketId, index) => {
      if (socketId) io.sockets.sockets.get(socketId)?.emit('session-state', snapshot(session, index));
    });
  }

  function touch(session) {
    session.lastActiveAt = now();
    session.revision += 1;
  }

  function end(session) {
    const recipients = session.participants.map((participant) => participant?.socketId);
    session.participants = [null, null];
    session.phase = 'ended';
    session.scenarioId = null;
    session.reflectionPath = null;
    session.hostToken = null;
    touch(session);
    broadcast(session, recipients);
    recipients.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.data.membership = null;
    });
    sessions.delete(session.code);
  }

  function cleanupSessions() {
    const cutoff = now() - sessionIdleMs;
    for (const session of sessions.values()) if (session.lastActiveAt <= cutoff) end(session);
  }

  const cleanupTimer = setInterval(cleanupSessions, options.cleanupIntervalMs ?? 60_000);
  cleanupTimer.unref();

  app.get('/', (request, response) => response.json({ status: 'Two Perspectives session server is running' }));
  app.post('/api/sessions', (request, response) => {
    cleanupSessions();
    if (sessions.size >= maxSessions) return response.status(503).json(failure('SERVER_CAPACITY', 'The session server is busy. Please try again shortly.'));
    let code;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = codeGenerator();
      if (typeof candidate === 'string' && /^[A-Z0-9]{6}$/.test(candidate) && !sessions.has(candidate)) {
        code = candidate;
        break;
      }
    }
    if (!code) return response.status(503).json(failure('SERVER_CAPACITY', 'A session could not be created. Please try again.'));
    const hostToken = randomToken();
    sessions.set(code, { code, hostToken, participants: [null, null], phase: 'lobby', scenarioId: null, reflectionPath: null, round: 1, revision: 0, lastActiveAt: now() });
    response.set('Cache-Control', 'no-store').json({ code, hostToken });
  });

  io.on('connection', (socket) => {
    function handle(event, handler) {
      socket.on(event, (payload, acknowledge) => {
        if (typeof payload === 'function' && acknowledge === undefined) {
          acknowledge = payload;
          payload = {};
        }
        let result;
        try {
          result = handler(object(payload) ? payload : {});
        } catch {
          result = failure('SERVER_ERROR', 'The session action could not be completed. Please retry.');
        }
        if (typeof acknowledge === 'function') acknowledge(result);
      });
    }

    handle('join-session', (payload) => {
      cleanupSessions();
      const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : '';
      const session = sessions.get(code);
      if (!session) return failure('SESSION_NOT_FOUND', 'This session is unavailable. Create a new session.');
      const participant = validateParticipant(payload.participant);
      if (!participant) return failure('INVALID_PARTICIPANT', 'Enter a nickname of 1–30 characters and a valid avatar.');
      const hasHostToken = payload.hostToken !== undefined;
      const hasResumeToken = payload.resumeToken !== undefined;
      if ((hasHostToken && (typeof payload.hostToken !== 'string' || !TOKEN.test(payload.hostToken) || payload.hostToken !== session.hostToken)) || (hasResumeToken && (typeof payload.resumeToken !== 'string' || !TOKEN.test(payload.resumeToken) || payload.resumeToken === session.hostToken))) return failure('INVALID_TOKEN', 'These session credentials are invalid.');
      let index = hasResumeToken ? session.participants.findIndex((entry) => entry?.resumeToken === payload.resumeToken) : -1;
      if (index !== -1 && hasHostToken && index !== 0) return failure('INVALID_TOKEN', 'These session credentials are invalid.');
      if (index === -1) {
        index = hasHostToken ? 0 : 1;
        if (session.participants[index]) return failure(hasResumeToken || hasHostToken ? 'INVALID_TOKEN' : 'SESSION_FULL', 'This participant slot is already claimed.');
        if (session.participants.some((entry) => entry?.name.toLocaleLowerCase('en-US') === participant.name.toLocaleLowerCase('en-US'))) return failure('INVALID_PARTICIPANT', 'Choose a different nickname from your partner.');
      }
      if (socket.data.membership && (socket.data.membership.code !== code || socket.data.membership.index !== index)) return failure('INVALID_TOKEN', 'This connection already belongs to a participant.');
      let entry = session.participants[index];
      if (!entry) {
        let resumeToken = payload.resumeToken ?? randomToken();
        while (session.participants.some((other) => other?.resumeToken === resumeToken) || resumeToken === session.hostToken) resumeToken = randomToken();
        entry = { ...participant, resumeToken, socketId: null, submitted: false, response: null, submittedExpression: null };
        session.participants[index] = entry;
      }
      if (entry.socketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(entry.socketId);
        if (oldSocket) oldSocket.data.membership = null;
        entry.socketId = socket.id;
        touch(session);
      }
      socket.data.membership = { code, index };
      broadcast(session);
      return { ok: true, session: snapshot(session, index), resumeToken: entry.resumeToken };
    });

    function authenticated(payload) {
      cleanupSessions();
      const membership = socket.data.membership;
      if (!membership) return { error: failure('INVALID_TOKEN', 'Join this session before taking an action.') };
      const session = sessions.get(membership.code);
      const participant = session?.participants[membership.index];
      if (!session || !participant || participant.socketId !== socket.id) return { error: failure('INVALID_TOKEN', 'This connection no longer owns its participant slot.') };
      if (!Number.isSafeInteger(payload.round) || payload.round !== session.round) return { error: failure('STALE_ROUND', 'This action belongs to an earlier scenario. Use the current session state.') };
      return { session, participant, index: membership.index };
    }

    function command(event, action) {
      handle(event, (payload) => {
        const membership = authenticated(payload);
        if (membership.error) return membership.error;
        const error = action(membership, payload);
        if (error) return error;
        return { ok: true, session: snapshot(membership.session, membership.index) };
      });
    }

    command('select-scenario', ({ session, index }, payload) => {
      if (index !== 0) return failure('HOST_ONLY', 'The host chooses the shared scenario.');
      if (session.phase !== 'lobby') return failure('INVALID_PHASE', 'A scenario has already started.');
      if (!SCENARIOS.has(payload.scenarioId)) return failure('INVALID_SCENARIO', 'Choose one of the available scenarios.');
      if (!session.participants.every((entry) => entry?.socketId)) return failure('PARTICIPANTS_OFFLINE', 'Both participants must be connected before starting.');
      session.scenarioId = payload.scenarioId;
      session.phase = 'responding';
      touch(session);
      broadcast(session);
    });

    command('submit-perspective', ({ session, participant }, payload) => {
      if (participant.submitted && ['responding', 'revealed'].includes(session.phase)) return;
      if (session.phase !== 'responding') return failure('INVALID_PHASE', 'Choose a scenario before submitting a perspective.');
      const response = validateResponse(payload.response);
      if (!response) return failure('INVALID_RESPONSE', 'Use up to 1,200 text characters, a PNG drawing up to 2 MB, and a valid color.');
      if (!slug(payload.expression) || !AVATAR_OPTIONS.expression.has(payload.expression)) return failure('INVALID_PARTICIPANT', 'Choose a valid expression.');
      participant.response = response;
      participant.submittedExpression = payload.expression;
      participant.submitted = true;
      if (session.participants.every((entry) => entry?.submitted)) {
        session.phase = 'revealed';
        session.participants.forEach((entry) => { entry.avatar.expression = entry.submittedExpression; });
      }
      touch(session);
      broadcast(session);
    });

    command('choose-repair-step', ({ session }, payload) => {
      if (session.phase !== 'revealed') return failure('INVALID_PHASE', 'Reveal both perspectives before choosing a reflection.');
      if (!REFLECTIONS.has(payload.repairChoice)) return failure('INVALID_REFLECTION', 'Choose one of the available reflection paths.');
      if (session.reflectionPath === payload.repairChoice) return;
      session.reflectionPath = payload.repairChoice;
      touch(session);
      broadcast(session);
    });

    command('restart-scenario', ({ session }) => {
      if (session.phase !== 'revealed') return failure('INVALID_PHASE', 'Reveal both perspectives before choosing another scenario.');
      session.participants.forEach((entry) => {
        entry.response = null;
        entry.submitted = false;
        entry.submittedExpression = null;
      });
      session.phase = 'lobby';
      session.scenarioId = null;
      session.reflectionPath = null;
      session.round += 1;
      touch(session);
      broadcast(session);
    });

    command('end-session', ({ session }) => { end(session); });

    socket.on('disconnect', () => {
      const membership = socket.data.membership;
      const session = membership && sessions.get(membership.code);
      const entry = session?.participants[membership.index];
      if (!entry || entry.socketId !== socket.id) return;
      entry.socketId = null;
      touch(session);
      broadcast(session);
    });
  });

  async function close() {
    if (closing) return closing;
    clearInterval(cleanupTimer);
    closing = new Promise((resolve) => {
      io.close(() => {
        sessions.clear();
        if (server.listening) server.close(() => resolve());
        else resolve();
      });
    });
    return closing;
  }
  return { app, server, io, close };
}

module.exports = { createSessionServer };

if (require.main === module) {
  const instance = createSessionServer();
  const port = process.env.PORT || 3001;
  instance.server.listen(port, '0.0.0.0', () => console.log(`Two Perspectives session server listening on port ${port}`));
  const shutdown = () => { instance.close().then(() => { process.exitCode = 0; }); };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
