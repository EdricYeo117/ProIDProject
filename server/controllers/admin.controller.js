const oracledb = require('oracledb');
const { getConnection } = require('../services/db.service');

// (OPTIONAL) List achievement types by category for your form dropdown
async function listAchievementTypes(req, res) {
  const categoryId = req.query.categoryId || null; // 'students' | 'staff' | 'alumni'
  const sql = `
    SELECT achievement_type_id, achievement_type_name
    FROM achievement_types
    WHERE (:cat IS NULL OR category_id = :cat)
    ORDER BY NVL(display_order, 999999), achievement_type_name
  `;
  let conn;
  try {
    conn = await getConnection();
    const { rows } = await conn.execute(sql, { cat: categoryId });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list achievement types' });
  } finally { try { await conn?.close(); } catch {} }
}

/**
 * Create a person + (optional) achievements[] + (optional) cca[] in ONE transaction.
 * Body shape:
 * {
 *   full_name, category_id, school_id, bio?, is_featured?, profile_image_url?,
 *   achievements?: [{
 *     achievement_type_id?, title, description?, academic_year?, semester?,
 *     achievement_date?, gpa?, position_held?, organization?, award_level?,
 *     display_order?, is_featured?, is_public?
 *   }],
 *   cca?: [{
 *     cca_name, position_held?, start_date?, end_date?, is_current?, description?
 *   }]
 * }
 */
async function createPersonDeep(req, res) {
  const b = req.body || {};
  if (!b.full_name || !b.category_id || !b.school_id) {
    return res.status(400).json({ error: 'full_name, category_id, school_id are required' });
  }

  let conn;
  try {
    conn = await getConnection();

    // 1) Insert person and RETURN person_id (sequence via trigger)
    const personSql = `
      INSERT INTO persons (
        category_id, school_id, full_name, bio, profile_image_url,
        is_featured, status, created_by
      ) VALUES (
        :category_id, :school_id, :full_name, :bio, :profile_image_url,
        :is_featured, 'active', :created_by
      )
      RETURNING person_id INTO :out_id
    `;
    const pBinds = {
      category_id: b.category_id,
      school_id:  b.school_id,
      full_name:  b.full_name,
      bio:        b.bio ?? null,
      profile_image_url: b.profile_image_url ?? null,
      is_featured: b.is_featured ? 1 : 0,
      created_by:  'admin',               // adjust if you later add auth identity
      out_id:     { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };
    const pRes = await conn.execute(personSql, pBinds, { autoCommit: false });
    const personId = pRes.outBinds.out_id[0];

    // 2) Achievements (bulk)
    const achievements = Array.isArray(b.achievements) ? b.achievements : [];
    if (achievements.length) {
      const achRows = achievements.map(a => ({
        person_id: personId,
        achievement_type_id: a.achievement_type_id ?? null,
        title: a.title,
        description: a.description ?? null,
        academic_year: a.academic_year ?? null,
        semester: a.semester ?? null,
        achievement_date: a.achievement_date ? new Date(a.achievement_date) : null,
        gpa: a.gpa ?? null,
        position_held: a.position_held ?? null,
        organization: a.organization ?? null,
        award_level: a.award_level ?? null,
        display_order: a.display_order ?? null,
        is_featured: a.is_featured ? 1 : 0,
        is_public: (a.is_public === 0 ? 0 : 1), // default public
        created_by: 'admin'
      }));

      const achSql = `
        INSERT INTO achievement_records (
          person_id, achievement_type_id, achievement_title, achievement_description,
          academic_year, semester, achievement_date, gpa, position_held, organization,
          award_level, display_order, is_featured, is_public, created_by
        ) VALUES (
          :person_id, :achievement_type_id, :title, :description,
          :academic_year, :semester, :achievement_date, :gpa, :position_held, :organization,
          :award_level, :display_order, :is_featured, :is_public, :created_by
        )
      `;
      await conn.executeMany(achSql, achRows, {
        autoCommit: false,
        bindDefs: {
          person_id: { type: oracledb.NUMBER },
          achievement_type_id: { type: oracledb.STRING, maxSize: 50 },
          title: { type: oracledb.STRING, maxSize: 500 },
          description: { type: oracledb.STRING, maxSize: 2000 },
          academic_year: { type: oracledb.STRING, maxSize: 20 },
          semester: { type: oracledb.STRING, maxSize: 20 },
          achievement_date: { type: oracledb.DATE },
          gpa: { type: oracledb.NUMBER },
          position_held: { type: oracledb.STRING, maxSize: 200 },
          organization: { type: oracledb.STRING, maxSize: 300 },
          award_level: { type: oracledb.STRING, maxSize: 100 },
          display_order: { type: oracledb.NUMBER },
          is_featured: { type: oracledb.NUMBER },
          is_public: { type: oracledb.NUMBER },
          created_by: { type: oracledb.STRING, maxSize: 100 }
        }
      });
    }

    // 3) CCA Activities (bulk, optional)
    const cca = Array.isArray(b.cca) ? b.cca : [];
    if (cca.length) {
      const ccaRows = cca.map(c => ({
        person_id: personId,
        cca_name: c.cca_name,
        position_held: c.position_held ?? null,
        start_date: c.start_date ? new Date(c.start_date) : null,
        end_date: c.end_date ? new Date(c.end_date) : null,
        is_current: c.is_current ? 1 : 0,
        description: c.description ?? null
      }));
      const ccaSql = `
        INSERT INTO cca_activities (
          person_id, cca_name, position_held, start_date, end_date, is_current, description
        ) VALUES (
          :person_id, :cca_name, :position_held, :start_date, :end_date, :is_current, :description
        )
      `;
      await conn.executeMany(ccaSql, ccaRows, {
        autoCommit: false,
        bindDefs: {
          person_id: { type: oracledb.NUMBER },
          cca_name: { type: oracledb.STRING, maxSize: 200 },
          position_held: { type: oracledb.STRING, maxSize: 200 },
          start_date: { type: oracledb.DATE },
          end_date: { type: oracledb.DATE },
          is_current: { type: oracledb.NUMBER },
          description: { type: oracledb.STRING, maxSize: 1000 }
        }
      });
    }

    await conn.commit();
    return res.json({ ok: true, person_id: personId });
  } catch (e) {
    console.error('createPersonDeep failed:', e);
    try { await conn?.rollback(); } catch {}
    return res.status(500).json({ error: 'Failed to create person' });
  } finally { try { await conn?.close(); } catch {} }
}

module.exports = { listAchievementTypes, createPersonDeep };
