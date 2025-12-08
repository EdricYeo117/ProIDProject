// models/person.model.js
const db = require('../services/db.service');
const oracledb = require('oracledb');

async function createPerson({
  full_name,
  category_id,
  school_id,
  bio,
  profile_image_url,
  is_featured = 0,
  status = 'active',
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
    category_id,        // <-- keep as string
    school_id,          // <-- keep as string
    bio,
    profile_image_url,
    status,
    is_featured: is_featured ? 1 : 0,
    id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
  };
  const result = await db.execute(sql, binds, { autoCommit: true });
  const newId = Array.isArray(result.outBinds?.id)
    ? result.outBinds.id[0]
    : result.outBinds?.id;
  return { person_id: Number(newId) };
}

// Simple insert for one achievement
async function addAchievement(person_id, ach) {
  const sql = `
    INSERT INTO achievement_records (
      achievement_id,
      person_id,
      achievement_type_id,
      achievement_title,
      achievement_description,
      academic_year,
      semester,
      achievement_date,
      gpa,
      position_held,
      organization,
      award_level,
      display_order,
      is_featured,
      is_public
    ) VALUES (
      achievement_records_seq.NEXTVAL,
      :person_id,
      :achievement_type_id,
      :achievement_title,
      :achievement_description,
      :academic_year,
      :semester,
      :achievement_date,
      :gpa,
      :position_held,
      :organization,
      :award_level,
      :display_order,
      :is_featured,
      :is_public
    )
  `;
  const binds = {
    person_id,
    achievement_type_id: ach.achievement_type_id || null,
    achievement_title: ach.title,
    achievement_description: ach.description || null,
    academic_year: ach.academic_year || null,
    semester: ach.semester || null,
    achievement_date: ach.achievement_date || null, // "YYYY-MM-DD" string is okay
    gpa: ach.gpa ?? null,
    position_held: ach.position_held || null,
    organization: ach.organization || null,
    award_level: ach.award_level || null,
    display_order: ach.display_order ?? null,
    is_featured: ach.is_featured ? 1 : 0,
    is_public: ach.is_public === false ? 0 : 1,
  };
  await db.execute(sql, binds, { autoCommit: true });
}

async function addCca(person_id, cca) {
  const sql = `
    INSERT INTO cca_activities (
      cca_id,
      person_id,
      cca_name,
      position_held,
      start_date,
      end_date,
      is_current,
      description
    ) VALUES (
      cca_activities_seq.NEXTVAL,
      :person_id,
      :cca_name,
      :position_held,
      :start_date,
      :end_date,
      :is_current,
      :description
    )
  `;
  const binds = {
    person_id,
    cca_name: cca.cca_name,
    position_held: cca.position_held || null,
    start_date: cca.start_date || null,
    end_date: cca.end_date || null,
    is_current: cca.is_current ? 1 : 0,
    description: cca.description || null,
  };
  await db.execute(sql, binds, { autoCommit: true });
}

module.exports = {
  createPerson,
  addAchievement,
  addCca,
};
