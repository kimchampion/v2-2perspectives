import { io } from "socket.io-client";

const SESSION_SERVER =
  import.meta.env.VITE_SESSION_SERVER || "http://localhost:3001";

export const sessionSocket = io(SESSION_SERVER);

export async function createSession() {
  const response = await fetch(`${SESSION_SERVER}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Unable to create session.");
  }

  return response.json();
}

export function joinSession(code, participant) {
  sessionSocket.emit("join-session", {
    code,
    participant
  });
}

export function submitPerspective(response, drawing) {
  sessionSocket.emit("submit-perspective", {
    response,
    drawing
  });
}

export function chooseRepairStep(repairChoice) {
  sessionSocket.emit("choose-repair-step", {
    repairChoice
  });
}
