// server/routes/messages.routes.js
const express = require("express");
const oracledb = require("oracledb");
const db = require("../services/db.service");

const BOARD_KEY = "NP-MEMORY-WALL-2025";

module.exports = function createMessagesRouter(io) {
  const router = express.Router();

  // POST /api/messages  -> insert into Oracle, then broadcast via WebSocket
  router.post("/", async (req, res) => {
    let { x, y, text, author } = req.body;

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
      author && String(author).trim()
        ? String(author).trim()
        : "Anonymous";

    try {
      // get board_id for this BOARD_KEY
      const boardResult = await db.execute(
        `SELECT BOARD_ID FROM CANVAS_BOARD WHERE BOARD_KEY = :board_key`,
        { board_key: BOARD_KEY }
      );
      const boardRows = boardResult.rows || [];

      if (boardRows.length === 0) {
        console.error("No board found for BOARD_KEY =", BOARD_KEY);
        return res.status(500).json({ error: "Board configuration missing" });
      }

      const boardId = boardRows[0].BOARD_ID;

      const sql = `
        INSERT INTO CANVAS_MESSAGES (
          BOARD_ID,
          X_COORD,
          Y_COORD,
          MESSAGE_TEXT,
          AUTHOR_NAME
        )
        VALUES (
          :board_id,
          :x,
          :y,
          :text,
          :author
        )
        RETURNING MESSAGE_ID, CREATED_AT
        INTO :id_out, :created_at_out
      `;

      const binds = {
        board_id: boardId,
        x,
        y,
        text,
        author,
        id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        created_at_out: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
      };

      const result = await db.execute(sql, binds, { autoCommit: true });

      const id = result.outBinds.id_out[0];
      const createdAt = result.outBinds.created_at_out[0];

      const messageDto = {
        id: String(id),
        x,
        y,
        text,
        author,
        createdAt:
          createdAt instanceof Date
            ? createdAt.toISOString()
            : String(createdAt),
      };

      // broadcast to all connected clients (retrieval via WebSocket)
      io.emit("canvas:new-message", messageDto);

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
