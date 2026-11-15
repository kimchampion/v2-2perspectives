import { io } from "socket.io-client";
import { normalizeSessionCode } from "../session.js";

const SESSION_SERVER =
  (import.meta.env?.VITE_SESSION_SERVER || "http://localhost:3001").replace(/\/+$/, "");

export const sessionSocket = io(SESSION_SERVER, {
  autoConnect: true,
});

export async function createSession({ fetchImpl = globalThis.fetch, signal, timeoutMs = 10000 } = {}) {
  if (signal?.aborted) throw signal.reason;
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException("Session request timed out.", "TimeoutError")), timeoutMs);
  try {
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
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

export function joinSession(code, participant) {
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
