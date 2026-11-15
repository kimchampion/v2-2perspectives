import { io } from "socket.io-client";
import { normalizeSessionCode } from "../session.js";

const SESSION_SERVER =
  (import.meta.env?.VITE_SESSION_SERVER || "http://localhost:3001").replace(/\/+$/, "");

export const sessionSocket = io(SESSION_SERVER, {
  autoConnect: false,
});

export const SESSION_REQUEST_TIMEOUT = 5000;

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
      return { code };
    })();
    // Bound fetch and JSON parsing even if the underlying operation ignores abort.
    return await Promise.race([request, aborted]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    controller.signal.removeEventListener("abort", rejectAborted);
  }
}

export function joinSession(code, participant) {
  sessionSocket.connect();
  sessionSocket.emit("join-session", {
    code: code.trim().toUpperCase(),
    participant,
  });
}

export function submitPerspective(response, drawing) {
  sessionSocket.emit("submit-perspective", {
    response,
    drawing,
  });
}

export function chooseRepairStep(repairChoice) {
  sessionSocket.emit("choose-repair-step", {
    repairChoice,
  });
}
