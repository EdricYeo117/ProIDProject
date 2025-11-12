// server/controllers/milestones.controller.js
const oracledb = require('oracledb');
const { getConnection } = require('../services/db.service');

// optional: put once at app startup (e.g., server.js) if you prefer objects globally
// oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// oracledb.fetchAsString = [ oracledb.CLOB ];

async function listMilestones(req, res) {
  const { fromYear, toYear, category } = req.query;
  const sql = `
    SELECT
      id, year, title, description, category, era_name, image_url, display_order,
      created_at, updated_at
    FROM milestones
    WHERE ( :fromYear IS NULL OR year >= :fromYear )
      AND ( :toYear   IS NULL OR year <= :toYear )
      AND ( :category IS NULL OR category = :category )
    ORDER BY year, NVL(display_order, 999999), id
  `;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      sql,
      {
        fromYear: fromYear ? Number(fromYear) : null,
        toYear:   toYear   ? Number(toYear)   : null,
        category: category || null,
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (e) {
    console.error('[listMilestones] error:', e);
    res.status(500).json({ error: 'Failed to list milestones' });
  } finally { try { await conn?.close(); } catch {} }
}

async function getMilestoneById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id, year, title, description, category, era_name, image_url, display_order
       FROM milestones WHERE id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const row = result.rows?.[0];
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error('[getMilestoneById] error:', e);
    res.status(500).json({ error: 'Failed to fetch milestone' });
  } finally { try { await conn?.close(); } catch {} }
}

// (Optional admin endpoints below – implement only if needed)
async function createMilestone(req, res) {
  const b = req.body || {};
  if (!b.year || !b.title || !b.description) {
    return res.status(400).json({ error: 'year, title, description are required' });
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO milestones (year, title, description, category, era_name, image_url, display_order)
       VALUES (:year, :title, :description, :category, :era_name, :image_url, :display_order)
       RETURNING id INTO :out_id`,
      {
        year: Number(b.year),
        title: b.title,
        description: b.description,
        category: b.category || null,
        era_name: b.era_name || null,
        image_url: b.image_url || null,
        display_order: b.display_order ?? null,
        out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );
    res.json({ ok: true, id: result.outBinds.out_id[0] });
  } catch (e) {
    console.error('[createMilestone] error:', e);
    res.status(500).json({ error: 'Failed to create milestone' });
  } finally { try { await conn?.close(); } catch {} }
}

module.exports = {
  listMilestones,
  getMilestoneById,
  // export these only if you need them
  createMilestone,
  // updateMilestone,
  // deleteMilestone,
};
