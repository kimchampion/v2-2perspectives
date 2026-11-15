const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const sessions = new Map();

function createSessionCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

app.get("/", (req, res) => {
  res.json({
    status: "Two Perspectives session server is running"
  });
});

app.post("/api/sessions", (req, res) => {
  const code = createSessionCode();

  sessions.set(code, {
    code,
    participants: [],
    revealed: false,
    repairChoice: null
  });

  res.json({ code });
});

io.on("connection", (socket) => {
  console.log("Participant connected:", socket.id);

  socket.on("join-session", ({ code, participant }) => {
    const session = sessions.get(code);

    if (!session) {
      socket.emit("session-error", {
        message: "Session not found."
      });
      return;
    }

    if (session.participants.length >= 2) {
      socket.emit("session-error", {
        message: "This session already has two participants."
      });
      return;
    }

    socket.join(code);

    session.participants.push({
      socketId: socket.id,
      participant,
      response: null,
      drawing: null
    });

    socket.sessionCode = code;
    socket.participant = participant;

    io.to(code).emit("session-updated", {
      participantCount: session.participants.length
    });
  });

  socket.on("submit-perspective", ({ response, drawing }) => {
    const code = socket.sessionCode;
    const session = sessions.get(code);

    if (!session) return;

    const person = session.participants.find(
      (item) => item.socketId === socket.id
    );

    if (!person) return;

    person.response = response;
    person.drawing = drawing;

    const everyoneSubmitted =
      session.participants.length === 2 &&
      session.participants.every(
        (item) => item.response && item.drawing
      );

    if (everyoneSubmitted) {
      session.revealed = true;

      io.to(code).emit("perspectives-revealed", {
        perspectives: session.participants.map((item) => ({
          participant: item.participant,
          response: item.response,
          drawing: item.drawing
        }))
      });
    }
  });

  socket.on("choose-repair-step", ({ repairChoice }) => {
    const code = socket.sessionCode;
    const session = sessions.get(code);

    if (!session) return;

    session.repairChoice = repairChoice;

    io.to(code).emit("repair-step-selected", {
      repairChoice
    });
  });

  socket.on("disconnect", () => {
    const code = socket.sessionCode;
    const session = sessions.get(code);

    if (!session) return;

    session.participants = session.participants.filter(
      (item) => item.socketId !== socket.id
    );

    io.to(code).emit("session-updated", {
      participantCount: session.participants.length
    });

    console.log("Participant disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Two Perspectives server running on port ${PORT}`);
});
