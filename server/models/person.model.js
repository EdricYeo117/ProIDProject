const db = require('../services/db.service');
const oracledb = require('oracledb');

// Inserts a new person; relies on IDENTITY for person_id
async function createPerson({
  full_name, category_id, school_id, bio, profile_image_url, is_featured = 0, status = 'active'
}) {
  const sql = `
    INSERT INTO persons (
      full_name, category_id, school_id, bio, profile_image_url, status, is_featured
    ) VALUES (
      :full_name, :category_id, :school_id, :bio, :profile_image_url, :status, :is_featured
    )
    RETURNING person_id INTO :id
  `;
  const binds = {
    full_name,
    category_id,
    school_id,
    bio,
    profile_image_url,
    status,
    is_featured: is_featured ? 1 : 0,
    id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
  };
  const result = await db.execute(sql, binds, { autoCommit: true });
  const newId = Array.isArray(result.outBinds?.id) ? result.outBinds.id[0] : result.outBinds?.id;
  return { person_id: Number(newId) };
}

module.exports = { createPerson };
