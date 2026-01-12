const express = require("express");
const oracledb = require("oracledb");
const db = require("../services/db.service");

// factory so we can use io
module.exports = function createMessagesRouter(io) {
  const router = express.Router();

  // POST /api/messages -> insert into Oracle + emit to that board room
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

color = typeof color === "string" && ["sky", "emerald", "amber", "violet"].includes(color)
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
  board_id: boardId,                          // NUMBER
  x: Number(x),                               // NUMBER
  y: Number(y),                               // NUMBER
  note_color: color || "sky",                 // VARCHAR2
  message_text: text,                         // VARCHAR2
  author_name: author || "Anonymous",         // VARCHAR2
  feel_emoji: feel || null,                   // VARCHAR2(8 CHAR) or null

  // OUT binds (these are placeholders too, so they count)
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
  createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
  color,         // IMPORTANT: send back for UI
  feel,          // IMPORTANT: send back for UI
  reactions: {}, // optional: initialize so UI shows 0 counts consistently
};

      // emit only to that board
      io.to(boardKey).emit("canvas:new-message", messageDto);

      res.status(201).json(messageDto);
    } catch (err) {
      console.error("POST /api/messages error:", err);
      res
        .status(500)
        .json({ error: "Failed to save message", details: err.message });
    }
  });

  return router;
};
