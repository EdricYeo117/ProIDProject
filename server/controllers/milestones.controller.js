// server/controllers/milestones.controller.js
const oracledb = require('oracledb');
const { getConnection } = require('../services/db.service');

const toLc = (row) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));

// Optional tiny guard for admin endpoints
function assertAdmin(req) {
  const key = req.header('x-admin-key');
  if (!key || key !== process.env.ADMIN_KEY) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

/** GET /api/milestones */
async function listMilestones(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 500, 5000);
  const fromYear = Number.isFinite(+req.query.fromYear) ? +req.query.fromYear : null;
  const toYear   = Number.isFinite(+req.query.toYear)   ? +req.query.toYear   : null;

  // Aliases return already-lowercased keys, but we still map toLc defensively.
  const sql = `
    SELECT
      id            "id",
      year          "year",
      title         "title",
      description   "description",
      category      "category",
      era_name      "era_name",
      image_url     "image_url",
      display_order "display_order",
      created_at    "created_at",
      updated_at    "updated_at"
    FROM milestones
    WHERE (:fromYear IS NULL OR year >= :fromYear)
      AND (:toYear   IS NULL OR year <= :toYear)
    ORDER BY year ASC, NVL(display_order, 0) ASC, id ASC
    FETCH FIRST :limit ROWS ONLY
  `;

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      sql,
      { fromYear, toYear, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json((result.rows || []).map(toLc));
  } catch (e) {
    console.error('listMilestones failed:', e);
    res.status(e.status || 500).json({ error: e.message || 'Failed to list milestones' });
  } finally {
    try { await conn?.close(); } catch {}
  }
}

/** GET /api/milestones/:id */
async function getMilestoneById(req, res) {
  const id = +req.params.id;
  const sql = `
    SELECT
      id "id", year "year", title "title", description "description",
      category "category", era_name "era_name", image_url "image_url",
      display_order "display_order", created_at "created_at", updated_at "updated_at"
    FROM milestones
    WHERE id = :id
  `;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(sql, { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const row = result.rows?.[0];
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toLc(row));
  } catch (e) {
    console.error('getMilestoneById failed:', e);
    res.status(500).json({ error: 'Failed to get milestone' });
  } finally {
    try { await conn?.close(); } catch {}
  }
}

/** POST /api/milestones (admin) */
async function createMilestone(req, res) {
  try { assertAdmin(req); } catch (e) { return res.status(e.status).json({ error: e.message }); }

  const b = req.body || {};
  if (!b.year || !b.title || !b.description) {
    return res.status(400).json({ error: 'year, title, description are required' });
  }

  const sql = `
    INSERT INTO milestones (
      year, title, description, category, era_name, image_url, display_order
    ) VALUES (
      :year, :title, :description, :category, :era_name, :image_url, :display_order
    )
    RETURNING id INTO :out_id
  `;

  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      sql,
      {
        year: +b.year,
        title: b.title,
        description: b.description,
        category: b.category ?? null,
        era_name: b.era_name ?? null,
        image_url: b.image_url ?? null,
        display_order: b.display_order ?? null,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    res.json({ ok: true, id: r.outBinds.out_id[0] });
  } catch (e) {
    console.error('createMilestone failed:', e);
    res.status(500).json({ error: 'Failed to create milestone' });
  } finally {
    try { await conn?.close(); } catch {}
  }
}

/** PUT /api/milestones/:id (admin) */
async function updateMilestone(req, res) {
  try { assertAdmin(req); } catch (e) { return res.status(e.status).json({ error: e.message }); }

  const id = +req.params.id;
  const b = req.body || {};
  const sql = `
    UPDATE milestones
    SET
      year=:year, title=:title, description=:description, category=:category,
      era_name=:era_name, image_url=:image_url, display_order=:display_order,
      updated_at = CURRENT_TIMESTAMP
    WHERE id=:id
  `;
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      sql,
      {
        id,
        year: +b.year,
        title: b.title,
        description: b.description,
        category: b.category ?? null,
        era_name: b.era_name ?? null,
        image_url: b.image_url ?? null,
        display_order: b.display_order ?? null
      },
      { autoCommit: true }
    );
    res.json({ ok: true, rowsAffected: r.rowsAffected });
  } catch (e) {
    console.error('updateMilestone failed:', e);
    res.status(500).json({ error: 'Failed to update milestone' });
  } finally {
    try { await conn?.close(); } catch {}
  }
}

/** DELETE /api/milestones/:id (admin) */
async function deleteMilestone(req, res) {
  try { assertAdmin(req); } catch (e) { return res.status(e.status).json({ error: e.message }); }

  const id = +req.params.id;
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute('DELETE FROM milestones WHERE id=:id', { id }, { autoCommit: true });
    res.json({ ok: true, rowsAffected: r.rowsAffected });
  } catch (e) {
    console.error('deleteMilestone failed:', e);
    res.status(500).json({ error: 'Failed to delete milestone' });
  } finally {
    try { await conn?.close(); } catch {}
  }
}

module.exports = {
  listMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
