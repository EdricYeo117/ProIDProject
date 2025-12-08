const express = require("express");
const oracledb = require("oracledb");
const db = require("../services/db.service");

const router = express.Router();

// GET /api/boards  -> list boards
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        BOARD_ID,
        BOARD_KEY,
        TITLE,
        DESCRIPTION,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        IS_ACTIVE,
        CREATED_AT
      FROM CANVAS_BOARD
      ORDER BY CREATED_AT ASC
    `;

    const result = await db.execute(sql, {});
    const rows = result.rows || [];

    const boards = rows.map((r) => ({
      boardId: r.BOARD_ID,
      boardKey: r.BOARD_KEY,
      title: r.TITLE,
      description: r.DESCRIPTION,
      worldWidth: r.WORLD_WIDTH,
      worldHeight: r.WORLD_HEIGHT,
      isActive: r.IS_ACTIVE,
      createdAt:
        r.CREATED_AT instanceof Date
          ? r.CREATED_AT.toISOString()
          : String(r.CREATED_AT),
    }));

    res.json(boards);
  } catch (err) {
    console.error("GET /api/boards error:", err);
    res.status(500).json({ error: "Failed to load boards" });
  }
});

// POST /api/boards  -> create a new board
router.post("/", async (req, res) => {
  let { boardKey, title, description } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  title = title.trim();
  description =
    description && String(description).trim()
      ? String(description).trim()
      : null;

  // If no boardKey provided, derive from title
  if (!boardKey || !String(boardKey).trim()) {
    boardKey = title
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/[^A-Z0-9-]/g, "");
  } else {
    boardKey = String(boardKey).trim().toUpperCase();
  }

  try {
    // check uniqueness
    const check = await db.execute(
      `SELECT 1 FROM CANVAS_BOARD WHERE BOARD_KEY = :board_key`,
      { board_key: boardKey }
    );
    if ((check.rows || []).length > 0) {
      return res
        .status(409)
        .json({ error: "Board key already exists", boardKey });
    }

    const sql = `
      INSERT INTO CANVAS_BOARD (
        BOARD_KEY,
        TITLE,
        DESCRIPTION
      )
      VALUES (:board_key, :title, :description)
      RETURNING BOARD_ID, CREATED_AT
      INTO :id_out, :created_at_out
    `;

    const binds = {
      board_key: boardKey,
      title,
      description,
      id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      created_at_out: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
    };

    const result = await db.execute(sql, binds, { autoCommit: true });

    const boardId = result.outBinds.id_out[0];
    const createdAt = result.outBinds.created_at_out[0];

    const dto = {
      boardId,
      boardKey,
      title,
      description,
      isActive: "Y",
      worldWidth: 5000,
      worldHeight: 5000,
      createdAt:
        createdAt instanceof Date
          ? createdAt.toISOString()
          : String(createdAt),
    };

    res.status(201).json(dto);
  } catch (err) {
    console.error("POST /api/boards error:", err);
    res.status(500).json({ error: "Failed to create board", details: err.message });
  }
});

module.exports = router;
