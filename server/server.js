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
const createMessagesRouter = require("./routes/messages.routes"); // function(io)

const BOARD_KEY = "NP-MEMORY-WALL-2025";

const app = express();

/* ---------- CORS ---------- */
const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  process.env.CLIENT_ORIGIN, // e.g. https://yourdomain.com
].filter(Boolean);

const whitelist = new Set(allowedOrigins);

const corsOrigin = isProd
  ? (origin, cb) => {
      if (!origin) return cb(null, true); // Postman/curl
      return whitelist.has(origin)
        ? cb(null, true)
        : cb(new Error("CORS blocked"));
    }
  : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "2mb" }));

/* ---------- Basic API routes ---------- */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", hofRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/milestones", milestonesRoutes);

/* ---------- HTTP server + Socket.IO ---------- */
const port = Number(process.env.PORT) || 8080;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST"],
  },
});

// On socket connection, send existing messages (retrieval via WebSocket)
io.on("connection", async (socket) => {
  console.log("Canvas client connected:", socket.id);

  try {
    const sql = `
      SELECT
        m.MESSAGE_ID,
        m.X_COORD,
        m.Y_COORD,
        m.MESSAGE_TEXT,
        m.AUTHOR_NAME,
        m.CREATED_AT
      FROM CANVAS_MESSAGES m
      JOIN CANVAS_BOARD b
        ON m.BOARD_ID = b.BOARD_ID
      WHERE b.BOARD_KEY = :board_key
      ORDER BY m.CREATED_AT ASC
    `;

    const result = await db.execute(sql, { board_key: BOARD_KEY });
    const rows = result.rows || [];

    const messages = rows.map((r) => ({
      id: String(r.MESSAGE_ID),
      x: r.X_COORD,
      y: r.Y_COORD,
      text: r.MESSAGE_TEXT,
      author: r.AUTHOR_NAME,
      createdAt:
        r.CREATED_AT instanceof Date
          ? r.CREATED_AT.toISOString()
          : String(r.CREATED_AT),
    }));

    // send initial payload only to this socket
    socket.emit("canvas:init", messages);
  } catch (err) {
    console.error("Socket init error:", err);
    socket.emit("canvas:init-error", { message: "Failed to load messages" });
  }

  socket.on("disconnect", () => {
    console.log("Canvas client disconnected:", socket.id);
  });
});

/* ---------- Messages HTTP routes (insert only) ---------- */
// pass io into messages router so it can broadcast new messages
const messagesRouter = createMessagesRouter(io);
app.use("/api/messages", messagesRouter);

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
