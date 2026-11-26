import { useCallback, useEffect, useRef, useState } from 'react';
import { joinSession, requestSession, sessionSocket, SESSION_START_TIMEOUT } from './lib/sessionClient.js';
import { readJointSnapshot } from './joint-session.js';

function newResumeToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function useJointSession() {
  const [session, setSession] = useState(null);
  const [connection, setConnection] = useState('idle');
  const [error, setError] = useState('');
  const [slow, setSlow] = useState(false);
  const credentials = useRef(null);
  const current = useRef(null);
  const connectionRef = useRef('idle');
  const timers = useRef([]);
  const joining = useRef(null);
  const pendingEnd = useRef(null);
  const joinNow = useRef(null);
  const status = useCallback(value => { connectionRef.current = value; setConnection(value); }, []);
  const clearTimers = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; setSlow(false); }, []);
  const fail = useCallback(message => {
    clearTimers();
    status('error'); setError(message);
    sessionSocket.disconnect();
  }, [clearTimers, status]);
  const openWindow = useCallback(() => {
    clearTimers();
    timers.current = [setTimeout(() => setSlow(true), 5000), setTimeout(() => fail('The session server is taking too long. Try reconnecting, or return to start.'), SESSION_START_TIMEOUT)];
  }, [clearTimers, fail]);
  const receive = useCallback(value => {
    const identity = credentials.current;
    if (!identity || value?.code !== identity.code) return;
    const snapshot = readJointSnapshot(value);
    if (!snapshot || (identity.index !== undefined && snapshot.participantIndex !== identity.index)) {
      fail('The session server returned an invalid session. Try reconnecting.'); return;
    }
    if (current.current && snapshot.revision <= current.current.revision) return;
    identity.index = snapshot.participantIndex;
    identity.joined = true;
    current.current = snapshot; setSession(snapshot); setError(''); clearTimers();
    if (snapshot.phase === 'ended') {
      credentials.current = null;
      status('ended'); if (!pendingEnd.current) sessionSocket.disconnect();
    } else status('connected');
  }, [clearTimers, fail, status]);

  useEffect(() => {
    const connected = async () => {
      const identity = credentials.current;
      if (!identity) return;
      joining.current?.abort();
      const request = new AbortController(); joining.current = request;
      try {
        const result = await joinSession(identity.code, identity.participant, { hostToken: identity.hostToken, resumeToken: identity.resumeToken, signal: request.signal });
        if (!request.signal.aborted && credentials.current === identity) receive(result.session);
      } catch (issue) {
        if (request.signal.aborted || credentials.current !== identity || identity.joined || connectionRef.current === 'error') return;
        fail(issue.message || 'Unable to join this session. Check the code and try again.');
      }
    };
    const disconnected = () => {
      if (!credentials.current || connectionRef.current === 'error') return;
      credentials.current.joined = false;
      status('reconnecting'); openWindow();
    };
    joinNow.current = connected;
    sessionSocket.on('connect', connected);
    sessionSocket.on('disconnect', disconnected);
    sessionSocket.on('session-state', receive);
    return () => {
      credentials.current = null;
      joining.current?.abort(); timers.current.forEach(clearTimeout);
      sessionSocket.off('connect', connected); sessionSocket.off('disconnect', disconnected); sessionSocket.off('session-state', receive);
      sessionSocket.disconnect();
    };
  }, [fail, openWindow, receive, status]);

  const begin = useCallback(({ code, participant, hostToken }) => {
    pendingEnd.current = null;
    joining.current?.abort();
    credentials.current = { code, participant: { name: participant.name, avatar: { ...participant.avatar } }, hostToken, resumeToken: newResumeToken(), joined: false };
    current.current = null; setSession(null); setError(''); status('connecting'); openWindow();
    if (sessionSocket.connected) joinNow.current(); else sessionSocket.connect();
  }, [openWindow, status]);
  const retry = useCallback(() => {
    if (!credentials.current) return;
    setError(''); status(current.current ? 'reconnecting' : 'connecting'); openWindow();
    if (sessionSocket.connected) joinNow.current(); else sessionSocket.connect();
  }, [openWindow, status]);
  const stop = useCallback(() => {
    pendingEnd.current = null;
    credentials.current = null; current.current = null;
    joining.current?.abort(); clearTimers(); sessionSocket.disconnect();
    setSession(null); setError(''); status('idle');
  }, [clearTimers, status]);
  const command = useCallback(async (event, payload = {}, { signal } = {}) => {
    const identity = credentials.current;
    if (!identity || connectionRef.current !== 'connected' || !current.current) throw new Error('Reconnect before continuing. Your draft is still on this device.');
    const round = current.current.round;
    const ownEnd = () => event === 'end-session' && current.current?.code === identity.code && current.current?.round === round && current.current?.phase === 'ended';
    const ownRestart = () => event === 'restart-scenario' && credentials.current === identity && current.current?.code === identity.code && current.current?.round === round + 1 && current.current?.phase === 'lobby';
    const stale = () => credentials.current !== identity || current.current?.round !== round;
    const endRequest = event === 'end-session' ? {} : null;
    if (endRequest) pendingEnd.current = endRequest;
    try {
      const result = await requestSession(event, { ...payload, round }, { signal });
      if (stale() && !ownEnd() && !ownRestart()) throw new DOMException('This action belongs to an earlier session or scenario.', 'AbortError');
      if (credentials.current === identity) receive(result.session);
      return result;
    } catch (issue) {
      if (ownEnd()) return { ok: true, session: current.current };
      if (ownRestart()) return { ok: true, session: current.current };
      if (stale()) throw new DOMException('This action belongs to an earlier session or scenario.', 'AbortError');
      throw issue;
    } finally {
      if (event === 'end-session') {
        if (pendingEnd.current === endRequest) pendingEnd.current = null;
        if (ownEnd()) sessionSocket.disconnect();
      }
    }
  }, [receive]);
  return { session, connection, error, slow, begin, retry, stop, command };
}
