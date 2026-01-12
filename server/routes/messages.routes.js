// server/routes/messages.routes.js
const express = require("express");
const oracledb = require("oracledb");
const db = require("../services/db.service");

// factory so we can use io
module.exports = function createMessagesRouter(io) {
  const router = express.Router();

  // ─────────────────────────────────────────────────────────────
  // Collision layout module (world-space units)
  // Ensures newly inserted messages do not overlap when cards are
  // always rendered on the client.
  // ─────────────────────────────────────────────────────────────
  const WORLD_SIZE = 5000;

  // Match your card footprint (world-space, since you render in a scaled container)
  const CARD_W = 360;
  const CARD_H = 240; // tune if needed
  const PAD = 20;

  // Card appears below the dot (mt-2). Approx translate to world units:
  const CARD_OFFSET_Y = 14;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function rectForMessage(x, y) {
    // dot is at (x,y); card starts below it
    return { x, y: y + CARD_OFFSET_Y, w: CARD_W, h: CARD_H };
  }

  function intersects(a, b) {
    return !(
      a.x + a.w + PAD <= b.x ||
      b.x + b.w + PAD <= a.x ||
      a.y + a.h + PAD <= b.y ||
      b.y + b.h + PAD <= a.y
    );
  }

  function findFreeSpot(desiredX, desiredY, existingRects) {
    const baseX = clamp(desiredX, 0, WORLD_SIZE - CARD_W);
    const baseY = clamp(desiredY, 0, WORLD_SIZE - CARD_H - CARD_OFFSET_Y);

    const isFree = (x, y) => {
      const r = rectForMessage(x, y);
      for (const ex of existingRects) {
        if (intersects(r, ex)) return false;
      }
      return true;
    };

    if (isFree(baseX, baseY)) return { x: baseX, y: baseY };

    // Spiral search around desired point
    const step = 30;
    const maxRadius = 900;

    for (let radius = step; radius <= maxRadius; radius += step) {
      const points = Math.max(12, Math.floor((2 * Math.PI * radius) / step));
      for (let i = 0; i < points; i++) {
        const t = (i / points) * 2 * Math.PI;
        const x = clamp(
          baseX + Math.round(radius * Math.cos(t)),
          0,
          WORLD_SIZE - CARD_W
        );
        const y = clamp(
          baseY + Math.round(radius * Math.sin(t)),
          0,
          WORLD_SIZE - CARD_H - CARD_OFFSET_Y
        );
        if (isFree(x, y)) return { x, y };
      }
    }

    return { x: baseX, y: baseY }; // fallback if dense
  }

  // ─────────────────────────────────────────────────────────────
  // POST /api/messages -> insert into Oracle + emit to that board room
  // ─────────────────────────────────────────────────────────────
  router.post("/", async (req, res) => {
    let { boardKey, x, y, text, author, color, feel } = req.body;

    if (!boardKey || typeof boardKey !== "string") {
      return res.status(400).json({ error: "boardKey is required" });
    }

    boardKey = boardKey.trim().toUpperCase();

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    text = text.trim();
    author =
      author && String(author).trim() ? String(author).trim() : "Anonymous";

    color =
      typeof color === "string" &&
      ["sky", "emerald", "amber", "violet"].includes(color)
        ? color
        : "sky";

    feel = typeof feel === "string" && feel.trim() ? feel.trim() : null;

    try {
      // find board_id
      const boardRes = await db.execute(
        `SELECT BOARD_ID FROM CANVAS_BOARD WHERE BOARD_KEY = :board_key`,
        { board_key: boardKey }
      );
      const boardRows = boardRes.rows || [];
      if (boardRows.length === 0) {
        return res.status(400).json({ error: "Board does not exist" });
      }
      const boardId = boardRows[0].BOARD_ID;

      // ── Collision-safe placement (load existing, then find free spot)
      const existingRes = await db.execute(
        `SELECT X_COORD, Y_COORD FROM CANVAS_MESSAGES WHERE BOARD_ID = :board_id`,
        { board_id: boardId }
      );

      const existingRects = (existingRes.rows || []).map((r) =>
        rectForMessage(Number(r.X_COORD), Number(r.Y_COORD))
      );

      const placed = findFreeSpot(Number(x), Number(y), existingRects);
      x = placed.x;
      y = placed.y;

      const sql = `
        INSERT INTO CANVAS_MESSAGES (
          BOARD_ID,
          X_COORD,
          Y_COORD,
          NOTE_COLOR,
          MESSAGE_TEXT,
          AUTHOR_NAME,
          FEEL_EMOJI
        ) VALUES (
          :board_id,
          :x,
          :y,
          :note_color,
          :message_text,
          :author_name,
          :feel_emoji
        )
        RETURNING MESSAGE_ID, CREATED_AT INTO :message_id, :created_at
      `;

      const binds = {
        board_id: boardId, // NUMBER
        x: Number(x), // NUMBER (placed)
        y: Number(y), // NUMBER (placed)
        note_color: color || "sky", // VARCHAR2
        message_text: text, // VARCHAR2
        author_name: author || "Anonymous", // VARCHAR2
        feel_emoji: feel || null, // VARCHAR2(8 CHAR) or null

        // OUT binds
        message_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        created_at: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
      };

      const result = await db.execute(sql, binds);

      // IMPORTANT: depending on your db.service, result.outBinds shape may vary
      const messageId = String(result.outBinds.message_id[0]);
      const createdAt = result.outBinds.created_at[0];

      const messageDto = {
        id: messageId,
        boardKey,
        x: Number(x),
        y: Number(y),
        text,
        author,
        createdAt:
          createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
        color, // send back for UI
        feel, // send back for UI
        reactions: {}, // optional
      };

      // emit only to that board room
      io.to(boardKey).emit("canvas:new-message", messageDto);

      return res.status(201).json(messageDto);
    } catch (err) {
      console.error("POST /api/messages error:", err);
      return res
        .status(500)
        .json({ error: "Failed to save message", details: err.message });
    }
  });

  return router;
};
