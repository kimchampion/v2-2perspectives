import { io } from "socket.io-client";
import { normalizeSessionCode } from "../session.js";

const SESSION_SERVER =
  (import.meta.env?.VITE_SESSION_SERVER || "http://localhost:3001").replace(/\/+$/, "");

export const sessionSocket = io(SESSION_SERVER, {
  autoConnect: false,
});

export const SESSION_REQUEST_TIMEOUT = 5000;
export const SESSION_START_TIMEOUT = 75000;

export async function createSession({ fetchImpl = globalThis.fetch, signal, timeoutMs = SESSION_REQUEST_TIMEOUT } = {}) {
  if (signal?.aborted) throw signal.reason;
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  let rejectOnAbort;
  const aborted = new Promise((_resolve, reject) => { rejectOnAbort = reject; });
  const rejectAborted = () => rejectOnAbort(controller.signal.reason);
  controller.signal.addEventListener("abort", rejectAborted, { once: true });
  signal?.addEventListener("abort", cancel, { once: true });
  const duration = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? timeoutMs : SESSION_REQUEST_TIMEOUT;
  const timer = setTimeout(() => controller.abort(new DOMException("Session request timed out.", "TimeoutError")), duration);
  try {
    const request = (async () => {
      const response = await fetchImpl(`${SESSION_SERVER}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Unable to create session.");
      const session = await response.json();
      const code = normalizeSessionCode(session?.code);
      if (!session || Array.isArray(session) || !code) throw new Error("The server did not return a valid session code.");
      if (session.hostToken !== undefined && (typeof session.hostToken !== 'string' || !/^[a-f0-9]{64}$/.test(session.hostToken))) throw new Error('The server did not return a valid creator token.');
      return { code, ...(session.hostToken ? { hostToken: session.hostToken } : {}) };
    })();
    // Bound fetch and JSON parsing even if the underlying operation ignores abort.
    return await Promise.race([request, aborted]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    controller.signal.removeEventListener("abort", rejectAborted);
  }
}

export function requestSession(event, payload, { socket = sessionSocket, signal, timeoutMs = 10000 } = {}) {
  if (signal?.aborted) return Promise.reject(signal.reason);
  if (socket.connected === false) return Promise.reject(new Error('The connection was interrupted. Reconnect before trying again.'));
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      socket.off?.('disconnect', disconnected);
      if (error) reject(error); else resolve(result);
    };
    const abort = () => finish(signal.reason);
    const disconnected = () => finish(new Error('The connection was interrupted. Your draft is still on this device.'));
    const timer = setTimeout(() => finish(new DOMException('The session server did not confirm the action. Try again.', 'TimeoutError')), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    socket.on?.('disconnect', disconnected);
    try {
      socket.emit(event, payload, result => {
        if (result?.ok === true && result.session && typeof result.session === 'object') finish(null, result);
        else finish(Object.assign(new Error(result?.error?.message || 'The session server returned an invalid reply.'), { code: result?.error?.code || 'SESSION_ERROR' }));
      });
    } catch (error) { finish(error); }
  });
}

export function joinSession(code, participant, { hostToken, resumeToken, ...options } = {}) {
  if (options.signal?.aborted) return Promise.reject(options.signal.reason);
  sessionSocket.connect();
  return requestSession("join-session", {
    code: code.trim().toUpperCase(),
    participant,
    ...(hostToken ? { hostToken } : {}),
    ...(resumeToken ? { resumeToken } : {}),
  }, options);
}

export function submitPerspective(response, expression, round, options) {
  return requestSession('submit-perspective', { response, expression, round }, options);
}

export function chooseRepairStep(repairChoice, round, options) {
  return requestSession('choose-repair-step', { repairChoice, round }, options);
}
