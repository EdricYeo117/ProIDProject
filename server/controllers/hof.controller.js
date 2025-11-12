// src/controllers/hof.controller.js
const model = require('../models/hof.model');

async function getSchools(req, res) {
  try {
    const rows = await model.getSchools();
    // prepend synthetic "All Schools" for your UI
    res.json([{ id: 'all', name: 'All Schools', color: '#003D5C' }, ...rows]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
}

async function getCategories(req, res) {
  try {
    const rows = await model.getCategories();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function getHof(req, res) {
  const { category, school, featuredOnly, limit, offset } = req.query;
  try {
    const data = await model.getHallOfFame({
      categoryId: category || null,
      schoolId: school && school !== 'all' ? school : null,
      featuredOnly: String(featuredOnly || 'false').toLowerCase() === 'true',
      limit,
      offset
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch hall of fame list' });
  }
}

async function getPerson(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid person id' });

  try {
    const header = await model.getPersonHeader(id);
    if (!header) return res.status(404).json({ error: 'Not found' });

    const [achievements, cca] = await Promise.all([
      model.getPersonAchievements(id),
      model.getPersonCca(id)
    ]);

    res.json({
      ...header,
      achievements,
      cca_activities: cca
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch person' });
  }
}

module.exports = { getSchools, getCategories, getHof, getPerson };
