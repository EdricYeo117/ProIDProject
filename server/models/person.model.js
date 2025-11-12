const oracledb = require('oracledb');
const db = require('../services/db.service');

/**
 * Create a person row and return its id + echo of key fields.
 * REQUIRED: category_id, school_id, full_name
 * OPTIONAL: email, graduation_year, profile_image_url, bio, linkedin_url, is_featured, status
 */
async function createPerson(payload) {
  const {
    category_id,
    school_id,
    full_name,
    email = null,
    graduation_year = null,
    profile_image_url = null,
    bio = null,
    linkedin_url = null,
    is_featured = 0,
    status = 'active',
    created_by = 'api',
    updated_by = 'api',
  } = payload;

  const sql = `
    INSERT INTO persons (
      category_id, school_id, full_name, email, graduation_year,
      profile_image_url, bio, linkedin_url, is_featured, status,
      created_by, updated_by
    ) VALUES (
      :category_id, :school_id, :full_name, :email, :graduation_year,
      :profile_image_url, :bio, :linkedin_url, :is_featured, :status,
      :created_by, :updated_by
    )
    RETURNING person_id INTO :out_id
  `;

  const binds = {
    category_id, school_id, full_name, email, graduation_year,
    profile_image_url, bio, linkedin_url,
    is_featured: Number(is_featured) ? 1 : 0,
    status, created_by, updated_by,
    out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
  };

  const result = await db.execute(sql, binds, { autoCommit: true });
  const person_id = result.outBinds.out_id[0];

  return { person_id, full_name, category_id, school_id, profile_image_url, status };
}

module.exports = { createPerson };
