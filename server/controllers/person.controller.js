// controllers/person.controller.js
const PersonModel = require('../models/person.model');

async function create(req, res) {
  const {
    full_name,
    category_id,
    school_id,
    bio,
    profile_image_url,
    is_featured,
    achievements,
    cca,
  } = req.body || {};

  if (!full_name || !category_id || !school_id) {
    return res.status(400).json({
      error: 'full_name, category_id, school_id are required',
    });
  }

  try {
    // 1) create base person
    const { person_id } = await PersonModel.createPerson({
      full_name,
      category_id,          // keep as string, e.g. "students"
      school_id,            // "infocomm"
      bio: bio ?? null,
      profile_image_url: profile_image_url ?? null,
      is_featured: !!is_featured,
    });

    // 2) insert achievements (if any)
    if (Array.isArray(achievements)) {
      for (const ach of achievements) {
        if (!ach || !ach.title || !ach.title.trim()) continue;
        await PersonModel.addAchievement(person_id, ach);
      }
    }

    // 3) insert CCA records (if any)
    if (Array.isArray(cca)) {
      for (const c of cca) {
        if (!c || !c.cca_name || !c.cca_name.trim()) continue;
        await PersonModel.addCca(person_id, c);
      }
    }

    return res.status(201).json({ person_id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create person' });
  }
}

module.exports = { create };
