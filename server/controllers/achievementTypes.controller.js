// controllers/achievementTypes.controller.js
const db = require('../services/db.service');

async function list(req, res) {
  const { categoryId } = req.query;

  if (!categoryId) {
    return res.status(400).json({ error: 'categoryId is required' });
  }

  try {
    const sql = `
      SELECT achievement_type_id, achievement_type_name
      FROM achievement_types
      WHERE category_id = :categoryId
      ORDER BY display_order NULLS FIRST, achievement_type_name
    `;
    const result = await db.execute(sql, { categoryId });

    const rows = result.rows || [];
    const items = rows.map((r) => ({
      achievement_type_id: r[0],
      achievement_type_name: r[1],
    }));

    return res.json(items); // always an array
  } catch (e) {
    console.error('Error loading achievement types', e);
    return res
      .status(500)
      .json({ error: 'Failed to load achievement types' });
  }
}

module.exports = { list };
