// server/models/admin.model.js
const oracledb = require("oracledb");
const db = require("../services/db.service");

/**
 * For the dropdown of achievement types
 */
async function getAchievementTypes(categoryId) {
  // Your adjusted version that no longer filters by category_id if not needed
  const sql = `
    SELECT
      achievement_type_id,
      achievement_type_name
    FROM achievement_types
    WHERE (:category_id IS NULL OR category_id = :category_id)
    ORDER BY display_order NULLS LAST, achievement_type_name
  `;

  const result = await db.execute(
    sql,
    { category_id: categoryId || null },
    {}
  );

  return result.rows || [];
}

/**
 * Create a person + achievements + CCA in one go.
 * Uses a single connection + explicit commit/rollback.
 */
async function createPersonFull(payload) {
  const {
    full_name,
    category_id,
    school_id,
    bio,
    is_featured,
    profile_image_url,
    achievements = [],
    cca = [],
  } = payload || {};

  if (!full_name || !category_id || !school_id) {
    throw new Error("full_name, category_id and school_id are required");
  }

  let conn;

  try {
    conn = await db.getConnection(); // 🔹 single connection for the whole transaction

    // 1) Insert PERSON and get the new person_id
    const personResult = await conn.execute(
      `
      INSERT INTO persons (
        person_id,
        category_id,
        school_id,
        full_name,
        bio,
        is_featured,
        profile_image_url
      ) VALUES (
        persons_seq.NEXTVAL,
        :category_id,
        :school_id,
        :full_name,
        :bio,
        :is_featured,
        :profile_image_url
      )
      RETURNING person_id INTO :person_id
      `,
      {
        full_name,
        category_id,
        school_id,
        bio: bio || null,
        is_featured: is_featured ? 1 : 0,
        profile_image_url: profile_image_url || null,
        person_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false } // 🔹 stay in the transaction
    );

    const personId = personResult.outBinds.person_id[0];

    // 2) Insert ACHIEVEMENT records (if any)
    for (const a of achievements || []) {
      if (!a || !a.title || !a.title.trim()) continue;

      await conn.execute(
        `
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
          :title,
          :description,
          :academic_year,
          :semester,
          CASE 
            WHEN :achievement_date IS NOT NULL 
            THEN TO_DATE(:achievement_date, 'YYYY-MM-DD') 
            ELSE NULL 
          END,
          :gpa,
          :position_held,
          :organization,
          :award_level,
          :display_order,
          :is_featured,
          :is_public
        )
        `,
        {
          person_id: personId,
          achievement_type_id: a.achievement_type_id || null,
          title: a.title.trim(),
          description: a.description || null,
          academic_year: a.academic_year || null,
          semester: a.semester || null,
          achievement_date: a.achievement_date || null, // "YYYY-MM-DD"
          gpa: a.gpa ?? null,
          position_held: a.position_held || null,
          organization: a.organization || null,
          award_level: a.award_level || null,
          display_order: a.display_order ?? null,
          is_featured: a.is_featured ? 1 : 0,
          is_public: a.is_public === false ? 0 : 1, // default public
        },
        { autoCommit: false }
      );
    }

    // 3) Insert CCA rows (if any)
    for (const c of cca || []) {
      if (!c || !c.cca_name || !c.cca_name.trim()) continue;

      await conn.execute(
        `
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
          CASE 
            WHEN :start_date IS NOT NULL THEN TO_DATE(:start_date, 'YYYY-MM-DD')
            ELSE NULL
          END,
          CASE 
            WHEN :end_date IS NOT NULL THEN TO_DATE(:end_date, 'YYYY-MM-DD')
            ELSE NULL
          END,
          :is_current,
          :description
        )
        `,
        {
          person_id: personId,
          cca_name: c.cca_name.trim(),
          position_held: c.position_held || null,
          start_date: c.start_date || null,
          end_date: c.end_date || null,
          is_current: c.is_current ? 1 : 0,
          description: c.description || null,
        },
        { autoCommit: false }
      );
    }

    // 4) Commit the whole transaction
    await conn.commit();

    return { person_id: personId };
  } catch (err) {
    // if anything fails, rollback the whole transaction
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }
    throw err;
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (_) {}
    }
  }
}

module.exports = {
  getAchievementTypes,
  createPersonFull,
};
