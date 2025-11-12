const PersonModel = require('../models/person.model');

async function create(req, res) {
  const { full_name, category_id, school_id, bio, profile_image_url, is_featured } = req.body || {};
  if (!full_name || !category_id || !school_id) {
    return res.status(400).json({ error: 'full_name, category_id, school_id are required' });
  }
  try {
    const { person_id } = await PersonModel.createPerson({
      full_name,
      category_id: Number(category_id),
      school_id: Number(school_id),
      bio: bio ?? null,
      profile_image_url: profile_image_url ?? null,
      is_featured: !!is_featured
    });
    res.status(201).json({ person_id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create person' });
  }
}

module.exports = { create };
