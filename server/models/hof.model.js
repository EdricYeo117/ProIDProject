// src/models/hof.model.js
const db = require('../services/db.service');

// Schools for filter chips
async function getSchools() {
  const sql = `
    SELECT school_id AS id, school_name AS name, color_code AS color
    FROM schools
    ORDER BY school_name
  `;
  const { rows } = await db.execute(sql);
  return rows;
}

// Categories (if you wish to render tabs dynamically)
async function getCategories() {
  const sql = `
    SELECT category_id AS id, category_name AS name, display_order
    FROM categories
    ORDER BY display_order NULLS LAST, category_name
  `;
  const { rows } = await db.execute(sql);
  return rows;
}

/**
 * Hall of Fame list with counts and a preview achievement.
 * Supports pagination via limit/offset.
 */
async function getHallOfFame({
  categoryId = null,
  schoolId = null,
  featuredOnly = false,
  limit = 50,
  offset = 0,
}) {
  const sql = `
    WITH ach AS (
      SELECT
        person_id,
        COUNT(*) AS achievement_count,
        -- pick a representative achievement deterministically
        MAX(achievement_title) KEEP (
          DENSE_RANK FIRST ORDER BY
            (CASE WHEN is_featured = 1 THEN 0 ELSE 1 END),
            NVL(display_order, 999999),
            achievement_id
        ) AS top_achievement
      FROM achievement_records
      WHERE NVL(is_public, 1) = 1
      GROUP BY person_id
    )
    SELECT
      p.person_id,
      p.full_name,
      c.category_name,
      s.school_name,
      p.bio,
      p.profile_image_url,
      NVL(a.achievement_count, 0) AS achievement_count,
      a.top_achievement
    FROM persons p
    JOIN categories c ON p.category_id = c.category_id
    JOIN schools   s ON p.school_id   = s.school_id
    LEFT JOIN ach  a ON a.person_id   = p.person_id
    WHERE p.status = 'active'
      AND (:cat  IS NULL OR p.category_id = :cat)
      AND (:sch  IS NULL OR p.school_id   = :sch)
      AND (:feat = 0     OR p.is_featured = 1)
    ORDER BY p.is_featured DESC, NVL(a.achievement_count, 0) DESC, p.person_id
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
  `;

  const binds = {
    cat: categoryId,
    sch: schoolId,
    feat: featuredOnly ? 1 : 0,
    limit: Number(limit) || 50,
    offset: Number(offset) || 0,
  };

  const { rows } = await db.execute(sql, binds);
  return rows;
}

// Person header
async function getPersonHeader(personId) {
  const sql = `
    SELECT
      p.person_id,
      p.full_name,
      c.category_name,
      s.school_name,
      p.bio,
      p.profile_image_url
    FROM persons p
    JOIN categories c ON p.category_id = c.category_id
    JOIN schools s   ON p.school_id = s.school_id
    WHERE p.person_id = :id
      AND p.status = 'active'
  `;
  const { rows } = await db.execute(sql, { id: personId });
  return rows[0] || null;
}

// Person achievements
async function getPersonAchievements(personId) {
  const sql = `
    SELECT
      a.achievement_id,
      a.achievement_title        AS title,
      a.achievement_description  AS description,
      at.achievement_type_name   AS type,
      a.academic_year            AS year,
      a.semester,
      TO_CHAR(a.achievement_date, 'YYYY-MM-DD') AS date,
      a.gpa,
      a.organization,
      a.award_level,
      a.display_order
    FROM achievement_records a
    LEFT JOIN achievement_types at
      ON at.achievement_type_id = a.achievement_type_id
    WHERE a.person_id = :id
      AND NVL(a.is_public, 1) = 1
    ORDER BY
      NVL(a.display_order, 999999),
      a.achievement_date NULLS LAST,
      a.achievement_id
  `;
  const { rows } = await db.execute(sql, { id: personId });
  return rows;
}

// Person CCA activities
async function getPersonCca(personId) {
  const sql = `
    SELECT
      cca_name,
      position_held AS position,
      description,
      TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(end_date,   'YYYY-MM-DD') AS end_date,
      is_current
    FROM cca_activities
    WHERE person_id = :id
    ORDER BY NVL(end_date, DATE '9999-12-31') DESC, start_date DESC
  `;
  const { rows } = await db.execute(sql, { id: personId });
  return rows;
}

module.exports = {
  getSchools,
  getCategories,
  getHallOfFame,
  getPersonHeader,
  getPersonAchievements,
  getPersonCca
};
