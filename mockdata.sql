--------------------------------------------------------------------------------
-- MOCK DATA SEED (Oracle): 1 Student + 1 Teacher + 1 Alumni for EACH school
-- UPDATED: Replaced all picsum.photos URLs with real-person portrait URLs (randomuser.me)
-- Assumes these exist already:
--   schools (8 rows), categories (students/staff/alumni), achievement_types
-- Idempotent via MERGE into PERSONS and ACHIEVEMENT_RECORDS.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- 1) PERSONS (24 rows: 8 schools x 3 categories)
--------------------------------------------------------------------------------
MERGE INTO persons p
USING (
  -- =========================
  -- School of Business & Accountancy
  -- =========================
  SELECT 'students' category_id, 'business' school_id, 'Cheryl Tan' full_name,
         'cheryl.tan@connect.np.edu.sg' email, '2026' graduation_year,
         'https://randomuser.me/api/portraits/women/45.jpg' profile_image_url,
         'Diploma student in School of Business & Accountancy. Recognised for consistent academic performance and teamwork.' bio,
         'https://www.linkedin.com/in/mock-cheryl-tan' linkedin_url,
         0 is_featured, 'active' status
    FROM dual
  UNION ALL
  SELECT 'staff', 'business', 'Mr. Daniel Ong',
         'daniel.ong@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/men/32.jpg',
         'Lecturer in School of Business & Accountancy. Focused on applied learning and student mentorship.' ,
         'https://www.linkedin.com/in/mock-daniel-ong',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'business', 'Ms. Rachel Lim',
         'rachel.lim@example.com', '2016',
         'https://randomuser.me/api/portraits/women/12.jpg',
         'Alumni of School of Business & Accountancy. Progressed from analyst to business lead, contributing back through mentoring.' ,
         'https://www.linkedin.com/in/mock-rachel-lim',
         0, 'active'
    FROM dual

  -- =========================
  -- School of Design & Environment
  -- =========================
  UNION ALL
  SELECT 'students', 'design', 'Samantha Goh',
         'samantha.goh@connect.np.edu.sg', '2026',
         'https://randomuser.me/api/portraits/women/68.jpg',
         'Diploma student in School of Design & Environment. Builds user-centric design solutions with strong presentation skills.' ,
         'https://www.linkedin.com/in/mock-samantha-goh',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'staff', 'design', 'Ms. Joanne Teo',
         'joanne.teo@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/women/33.jpg',
         'Lecturer in School of Design & Environment. Supports studio-based learning and industry-aligned projects.' ,
         'https://www.linkedin.com/in/mock-joanne-teo',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'design', 'Mr. Kelvin Lee',
         'kelvin.lee@example.com', '2014',
         'https://randomuser.me/api/portraits/men/19.jpg',
         'Alumni of School of Design & Environment. Works on digital product design and leads community design initiatives.' ,
         'https://www.linkedin.com/in/mock-kelvin-lee',
         0, 'active'
    FROM dual

  -- =========================
  -- School of Engineering
  -- =========================
  UNION ALL
  SELECT 'students', 'engineering', 'Marcus Tan',
         'marcus.tan@connect.np.edu.sg', '2026',
         'https://randomuser.me/api/portraits/men/52.jpg',
         'Engineering diploma student. Demonstrates strong fundamentals in systems thinking and project execution.' ,
         'https://www.linkedin.com/in/mock-marcus-tan',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'staff', 'engineering', 'Dr. Wei Ming Koh',
         'weiming.koh@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/men/61.jpg',
         'Senior lecturer in School of Engineering. Research-led teaching and mentorship in capstone projects.' ,
         'https://www.linkedin.com/in/mock-weiming-koh',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'engineering', 'Engr. Nicole Chua',
         'nicole.chua@example.com', '2012',
         'https://randomuser.me/api/portraits/women/27.jpg',
         'Engineering alumni. Leads engineering delivery and supports internships and industry partnerships.' ,
         'https://www.linkedin.com/in/mock-nicole-chua',
         0, 'active'
    FROM dual

  -- =========================
  -- School of Film & Media Studies
  -- =========================
  UNION ALL
  SELECT 'students', 'film', 'Irfan Ahmad',
         'irfan.ahmad@connect.np.edu.sg', '2026',
         'https://randomuser.me/api/portraits/men/7.jpg',
         'Film & Media diploma student. Strong in storytelling, production workflows, and creative collaboration.' ,
         'https://www.linkedin.com/in/mock-irfan-ahmad',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'staff', 'film', 'Ms. Mei Lin Chan',
         'meilin.chan@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/women/58.jpg',
         'Lecturer in Film & Media Studies. Guides students on production craft, critique, and portfolio readiness.' ,
         'https://www.linkedin.com/in/mock-meilin-chan',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'film', 'Mr. Adrian Seah',
         'adrian.seah@example.com', '2015',
         'https://randomuser.me/api/portraits/men/41.jpg',
         'Film & Media alumni. Works across commercial and documentary productions and mentors junior creators.' ,
         'https://www.linkedin.com/in/mock-adrian-seah',
         0, 'active'
    FROM dual

  -- =========================
  -- School of Health Sciences
  -- =========================
  UNION ALL
  SELECT 'students', 'health', 'Hannah Ng',
         'hannah.ng@connect.np.edu.sg', '2026',
         'https://randomuser.me/api/portraits/women/9.jpg',
         'Health Sciences diploma student. Demonstrates strong discipline, empathy, and evidence-based practice.' ,
         'https://www.linkedin.com/in/mock-hannah-ng',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'staff', 'health', 'Dr. Priya Nair',
         'priya.nair@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/women/20.jpg',
         'Lecturer in School of Health Sciences. Focused on clinical readiness and reflective learning.' ,
         'https://www.linkedin.com/in/mock-priya-nair',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'health', 'Ms. Eunice Yap',
         'eunice.yap@example.com', '2013',
         'https://randomuser.me/api/portraits/women/76.jpg',
         'Health Sciences alumni. Supports community health initiatives and returns as an industry mentor.' ,
         'https://www.linkedin.com/in/mock-eunice-yap',
         0, 'active'
    FROM dual

  -- =========================
  -- School of Humanities & Interdisciplinary Studies
  -- =========================
  UNION ALL
  SELECT 'students', 'humanities', 'Aiden Wong',
         'aiden.wong@connect.np.edu.sg', '2026',
         'https://randomuser.me/api/portraits/men/29.jpg',
         'Humanities diploma student. Strong in communication, research, and interdisciplinary project work.' ,
         'https://www.linkedin.com/in/mock-aiden-wong',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'staff', 'humanities', 'Ms. Farah Aziz',
         'farah.aziz@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/women/38.jpg',
         'Lecturer in Humanities & Interdisciplinary Studies. Emphasises critical thinking and student development.' ,
         'https://www.linkedin.com/in/mock-farah-aziz',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'humanities', 'Mr. Benjamin Ho',
         'benjamin.ho@example.com', '2011',
         'https://randomuser.me/api/portraits/men/73.jpg',
         'Humanities alumni. Works in public communications and contributes as an alumni mentor.' ,
         'https://www.linkedin.com/in/mock-benjamin-ho',
         0, 'active'
    FROM dual

  -- =========================
  -- School of Infocomm Technology
  -- =========================
  UNION ALL
  SELECT 'students', 'infocomm', 'Tanya Lim',
         'tanya.lim@connect.np.edu.sg', '2026',
         'https://randomuser.me/api/portraits/women/48.jpg',
         'Infocomm diploma student. Builds full-stack applications and enjoys cloud-based solutioning.' ,
         'https://www.linkedin.com/in/mock-tanya-lim',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'staff', 'infocomm', 'Mr. Adrian Lau',
         'adrian.lau@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/men/55.jpg',
         'Lecturer in School of Infocomm Technology. Teaches software engineering fundamentals and mentors project teams.' ,
         'https://www.linkedin.com/in/mock-adrian-lau',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'infocomm', 'Ms. Claire Tan',
         'claire.tan@example.com', '2017',
         'https://randomuser.me/api/portraits/women/24.jpg',
         'Infocomm alumni. Works in software delivery and supports student hiring pipelines through mentorship.' ,
         'https://www.linkedin.com/in/mock-claire-tan',
         0, 'active'
    FROM dual

  -- =========================
  -- School of Life Sciences & Chemical Technology
  -- =========================
  UNION ALL
  SELECT 'students', 'lifesciences', 'Jason Lim',
         'jason.lim@connect.np.edu.sg', '2026',
         'https://randomuser.me/api/portraits/men/11.jpg',
         'Life Sciences diploma student. Strong in lab discipline and documentation, with interest in applied research.' ,
         'https://www.linkedin.com/in/mock-jason-lim',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'staff', 'lifesciences', 'Dr. Li Jun Chen',
         'lijun.chen@np.edu.sg', NULL,
         'https://randomuser.me/api/portraits/men/66.jpg',
         'Lecturer in Life Sciences & Chemical Technology. Guides students through research methods and lab best practices.' ,
         'https://www.linkedin.com/in/mock-lijun-chen',
         0, 'active'
    FROM dual
  UNION ALL
  SELECT 'alumni', 'lifesciences', 'Ms. Sharon Tan',
         'sharon.tan@example.com', '2010',
         'https://randomuser.me/api/portraits/women/31.jpg',
         'Life Sciences alumni. Progressed into industry roles and contributes back through talks and mentoring.' ,
         'https://www.linkedin.com/in/mock-sharon-tan',
         0, 'active'
    FROM dual
) src
ON (p.full_name = src.full_name AND p.category_id = src.category_id AND p.school_id = src.school_id)
WHEN MATCHED THEN UPDATE SET
  p.email             = src.email,
  p.graduation_year   = src.graduation_year,
  p.profile_image_url = src.profile_image_url,
  p.bio               = src.bio,
  p.linkedin_url      = src.linkedin_url,
  p.is_featured       = src.is_featured,
  p.status            = src.status,
  p.updated_at        = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  person_id, category_id, school_id, full_name, email, graduation_year,
  profile_image_url, bio, linkedin_url, is_featured, status, created_at, updated_at
) VALUES (
  NULL, src.category_id, src.school_id, src.full_name, src.email, src.graduation_year,
  src.profile_image_url, src.bio, src.linkedin_url, src.is_featured, src.status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------
-- 2) ACHIEVEMENTS (1 per person; minimal for UI validation)
--    Students: Director's List (with semester tag)
--    Staff: Teaching Excellence
--    Alumni: Career Milestone
--------------------------------------------------------------------------------
MERGE INTO achievement_records a
USING (
  -- STUDENTS (Director's List - Year 1 Semester 1)
  SELECT (SELECT person_id FROM persons WHERE full_name='Cheryl Tan' AND category_id='students' AND school_id='business') person_id,
         'directors_list' achievement_type_id,
         'Director''s List - Year 1 Semester 1' achievement_title,
         'Placed on the Director''s List for Year 1 Semester 1.' achievement_description,
         'AY24/25' academic_year,
         'Year 1 Sem 1' semester,
         NULL achievement_date,
         'Ngee Ann Polytechnic' organization,
         1 display_order,
         0 is_featured,
         1 is_public
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Samantha Goh' AND category_id='students' AND school_id='design'),
         'directors_list',
         'Director''s List - Year 1 Semester 1',
         'Placed on the Director''s List for Year 1 Semester 1.',
         'AY24/25',
         'Year 1 Sem 1',
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Marcus Tan' AND category_id='students' AND school_id='engineering'),
         'directors_list',
         'Director''s List - Year 1 Semester 1',
         'Placed on the Director''s List for Year 1 Semester 1.',
         'AY24/25',
         'Year 1 Sem 1',
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Irfan Ahmad' AND category_id='students' AND school_id='film'),
         'directors_list',
         'Director''s List - Year 1 Semester 1',
         'Placed on the Director''s List for Year 1 Semester 1.',
         'AY24/25',
         'Year 1 Sem 1',
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Hannah Ng' AND category_id='students' AND school_id='health'),
         'directors_list',
         'Director''s List - Year 1 Semester 1',
         'Placed on the Director''s List for Year 1 Semester 1.',
         'AY24/25',
         'Year 1 Sem 1',
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Aiden Wong' AND category_id='students' AND school_id='humanities'),
         'directors_list',
         'Director''s List - Year 1 Semester 1',
         'Placed on the Director''s List for Year 1 Semester 1.',
         'AY24/25',
         'Year 1 Sem 1',
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Tanya Lim' AND category_id='students' AND school_id='infocomm'),
         'directors_list',
         'Director''s List - Year 1 Semester 1',
         'Placed on the Director''s List for Year 1 Semester 1.',
         'AY24/25',
         'Year 1 Sem 1',
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Jason Lim' AND category_id='students' AND school_id='lifesciences'),
         'directors_list',
         'Director''s List - Year 1 Semester 1',
         'Placed on the Director''s List for Year 1 Semester 1.',
         'AY24/25',
         'Year 1 Sem 1',
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual

  -- STAFF (Teaching Excellence)
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Mr. Daniel Ong' AND category_id='staff' AND school_id='business'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Ms. Joanne Teo' AND category_id='staff' AND school_id='design'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Dr. Wei Ming Koh' AND category_id='staff' AND school_id='engineering'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Ms. Mei Lin Chan' AND category_id='staff' AND school_id='film'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Dr. Priya Nair' AND category_id='staff' AND school_id='health'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Ms. Farah Aziz' AND category_id='staff' AND school_id='humanities'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Mr. Adrian Lau' AND category_id='staff' AND school_id='infocomm'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Dr. Li Jun Chen' AND category_id='staff' AND school_id='lifesciences'),
         'teaching',
         'Teaching Excellence - 2024',
         'Recognised for strong teaching practice and student support in 2024.',
         NULL,
         NULL,
         NULL,
         'Ngee Ann Polytechnic',
         1,
         0,
         1
    FROM dual

  -- ALUMNI (Career Milestone)
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Ms. Rachel Lim' AND category_id='alumni' AND school_id='business'),
         'career',
         'Career Milestone - Team Lead',
         'Progressed into a team leadership role and contributed back through mentoring.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Mr. Kelvin Lee' AND category_id='alumni' AND school_id='design'),
         'career',
         'Career Milestone - Product Design Lead',
         'Progressed into a leadership role in digital product design and community initiatives.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Engr. Nicole Chua' AND category_id='alumni' AND school_id='engineering'),
         'career',
         'Career Milestone - Engineering Delivery Lead',
         'Led engineering delivery and supported internships and industry partnerships.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Mr. Adrian Seah' AND category_id='alumni' AND school_id='film'),
         'career',
         'Career Milestone - Producer',
         'Built a track record across commercial and documentary productions; mentors junior creators.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Ms. Eunice Yap' AND category_id='alumni' AND school_id='health'),
         'career',
         'Career Milestone - Community Health Advocate',
         'Contributed to community health initiatives and supports student development through talks.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Mr. Benjamin Ho' AND category_id='alumni' AND school_id='humanities'),
         'career',
         'Career Milestone - Communications Lead',
         'Progressed into a communications leadership role and supports alumni mentorship efforts.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Ms. Claire Tan' AND category_id='alumni' AND school_id='infocomm'),
         'career',
         'Career Milestone - Software Delivery',
         'Contributed to software delivery programmes and supports student hiring pipelines through mentorship.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
  UNION ALL
  SELECT (SELECT person_id FROM persons WHERE full_name='Ms. Sharon Tan' AND category_id='alumni' AND school_id='lifesciences'),
         'career',
         'Career Milestone - Industry Specialist',
         'Progressed into industry roles and contributes back through talks and mentoring.',
         NULL,
         NULL,
         NULL,
         'Industry',
         1,
         0,
         1
    FROM dual
) src
ON (
  a.person_id = src.person_id
  AND a.achievement_title = src.achievement_title
  AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01')
)
WHEN MATCHED THEN UPDATE SET
  a.achievement_type_id     = src.achievement_type_id,
  a.achievement_description = src.achievement_description,
  a.academic_year           = src.academic_year,
  a.semester                = src.semester,
  a.organization            = src.organization,
  a.display_order           = src.display_order,
  a.is_featured             = src.is_featured,
  a.is_public               = src.is_public,
  a.updated_at              = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  academic_year, semester, achievement_date, organization, display_order,
  is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  src.academic_year, src.semester, src.achievement_date, src.organization, src.display_order,
  src.is_featured, src.is_public, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

COMMIT;

--------------------------------------------------------------------------------
-- Quick validation (optional)
-- SELECT s.school_name, c.category_name, p.full_name, p.profile_image_url
-- FROM persons p
-- JOIN schools s ON p.school_id = s.school_id
-- JOIN categories c ON p.category_id = c.category_id
-- ORDER BY s.school_name, c.display_order, p.full_name;
--------------------------------------------------------------------------------
