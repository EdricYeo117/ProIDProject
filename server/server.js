// server/server.js
require("dotenv").config();
const https = require("https");
const fs = require("fs");
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
const achievementTypesRoutes = require("./routes/achievementTypes.routes");
const hofCommentsRoutes = require("./routes/hofComments.routes");

const BOARD_FALLBACK = "NP-MEMORY-WALL-2025";

const app = express();
app.set("trust proxy", 1);

/* ---------- CORS ---------- */
const isProd = process.env.NODE_ENV === "production";

// Set this in production to your Cloudflare domain, e.g. https://yourdomain.com
// You can also add https://www.yourdomain.com if you use it.
const PROD_ORIGINS = [
  process.env.CLIENT_ORIGIN,       // e.g. https://yourdomain.com
  process.env.CLIENT_ORIGIN_WWW,   // e.g. https://www.yourdomain.com (optional)
].filter(Boolean);

// Keep local dev + current vercel preview if you still use it
const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://pro-id-project.vercel.app",
];

const allowedOrigins = isProd
  ? PROD_ORIGINS
  : [...DEV_ORIGINS, ...PROD_ORIGINS];

// Normalize into a Set for fast lookup
const whitelist = new Set(allowedOrigins);

const corsOrigin =
  isProd
    ? (origin, cb) => {
      // Allow same-origin tools / health checks that send no Origin header
      if (!origin) return cb(null, true);
      return whitelist.has(origin)
        ? cb(null, true)
        : cb(new Error(`CORS blocked: ${origin}`));
    }
    : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));

/* ---------- Basic API routes (non-socket) ---------- */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", hofRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/milestones", milestonesRoutes);
app.use("/api/boards", boardsRoutes);
app.use(achievementTypesRoutes);
app.use("/api/hof", hofCommentsRoutes);

/* ---------- HTTP server + Socket.IO ---------- */
const PORT = Number(process.env.PORT) || 8080;

let server;

if (process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH) {
  server = https.createServer(
    {
      cert: fs.readFileSync(process.env.SSL_CERT_PATH),
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
    },
    app,
  );
  console.log("HTTPS enabled (cert/key loaded).");
} else {
  server = http.createServer(app);
  console.log("HTTP enabled (no cert/key paths set).");
}

const io = new Server(server, {
  cors: {
    origin: corsOrigin, // <-- use the same policy as Express
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// mount messages routes AFTER io is created
const messagesRouter = createMessagesRouter(io);
app.use("/api/messages", messagesRouter);

/* ---------- Helpers ---------- */
function normalizeBoardKey(boardKey) {
  const key = (boardKey || BOARD_FALLBACK).toString().trim().toUpperCase();
  if (!/^[A-Z0-9-_]{3,64}$/.test(key)) return BOARD_FALLBACK;
  return key;
}

function toIso(v) {
  return v instanceof Date ? v.toISOString() : String(v);
}

// Align with your frontend REACTION_OPTIONS
const ALLOWED_REACTIONS = new Set(["❤️", "👏", "😂", "😮", "🙏"]);

function normalizeEmoji(emoji) {
  const e = String(emoji || "").trim();
  if (!e) return null;
  if (!ALLOWED_REACTIONS.has(e)) return null; // prevent random garbage
  return e;
}

async function loadBoardAndMessages(boardKey) {
  // 1) resolve board
  const boardRes = await db.execute(
    `SELECT BOARD_ID, BOARD_KEY, TITLE
       FROM CANVAS_BOARD
      WHERE BOARD_KEY = :board_key`,
    { board_key: boardKey },
  );

  const boardRows = boardRes.rows || [];
  if (boardRows.length === 0) return { boardId: null, messages: [] };

  const boardId = boardRows[0].BOARD_ID;

  // 2) load messages
  const msgRes = await db.execute(
    `
    SELECT
      MESSAGE_ID,
      X_COORD,
      Y_COORD,
      NOTE_COLOR,
      MESSAGE_TEXT,
      AUTHOR_NAME,
      FEEL_EMOJI,
      CREATED_AT
    FROM CANVAS_MESSAGES
    WHERE BOARD_ID = :board_id
    ORDER BY CREATED_AT ASC
  `,
    { board_id: boardId },
  );

  const rows = msgRes.rows || [];

  const messages = rows.map((r) => ({
    id: String(r.MESSAGE_ID),
    boardKey,
    x: Number(r.X_COORD),
    y: Number(r.Y_COORD),
    text: r.MESSAGE_TEXT,
    author: r.AUTHOR_NAME || "Anonymous",
    createdAt: toIso(r.CREATED_AT),
    color: r.NOTE_COLOR || "sky",
    feel: r.FEEL_EMOJI || null, // IMPORTANT: frontend expects m.feel
    reactions: {}, // populated next
  }));

  // 3) load aggregated reaction counts for this board
  //    Uses CANVAS_MESSAGE_REACTION_COUNTS (recommended for public board)
  const rxRes = await db.execute(
    `
    SELECT
      rc.MESSAGE_ID,
      rc.EMOJI,
      rc.REACTION_COUNT
    FROM CANVAS_MESSAGE_REACTION_COUNTS rc
    JOIN CANVAS_MESSAGES m
      ON m.MESSAGE_ID = rc.MESSAGE_ID
    WHERE m.BOARD_ID = :board_id
  `,
    { board_id: boardId },
  );

  const rxRows = rxRes.rows || [];
  const rxByMessageId = new Map(); // messageId -> {emoji: count}

  for (const rr of rxRows) {
    const mid = String(rr.MESSAGE_ID);
    if (!rxByMessageId.has(mid)) rxByMessageId.set(mid, {});
    rxByMessageId.get(mid)[rr.EMOJI] = Number(rr.REACTION_COUNT);
  }

  for (const m of messages) {
    m.reactions = rxByMessageId.get(m.id) || {};
  }

  return { boardId, messages };
}

async function incrementReactionCount(messageId, emoji) {
  // Atomic upsert+increment
  await db.execute(
    `
    MERGE INTO CANVAS_MESSAGE_REACTION_COUNTS t
    USING (SELECT :message_id AS message_id, :emoji AS emoji FROM dual) src
    ON (t.message_id = src.message_id AND t.emoji = src.emoji)
    WHEN MATCHED THEN UPDATE SET
      t.reaction_count = t.reaction_count + 1,
      t.updated_at = SYSTIMESTAMP
    WHEN NOT MATCHED THEN INSERT (message_id, emoji, reaction_count, updated_at)
    VALUES (src.message_id, src.emoji, 1, SYSTIMESTAMP)
  `,
    { message_id: Number(messageId), emoji },
  );

  const res = await db.execute(
    `
    SELECT reaction_count AS CNT
    FROM CANVAS_MESSAGE_REACTION_COUNTS
    WHERE message_id = :message_id
      AND emoji = :emoji
  `,
    { message_id: Number(messageId), emoji },
  );

  const row = (res.rows || [])[0];
  return row ? Number(row.CNT) : 0;
}

/* ---------- WebSocket handlers ---------- */
io.on("connection", (socket) => {
  console.log("Canvas client connected:", socket.id);

  socket.on("canvas:join", async ({ boardKey }) => {
    const key = normalizeBoardKey(boardKey);
    console.log(`Socket ${socket.id} joining board`, key);

    try {
      const { boardId, messages } = await loadBoardAndMessages(key);
      if (!boardId) {
        socket.emit("canvas:init-error", { message: "Board not found" });
        return;
      }

      // leave other rooms (optional)
      for (const room of socket.rooms) {
        if (room !== socket.id) socket.leave(room);
      }

      socket.join(key);
      socket.emit("canvas:init", { boardKey: key, messages });
    } catch (err) {
      console.error("canvas:join error:", err);
      socket.emit("canvas:init-error", { message: "Failed to load messages" });
    }
  });

  // Public board reactions: every click increments total
  // payload: { boardKey, messageId, emoji, reactorKey? }
  socket.on("canvas:react", async (payload) => {
    try {
      const boardKey = normalizeBoardKey(payload?.boardKey);
      const messageId = String(payload?.messageId || "").trim();
      const emoji = normalizeEmoji(payload?.emoji);

      if (!boardKey || !messageId || !emoji) return;

      // Ensure message belongs to board (prevents cross-board increment)
      const msgCheck = await db.execute(
        `
        SELECT m.MESSAGE_ID
        FROM CANVAS_MESSAGES m
        JOIN CANVAS_BOARD b ON b.BOARD_ID = m.BOARD_ID
        WHERE b.BOARD_KEY = :board_key
          AND m.MESSAGE_ID = :message_id
      `,
        { board_key: boardKey, message_id: Number(messageId) },
      );

      if (!(msgCheck.rows || []).length) return;

      const count = await incrementReactionCount(messageId, emoji);

      // Broadcast to everyone viewing this board
      io.to(boardKey).emit("canvas:reaction-update", {
        messageId: String(messageId),
        emoji,
        count,
      });
    } catch (err) {
      console.error("canvas:react error:", err);
      socket.emit("canvas:reaction-error", {
        message: "Failed to save reaction",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Canvas client disconnected:", socket.id);
  });
});

// /* ---------- Static SPA (optional for production) ---------- */
// if (isProd) {
//   const distDir = path.join(__dirname, "..", "dist");
//   app.use(express.static(distDir));

//   app.get("*", (req, res, next) => {
//     if (req.path.startsWith("/api")) return next();
//     res.sendFile(path.join(distDir, "index.html"));
//   });
// }

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
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`HOF API + Canvas WebSocket listening on :${PORT}`);
    });
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
