const { createPerson } = require('../models/person.model');

function requireFields(body, fields) {
  for (const f of fields) if (!body || body[f] == null || body[f] === '')
    return f;
  return null;
}

async function postPerson(req, res) {
  try {
    const missing = requireFields(req.body, ['category_id', 'school_id', 'full_name']);
    if (missing) return res.status(400).json({ error: `Missing required field: ${missing}` });

    const person = await createPerson(req.body);
    return res.status(201).json(person);
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes('ORA-00001')) {
      // unique (full_name, category_id, school_id)
      return res.status(409).json({ error: 'Person already exists for this category & school' });
    }
    if (msg.includes('ORA-02291') || msg.includes('ORA-02292')) {
      // FK violations
      return res.status(400).json({ error: 'Invalid category_id or school_id (FK violation)' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Failed to create person' });
  }
}

module.exports = { postPerson };
