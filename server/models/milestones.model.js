// server/models/milestones.model.js
const db = require('../services/db.service');

async function listMilestones({
  fromYear = null,
  toYear = null,
  category = null,
  era = null,
  q = null,
  limit = 2000,
  offset = 0
} = {}) {
  const sql = `
    SELECT
      id,
      year,
      title,
      description,
      category,
      era_name,
      image_url,
      display_order,
      created_at,
      updated_at
    FROM milestones
    WHERE (:fromYear IS NULL OR year >= :fromYear)
      AND (:toYear   IS NULL OR year <= :toYear)
      AND (:category IS NULL OR category = :category)
      AND (:era      IS NULL OR era_name = :era)
      AND (
        :q IS NULL
        OR LOWER(title) LIKE :qLike
        OR LOWER(description) LIKE :qLike
      )
    ORDER BY year, display_order, id
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
  `;
  const binds = {
    fromYear,
    toYear,
    category,
    era,
    q,
    qLike: q ? `%${String(q).toLowerCase()}%` : null,
    limit: Number(limit) || 2000,
    offset: Number(offset) || 0
  };
  const { rows } = await db.execute(sql, binds);
  return rows;
}

async function minMaxYears() {
  const sql = `SELECT MIN(year) AS min_year, MAX(year) AS max_year FROM milestones`;
  const { rows } = await db.execute(sql);
  return rows[0] || { min_year: null, max_year: null };
}

async function getById(id) {
  const sql = `
    SELECT id, year, title, description, category, era_name, image_url, display_order,
           created_at, updated_at
    FROM milestones WHERE id = :id
  `;
  const { rows } = await db.execute(sql, { id: Number(id) });
  return rows[0] || null;
}

module.exports = { listMilestones, minMaxYears, getById };
