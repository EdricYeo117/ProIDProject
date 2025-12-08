// server/server.js
require("dotenv").config();

const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const db = require("./services/db.service");
const { initPool, closePool } = db;

const hofRoutes = require("./routes/hof.routes");
const adminRoutes = require("./routes/admin.routes");
const milestonesRoutes = require("./routes/milestones.routes");
const createMessagesRouter = require("./routes/messages.routes"); // factory(io)
const boardsRoutes = require("./routes/boards.routes");
const achievementTypesRoutes = require('./routes/achievementTypes.routes');


const BOARD_FALLBACK = "NP-MEMORY-WALL-2025";

const app = express();

/* ---------- CORS ---------- */
const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

const whitelist = new Set(allowedOrigins);

const corsOrigin = isProd
  ? (origin, cb) => {
      if (!origin) return cb(null, true);
      return whitelist.has(origin)
        ? cb(null, true)
        : cb(new Error("CORS blocked"));
    }
  : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "2mb" }));

/* ---------- Basic API routes (non-socket) ---------- */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", hofRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/milestones", milestonesRoutes);
app.use("/api/boards", boardsRoutes);
app.use(achievementTypesRoutes);

/* ---------- HTTP server + Socket.IO ---------- */
const port = Number(process.env.PORT) || 8080;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST"],
  },
});

// mount messages routes AFTER io is created
const messagesRouter = createMessagesRouter(io);
app.use("/api/messages", messagesRouter);

// WebSocket: handle board join + initial messages
io.on("connection", (socket) => {
  console.log("Canvas client connected:", socket.id);

  socket.on("canvas:join", async ({ boardKey }) => {
    const key = (boardKey || BOARD_FALLBACK).toUpperCase();
    console.log(`Socket ${socket.id} joining board`, key);

    try {
      const boardRes = await db.execute(
        `SELECT BOARD_ID, BOARD_KEY, TITLE
           FROM CANVAS_BOARD
          WHERE BOARD_KEY = :board_key`,
        { board_key: key }
      );
      const boardRows = boardRes.rows || [];
      if (boardRows.length === 0) {
        socket.emit("canvas:init-error", { message: "Board not found" });
        return;
      }
      const boardId = boardRows[0].BOARD_ID;

      const msgRes = await db.execute(
        `
        SELECT
          MESSAGE_ID,
          X_COORD,
          Y_COORD,
          MESSAGE_TEXT,
          AUTHOR_NAME,
          CREATED_AT
        FROM CANVAS_MESSAGES
        WHERE BOARD_ID = :board_id
        ORDER BY CREATED_AT ASC
      `,
        { board_id: boardId }
      );

      const rows = msgRes.rows || [];
      const messages = rows.map((r) => ({
        id: String(r.MESSAGE_ID),
        boardKey: key,
        x: r.X_COORD,
        y: r.Y_COORD,
        text: r.MESSAGE_TEXT,
        author: r.AUTHOR_NAME,
        createdAt:
          r.CREATED_AT instanceof Date
            ? r.CREATED_AT.toISOString()
            : String(r.CREATED_AT),
      }));

      // leave other rooms (optional)
      Object.keys(socket.rooms)
        .filter((room) => room !== socket.id)
        .forEach((room) => socket.leave(room));

      socket.join(key);
      socket.emit("canvas:init", { boardKey: key, messages });
    } catch (err) {
      console.error("canvas:join error:", err);
      socket.emit("canvas:init-error", { message: "Failed to load messages" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Canvas client disconnected:", socket.id);
  });
});

/* ---------- Static SPA (optional for production) ---------- */
if (isProd) {
  const distDir = path.join(__dirname, "..", "dist");
  app.use(express.static(distDir));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

/* ---------- 404 & error handlers ---------- */
app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

/* ---------- Start ---------- */
(async () => {
  try {
    await initPool();
    server.listen(port, () =>
      console.log(`HOF API + Canvas WebSocket listening on :${port}`)
    );
  } catch (err) {
    console.error("Failed to initialize DB pool:", err);
    process.exit(1);
  }
})();

/* ---------- Graceful shutdown ---------- */
const shutdown = async () => {
  try {
    await closePool();
  } finally {
    process.exit(0);
  }
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
