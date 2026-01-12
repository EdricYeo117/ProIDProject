-- Ngee Ann Polytechnic Hall of Fame Database Schema (Modular Design)
-- Optimized for Oracle Database 23ai
-- Person-centric design: One person can have multiple achievement records
-- Fixed: Using VARCHAR2 instead of CLOB to avoid ORA-00932 errors

-- Drop existing objects if they exist (optional cleanup)
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE audit_log CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE media_gallery CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE cca_awards CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE cca_activities CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE achievement_records CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE persons CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE achievement_types CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE categories CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE schools CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE CANVAS_MESSAGES CASCADE CONSTRAINTS;';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE CANVAS_BOARD CASCADE CONSTRAINTS;';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE persons_seq';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE achievement_records_seq';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE cca_activities_seq';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE cca_awards_seq';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE media_gallery_seq';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE audit_log_seq';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
-- Schools Reference Table
CREATE TABLE schools (
    school_id VARCHAR2(50) PRIMARY KEY,
    school_name VARCHAR2(200) NOT NULL,
    color_code VARCHAR2(7),
    description VARCHAR2(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories (Alumni, Staff, Students)
CREATE TABLE categories (
    category_id VARCHAR2(50) PRIMARY KEY,
    category_name VARCHAR2(100) NOT NULL,
    display_order NUMBER(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievement Types (modular achievement categories)
CREATE TABLE achievement_types (
    achievement_type_id VARCHAR2(50) PRIMARY KEY,
    achievement_type_name VARCHAR2(200) NOT NULL,
    category_id VARCHAR2(50),
    description VARCHAR2(1000),
    display_order NUMBER(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_achtype_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Sequence for persons table
CREATE SEQUENCE persons_seq START WITH 1 INCREMENT BY 1;

-- Core Person Table (one record per person)
CREATE TABLE persons (
    person_id NUMBER(10) PRIMARY KEY,
    category_id VARCHAR2(50),
    school_id VARCHAR2(50),
    full_name VARCHAR2(200) NOT NULL,
    email VARCHAR2(200),
    graduation_year VARCHAR2(20),
    profile_image_url VARCHAR2(500),
    bio VARCHAR2(2000), -- Changed from CLOB
    linkedin_url VARCHAR2(500),
    is_featured NUMBER(1) DEFAULT 0,
    status VARCHAR2(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR2(100),
    updated_by VARCHAR2(100),
    CONSTRAINT fk_person_category FOREIGN KEY (category_id) REFERENCES categories(category_id),
    CONSTRAINT fk_person_school FOREIGN KEY (school_id) REFERENCES schools(school_id),
    CONSTRAINT uk_person UNIQUE (full_name, category_id, school_id),
    CONSTRAINT chk_is_featured CHECK (is_featured IN (0, 1))
);

-- Trigger for auto-increment on persons
CREATE OR REPLACE TRIGGER persons_bir 
BEFORE INSERT ON persons 
FOR EACH ROW
BEGIN
    IF :new.person_id IS NULL THEN
        SELECT persons_seq.NEXTVAL INTO :new.person_id FROM dual;
    END IF;
END;
/

-- Sequence for achievement_records
CREATE SEQUENCE achievement_records_seq START WITH 1 INCREMENT BY 1;

-- Achievement Records (multiple records per person)
CREATE TABLE achievement_records (
    achievement_id NUMBER(10) PRIMARY KEY,
    person_id NUMBER(10),
    achievement_type_id VARCHAR2(50),
    achievement_title VARCHAR2(500) NOT NULL,
    achievement_description VARCHAR2(2000), -- Changed from CLOB
    
    -- Flexible metadata fields
    academic_year VARCHAR2(20),
    semester VARCHAR2(20),
    achievement_date DATE,
    gpa NUMBER(4,3),
    position_held VARCHAR2(200),
    organization VARCHAR2(300),
    award_level VARCHAR2(100),
    
    -- Display settings
    display_order NUMBER(10),
    is_featured NUMBER(1) DEFAULT 0,
    is_public NUMBER(1) DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR2(100),
    updated_by VARCHAR2(100),
    CONSTRAINT fk_ach_person FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_ach_type FOREIGN KEY (achievement_type_id) REFERENCES achievement_types(achievement_type_id),
    CONSTRAINT chk_ach_featured CHECK (is_featured IN (0, 1)),
    CONSTRAINT chk_ach_public CHECK (is_public IN (0, 1))
);

-- Trigger for auto-increment on achievement_records
CREATE OR REPLACE TRIGGER achievement_records_bir 
BEFORE INSERT ON achievement_records 
FOR EACH ROW
BEGIN
    IF :new.achievement_id IS NULL THEN
        SELECT achievement_records_seq.NEXTVAL INTO :new.achievement_id FROM dual;
    END IF;
END;
/

-- Sequence for cca_activities
CREATE SEQUENCE cca_activities_seq START WITH 1 INCREMENT BY 1;

-- CCA Activities (for students)
CREATE TABLE cca_activities (
    cca_id NUMBER(10) PRIMARY KEY,
    person_id NUMBER(10),
    cca_name VARCHAR2(200) NOT NULL,
    position_held VARCHAR2(200),
    start_date DATE,
    end_date DATE,
    is_current NUMBER(1) DEFAULT 0,
    description VARCHAR2(1000), -- Changed from CLOB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cca_person FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    CONSTRAINT chk_is_current CHECK (is_current IN (0, 1))
);

-- Trigger for auto-increment on cca_activities
CREATE OR REPLACE TRIGGER cca_activities_bir 
BEFORE INSERT ON cca_activities 
FOR EACH ROW
BEGIN
    IF :new.cca_id IS NULL THEN
        SELECT cca_activities_seq.NEXTVAL INTO :new.cca_id FROM dual;
    END IF;
END;
/

-- Sequence for cca_awards
CREATE SEQUENCE cca_awards_seq START WITH 1 INCREMENT BY 1;

-- Awards linked to CCA activities
CREATE TABLE cca_awards (
    cca_award_id NUMBER(10) PRIMARY KEY,
    cca_id NUMBER(10),
    award_name VARCHAR2(300) NOT NULL,
    award_date DATE,
    award_level VARCHAR2(100),
    description VARCHAR2(1000), -- Changed from CLOB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ccaaward_cca FOREIGN KEY (cca_id) REFERENCES cca_activities(cca_id) ON DELETE CASCADE
);

-- Trigger for auto-increment on cca_awards
CREATE OR REPLACE TRIGGER cca_awards_bir 
BEFORE INSERT ON cca_awards 
FOR EACH ROW
BEGIN
    IF :new.cca_award_id IS NULL THEN
        SELECT cca_awards_seq.NEXTVAL INTO :new.cca_award_id FROM dual;
    END IF;
END;
/

-- Sequence for media_gallery
CREATE SEQUENCE media_gallery_seq START WITH 1 INCREMENT BY 1;

-- Media Gallery (photos, videos, documents linked to person or achievement)
CREATE TABLE media_gallery (
    media_id NUMBER(10) PRIMARY KEY,
    person_id NUMBER(10),
    achievement_id NUMBER(10),
    media_type VARCHAR2(20),
    media_url VARCHAR2(1000) NOT NULL, -- Changed from CLOB
    caption VARCHAR2(500), -- Changed from CLOB
    display_order NUMBER(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_person FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_media_achievement FOREIGN KEY (achievement_id) REFERENCES achievement_records(achievement_id) ON DELETE CASCADE,
    CONSTRAINT chk_media_link CHECK (person_id IS NOT NULL OR achievement_id IS NOT NULL)
);

-- Trigger for auto-increment on media_gallery
CREATE OR REPLACE TRIGGER media_gallery_bir 
BEFORE INSERT ON media_gallery 
FOR EACH ROW
BEGIN
    IF :new.media_id IS NULL THEN
        SELECT media_gallery_seq.NEXTVAL INTO :new.media_id FROM dual;
    END IF;
END;
/

-- Sequence for audit_log
CREATE SEQUENCE audit_log_seq START WITH 1 INCREMENT BY 1;

-- Audit Log (using VARCHAR2 for JSON data)
CREATE TABLE audit_log (
    log_id NUMBER(10) PRIMARY KEY,
    table_name VARCHAR2(100),
    record_id NUMBER(10),
    action VARCHAR2(50),
    old_values VARCHAR2(4000), -- Changed from CLOB, stores JSON as string
    new_values VARCHAR2(4000), -- Changed from CLOB, stores JSON as string
    changed_by VARCHAR2(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for auto-increment on audit_log
CREATE OR REPLACE TRIGGER audit_log_bir 
BEFORE INSERT ON audit_log 
FOR EACH ROW
BEGIN
    IF :new.log_id IS NULL THEN
        SELECT audit_log_seq.NEXTVAL INTO :new.log_id FROM dual;
    END IF;
END;
/

-- Insert Reference Data for Schools
INSERT INTO schools (school_id, school_name, color_code) VALUES
('business', 'School of Business & Accountancy', '#FF9999');
INSERT INTO schools (school_id, school_name, color_code) VALUES
('design', 'School of Design & Environment', '#D4E157');
INSERT INTO schools (school_id, school_name, color_code) VALUES
('engineering', 'School of Engineering', '#90CAF9');
INSERT INTO schools (school_id, school_name, color_code) VALUES
('film', 'School of Film & Media Studies', '#E1BEE7');
INSERT INTO schools (school_id, school_name, color_code) VALUES
('health', 'School of Health Sciences', '#A5D6A7');
INSERT INTO schools (school_id, school_name, color_code) VALUES
('humanities', 'School of Humanities & Interdisciplinary Studies', '#80CBC4');
INSERT INTO schools (school_id, school_name, color_code) VALUES
('infocomm', 'School of Infocomm Technology', '#B39DDB');
INSERT INTO schools (school_id, school_name, color_code) VALUES
('lifesciences', 'School of Life Sciences & Chemical Technology', '#FFCC80');

COMMIT;

-- Insert Categories
INSERT INTO categories (category_id, category_name, display_order) VALUES
('alumni', 'Distinguished Alumni', 1);
INSERT INTO categories (category_id, category_name, display_order) VALUES
('staff', 'Outstanding Staff', 2);
INSERT INTO categories (category_id, category_name, display_order) VALUES
('students', 'Exemplary Students', 3);

COMMIT;

-- Insert Achievement Types for Students
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('directors_list', 'Director''s List', 'students', 1);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('internship', 'Internship', 'students', 2);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('gpa_excellence', 'GPA Excellence', 'students', 3);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('competition', 'Competition Award', 'students', 4);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('research', 'Research Project', 'students', 5);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('cca_leadership', 'CCA Leadership', 'students', 6);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('scholarship', 'Scholarship', 'students', 7);

-- Insert Achievement Types for Alumni
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('career', 'Career Achievement', 'alumni', 1);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('entrepreneurship', 'Entrepreneurship', 'alumni', 2);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('community', 'Community Service', 'alumni', 3);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('awards', 'Professional Awards', 'alumni', 4);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('publication', 'Publications', 'alumni', 5);

-- Insert Achievement Types for Staff
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('teaching', 'Teaching Excellence', 'staff', 1);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('research_staff', 'Research Achievement', 'staff', 2);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('service_years', 'Years of Service', 'staff', 3);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('mentorship', 'Mentorship', 'staff', 4);
INSERT INTO achievement_types (achievement_type_id, achievement_type_name, category_id, display_order) VALUES
('innovation', 'Innovation in Education', 'staff', 5);

COMMIT;

--------------------------------------------------------------------------------
-- Seed Data: 5 Students (idempotent via MERGE)
-- Edric Yeo, Yong Shyan An, Enjia Wu, Jeffrey Lee, Ethan
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
-- Seed Data: 5 Students (idempotent via MERGE)
-- Students: Edric, Jeffrey, Enjia, Ethan, Yong Shyan
-- Requires: schools/categories/achievement_types already inserted.
--------------------------------------------------------------------------------

-- =========================
-- 1) ENJIA WU
-- =========================
MERGE INTO persons p
USING (
  SELECT
    'students' AS category_id,
    'infocomm' AS school_id,
    'Enjia Wu' AS full_name,
    NULL AS email,
    '2026' AS graduation_year,
    'https://objectstorage.ap-singapore-1.oraclecloud.com/p/iUHTCWD27nbmiGc0d6XKYwEwRe-0sEdTdtnm37I8eX0JCIQ5ZOxFq8Imj_MlY8sh/n/axbiq8cyf7xv/b/np-hof/o/EnjiaProfilePic1755246871149.jpg' AS profile_image_url,
    'CSIT Diploma Scholar and Diploma in Information Technology student at Ngee Ann Polytechnic. Recognised for strong academic performance and multiple competition achievements.' AS bio,
    'https://www.linkedin.com/in/wuenjia/' AS linkedin_url,
    1 AS is_featured,
    'active' AS status
  FROM dual
) src
ON (p.full_name = src.full_name AND p.category_id = src.category_id AND p.school_id = src.school_id)
WHEN MATCHED THEN UPDATE SET
  p.graduation_year     = src.graduation_year,
  p.profile_image_url   = src.profile_image_url,
  p.bio                 = src.bio,
  p.linkedin_url        = src.linkedin_url,
  p.is_featured         = src.is_featured,
  p.status              = src.status,
  p.updated_at          = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  person_id, category_id, school_id, full_name, email, graduation_year,
  profile_image_url, bio, linkedin_url, is_featured, status, created_at, updated_at
) VALUES (
  NULL, src.category_id, src.school_id, src.full_name, src.email, src.graduation_year,
  src.profile_image_url, src.bio, src.linkedin_url, src.is_featured, src.status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Enjia achievements (MERGE keyed by person_id + title + date)
MERGE INTO achievement_records a
USING (
  SELECT
    (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
    'scholarship' AS achievement_type_id,
    'CSIT Diploma Scholarship' AS achievement_title,
    'Recipient of the CSIT Diploma Scholarship.' AS achievement_description,
    NULL AS achievement_date,
    NULL AS organization,
    1 AS display_order
  FROM dual
) src
ON (
  a.person_id = src.person_id
  AND a.achievement_title = src.achievement_title
  AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01')
)
WHEN MATCHED THEN UPDATE SET
  a.achievement_type_id       = src.achievement_type_id,
  a.achievement_description   = src.achievement_description,
  a.organization              = src.organization,
  a.display_order             = src.display_order,
  a.updated_at                = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  src.achievement_date, src.organization, src.display_order, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

MERGE INTO achievement_records a
USING (
  SELECT
    (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
    'competition' AS achievement_type_id,
    'WorldSkills Singapore 2025 (ITSSB) – Medallion for Excellence' AS achievement_title,
    'Awarded Medallion for Excellence at WorldSkills Singapore 2025 (IT Software Solutions for Business).' AS achievement_description,
    NULL AS achievement_date,
    'WorldSkills Singapore' AS organization,
    2 AS display_order
  FROM dual
) src
ON (
  a.person_id = src.person_id
  AND a.achievement_title = src.achievement_title
  AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01')
)
WHEN MATCHED THEN UPDATE SET
  a.achievement_type_id       = src.achievement_type_id,
  a.achievement_description   = src.achievement_description,
  a.organization              = src.organization,
  a.display_order             = src.display_order,
  a.updated_at                = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  src.achievement_date, src.organization, src.display_order, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

MERGE INTO achievement_records a
USING (
  SELECT
    (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
    'competition' AS achievement_type_id,
    'Dell InnovateFest 2025 – Champion' AS achievement_title,
    'Champion at Dell InnovateFest 2025.' AS achievement_description,
    NULL AS achievement_date,
    'Dell InnovateFest' AS organization,
    3 AS display_order
  FROM dual
) src
ON (
  a.person_id = src.person_id
  AND a.achievement_title = src.achievement_title
  AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01')
)
WHEN MATCHED THEN UPDATE SET
  a.achievement_type_id       = src.achievement_type_id,
  a.achievement_description   = src.achievement_description,
  a.organization              = src.organization,
  a.display_order             = src.display_order,
  a.updated_at                = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Academic awards (Director's List / Cohort ranking)
MERGE INTO achievement_records a
USING (
  SELECT
    (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
    'directors_list' AS achievement_type_id,
    'Director''s List' AS achievement_title,
    'Placed on the Director''s List for strong academic performance.' AS achievement_description,
    NULL AS achievement_date,
    'Ngee Ann Polytechnic' AS organization,
    4 AS display_order
  FROM dual
) src
ON (
  a.person_id = src.person_id
  AND a.achievement_title = src.achievement_title
  AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01')
)
WHEN MATCHED THEN UPDATE SET
  a.achievement_type_id       = src.achievement_type_id,
  a.achievement_description   = src.achievement_description,
  a.organization              = src.organization,
  a.display_order             = src.display_order,
  a.updated_at                = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

MERGE INTO achievement_records a
USING (
  SELECT
    (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
    'gpa_excellence' AS achievement_type_id,
    'Top in Cohort – AY23/24 Semester 1' AS achievement_title,
    'Top in cohort for AY23/24 Semester 1.' AS achievement_description,
    NULL AS achievement_date,
    'Ngee Ann Polytechnic' AS organization,
    5 AS display_order
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
  a.organization            = src.organization,
  a.display_order           = src.display_order,
  a.updated_at              = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  academic_year, semester, organization, display_order, is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  'AY23/24', 'Semester 1', src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

MERGE INTO achievement_records a
USING (
  SELECT
    (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
    'gpa_excellence' AS achievement_type_id,
    '3rd in Cohort – AY23/24 Semester 2' AS achievement_title,
    'Ranked 3rd in cohort for AY23/24 Semester 2.' AS achievement_description,
    NULL AS achievement_date,
    'Ngee Ann Polytechnic' AS organization,
    6 AS display_order
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
  a.organization            = src.organization,
  a.display_order           = src.display_order,
  a.updated_at              = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  academic_year, semester, organization, display_order, is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  'AY23/24', 'Semester 2', src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

MERGE INTO achievement_records a
USING (
  SELECT
    (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
    'gpa_excellence' AS achievement_type_id,
    '3rd in Cohort – AY24/25 Semester 1' AS achievement_title,
    'Ranked 3rd in cohort for AY24/25 Semester 1.' AS achievement_description,
    NULL AS achievement_date,
    'Ngee Ann Polytechnic' AS organization,
    7 AS display_order
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
  a.organization            = src.organization,
  a.display_order           = src.display_order,
  a.updated_at              = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
  academic_year, semester, organization, display_order, is_featured, is_public, created_at, updated_at
) VALUES (
  NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
  'AY24/25', 'Semester 1', src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Key competitions (compact list)
MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'OCBC Ignite Innovation Challenge 2024 – 1st Place' AS achievement_title,
         'Placed 1st at OCBC Ignite Innovation Challenge 2024.' AS achievement_description,
         NULL AS achievement_date,
         'OCBC' AS organization,
         8 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'ASEAN Investment Challenge 2024 – 3rd Place' AS achievement_title,
         'Placed 3rd at ASEAN Investment Challenge 2024.' AS achievement_description,
         NULL AS achievement_date,
         'ASEAN Investment Challenge' AS organization,
         9 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'ASEAN Investment Challenge 2025 – 4th Place' AS achievement_title,
         'Placed 4th at ASEAN Investment Challenge 2025.' AS achievement_description,
         NULL AS achievement_date,
         'ASEAN Investment Challenge' AS organization,
         10 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Enjia Wu' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'SUSS Analytics and Visualisation Challenge 2023 – Silver Award' AS achievement_title,
         'Silver Award at SUSS Analytics and Visualisation Challenge 2023.' AS achievement_description,
         NULL AS achievement_date,
         'SUSS' AS organization,
         11 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- =========================
-- 2) JEFFREY LEE
-- =========================
MERGE INTO persons p
USING (
  SELECT
    'students' AS category_id,
    'infocomm' AS school_id,
    'Jeffrey Lee' AS full_name,
    NULL AS email,
    '2026' AS graduation_year,
    'https://objectstorage.ap-singapore-1.oraclecloud.com/p/iUHTCWD27nbmiGc0d6XKYwEwRe-0sEdTdtnm37I8eX0JCIQ5ZOxFq8Imj_MlY8sh/n/axbiq8cyf7xv/b/np-hof/o/JeffreyProfilePic1752821212348.jpg' AS profile_image_url,
    'Diploma in Information Technology student recognised for top academic performance and multiple awards (including scholarship, innovation and competition achievements).' AS bio,
    'https://www.linkedin.com/in/jeffrey-lee-8a9461236/' AS linkedin_url,
    1 AS is_featured,
    'active' AS status
  FROM dual
) src
ON (p.full_name = src.full_name AND p.category_id = src.category_id AND p.school_id = src.school_id)
WHEN MATCHED THEN UPDATE SET
  p.graduation_year     = src.graduation_year,
  p.profile_image_url   = src.profile_image_url,
  p.bio                 = src.bio,
  p.linkedin_url        = src.linkedin_url,
  p.is_featured         = src.is_featured,
  p.status              = src.status,
  p.updated_at          = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  person_id, category_id, school_id, full_name, email, graduation_year,
  profile_image_url, bio, linkedin_url, is_featured, status, created_at, updated_at
) VALUES (
  NULL, src.category_id, src.school_id, src.full_name, src.email, src.graduation_year,
  src.profile_image_url, src.bio, src.linkedin_url, src.is_featured, src.status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Jeffrey achievements (representative set from your DOCX)
MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'scholarship' AS achievement_type_id,
         'DSTA Polytechnic Digital Scholarship' AS achievement_title,
         'Recipient of the DSTA Polytechnic Digital Scholarship.' AS achievement_description,
         NULL AS achievement_date,
         'DSTA' AS organization,
         1 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'directors_list' AS achievement_type_id,
         'Director''s List – Year 1 Semester 1' AS achievement_title,
         'Placed on the Director''s List for Year 1 Semester 1.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         2 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, semester, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, 'Year 1 Sem 1', src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'directors_list' AS achievement_type_id,
         'Director''s List – Year 1 Semester 2' AS achievement_title,
         'Placed on the Director''s List for Year 1 Semester 2.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         3 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, semester, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, 'Year 1 Sem 2', src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'gpa_excellence' AS achievement_type_id,
         'Most Outstanding Performance in Cohort – Year 1 Sem 1 & 2' AS achievement_title,
         'Achieved Most Outstanding Performance in Cohort for Year 1 Sem 1 and Sem 2.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         4 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'gpa_excellence' AS achievement_type_id,
         'Module Excellence Awards (Multiple Modules)' AS achievement_title,
         'Most Outstanding Performance in multiple modules, including: Innovation Made Possible, Front-End Development, Operating Systems & Networking Fundamentals, Databases, Communication Essentials, Computing Mathematics, Design Principles, Fundamentals of IT Professionals I.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         5 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'Dell InnovateFest 2025 – Champion' AS achievement_title,
         'Champion at Dell InnovateFest 2025.' AS achievement_description,
         NULL AS achievement_date,
         'Dell InnovateFest' AS organization,
         6 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'BrainHack XRPERIENCE – Outstanding Performance' AS achievement_title,
         'Recognised for Outstanding Performance at BrainHack XRPERIENCE.' AS achievement_description,
         NULL AS achievement_date,
         'BrainHack' AS organization,
         7 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Jeffrey Lee' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'Chairman''s Award' AS achievement_title,
         'Recipient of the Chairman''s Award.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         8 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- =========================
-- 3) ETHAN CHEW
-- =========================
MERGE INTO persons p
USING (
  SELECT
    'students' AS category_id,
    'infocomm' AS school_id,
    'Ethan Chew' AS full_name,
    NULL AS email,
    '2026' AS graduation_year,
    'https://objectstorage.ap-singapore-1.oraclecloud.com/p/iUHTCWD27nbmiGc0d6XKYwEwRe-0sEdTdtnm37I8eX0JCIQ5ZOxFq8Imj_MlY8sh/n/axbiq8cyf7xv/b/np-hof/o/EthanProfilePic1712849929766.jpg' AS profile_image_url,
    'Diploma in Information Technology student at Ngee Ann Polytechnic; recognised for strong academic performance and competition achievements.' AS bio,
    'https://www.linkedin.com/in/ethan-chew/' AS linkedin_url,
    1 AS is_featured,
    'active' AS status
  FROM dual
) src
ON (p.full_name = src.full_name AND p.category_id = src.category_id AND p.school_id = src.school_id)
WHEN MATCHED THEN UPDATE SET
  p.graduation_year     = src.graduation_year,
  p.profile_image_url   = src.profile_image_url,
  p.bio                 = src.bio,
  p.linkedin_url        = src.linkedin_url,
  p.is_featured         = src.is_featured,
  p.status              = src.status,
  p.updated_at          = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  person_id, category_id, school_id, full_name, email, graduation_year,
  profile_image_url, bio, linkedin_url, is_featured, status, created_at, updated_at
) VALUES (
  NULL, src.category_id, src.school_id, src.full_name, src.email, src.graduation_year,
  src.profile_image_url, src.bio, src.linkedin_url, src.is_featured, src.status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'scholarship' AS achievement_type_id,
         'Ngee Ann Polytechnic Scholarship' AS achievement_title,
         'Recipient of the Ngee Ann Polytechnic Scholarship.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         1 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'scholarship' AS achievement_type_id,
         'A*STAR Science Award' AS achievement_title,
         'Recipient of the A*STAR Science Award.' AS achievement_description,
         NULL AS achievement_date,
         'A*STAR' AS organization,
         2 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'directors_list' AS achievement_type_id,
         'Director''s List – Year 1 Sem 1 & 2' AS achievement_title,
         'Placed on the Director''s List for Year 1 Sem 1 and Sem 2.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         3 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'gpa_excellence' AS achievement_type_id,
         'Second Most Outstanding Performance in Cohort – Year 1 Sem 2' AS achievement_title,
         'Achieved second most outstanding performance in cohort for Year 1 Sem 2.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         4 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, semester, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, 'Year 1 Sem 2', src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'WorldSkills Singapore 2025 – Medallion of Excellence' AS achievement_title,
         'Awarded Medallion of Excellence at WorldSkills Singapore 2025.' AS achievement_description,
         NULL AS achievement_date,
         'WorldSkills Singapore' AS organization,
         5 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'competition' AS achievement_type_id,
         'Dell InnovateFest 2025 – Champion' AS achievement_title,
         'Champion at Dell InnovateFest 2025.' AS achievement_description,
         NULL AS achievement_date,
         'Dell InnovateFest' AS organization,
         6 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Optional: Ethan leadership CCAs (from public personal site summary)
MERGE INTO cca_activities c
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'NP Photography Club' AS cca_name,
         'President' AS position_held,
         NULL AS start_date,
         NULL AS end_date,
         1 AS is_current,
         'President of NP Photography Club (AY25/26).' AS description
  FROM dual
) src
ON (c.person_id=src.person_id AND c.cca_name=src.cca_name AND NVL(c.position_held,'-')=NVL(src.position_held,'-'))
WHEN MATCHED THEN UPDATE SET
  c.is_current = src.is_current,
  c.description = src.description
WHEN NOT MATCHED THEN INSERT (
  cca_id, person_id, cca_name, position_held, start_date, end_date, is_current, description, created_at
) VALUES (
  NULL, src.person_id, src.cca_name, src.position_held, src.start_date, src.end_date, src.is_current, src.description, CURRENT_TIMESTAMP
);

MERGE INTO cca_activities c
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Ethan Chew' AND category_id='students' AND school_id='infocomm') AS person_id,
         'NP Overflow' AS cca_name,
         'Vice President' AS position_held,
         NULL AS start_date,
         NULL AS end_date,
         0 AS is_current,
         'Vice President of NP Overflow (AY24/25).' AS description
  FROM dual
) src
ON (c.person_id=src.person_id AND c.cca_name=src.cca_name AND NVL(c.position_held,'-')=NVL(src.position_held,'-'))
WHEN MATCHED THEN UPDATE SET
  c.is_current = src.is_current,
  c.description = src.description
WHEN NOT MATCHED THEN INSERT (
  cca_id, person_id, cca_name, position_held, start_date, end_date, is_current, description, created_at
) VALUES (
  NULL, src.person_id, src.cca_name, src.position_held, src.start_date, src.end_date, src.is_current, src.description, CURRENT_TIMESTAMP
);


-- =========================
-- 4) YONG SHYAN AN
-- =========================
MERGE INTO persons p
USING (
  SELECT
    'students' AS category_id,
    'infocomm' AS school_id,
    'An Yong Shyan' AS full_name,
    NULL AS email,
    '2026' AS graduation_year,
    'https://objectstorage.ap-singapore-1.oraclecloud.com/p/iUHTCWD27nbmiGc0d6XKYwEwRe-0sEdTdtnm37I8eX0JCIQ5ZOxFq8Imj_MlY8sh/n/axbiq8cyf7xv/b/np-hof/o/YongShyanProfilePic1729187923878.jpg' AS profile_image_url,
    'Diploma in Information Technology student with interests in full-stack development and cloud; associated with Oracle internship context in public profile snippets.' AS bio,
    'https://www.linkedin.com/in/yong-shyan-an/?originalSubdomain=sg' AS linkedin_url,
    0 AS is_featured,
    'active' AS status
  FROM dual
) src
ON (p.full_name = src.full_name AND p.category_id = src.category_id AND p.school_id = src.school_id)
WHEN MATCHED THEN UPDATE SET
  p.graduation_year     = src.graduation_year,
  p.profile_image_url   = src.profile_image_url,
  p.bio                 = src.bio,
  p.linkedin_url        = src.linkedin_url,
  p.is_featured         = src.is_featured,
  p.status              = src.status,
  p.updated_at          = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  person_id, category_id, school_id, full_name, email, graduation_year,
  profile_image_url, bio, linkedin_url, is_featured, status, created_at, updated_at
) VALUES (
  NULL, src.category_id, src.school_id, src.full_name, src.email, src.graduation_year,
  src.profile_image_url, src.bio, src.linkedin_url, src.is_featured, src.status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Yong Shyan: add one concrete, public certification item
MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='An Yong Shyan' AND category_id='students' AND school_id='infocomm') AS person_id,
         'internship' AS achievement_type_id,
         'Oracle Cloud Infrastructure 2025 Certified Foundations Associate' AS achievement_title,
         'Earned OCI 2025 Certified Foundations Associate certification.' AS achievement_description,
         NULL AS achievement_date,
         'Oracle' AS organization,
         1 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- =========================
-- 5) EDRIC YEO
-- Note: You provided LinkedIn URL https://www.linkedin.com/in/yeo-jin-rong/
-- and a separate Edric profile image URL. This script keeps the requested name "Edric Yeo"
-- and stores the provided LinkedIn URL as-is.
-- =========================
MERGE INTO persons p
USING (
  SELECT
    'students' AS category_id,
    'infocomm' AS school_id,
    'Edric Yeo' AS full_name,
    NULL AS email,
    '2026' AS graduation_year,
    'https://objectstorage.ap-singapore-1.oraclecloud.com/p/iUHTCWD27nbmiGc0d6XKYwEwRe-0sEdTdtnm37I8eX0JCIQ5ZOxFq8Imj_MlY8sh/n/axbiq8cyf7xv/b/np-hof/o/EdricYeoProfilePic1745771599144.jpg' AS profile_image_url,
    'Diploma in Information Technology student; recognised for academic awards and module performance (per public award snippet).' AS bio,
    'https://www.linkedin.com/in/yeo-jin-rong/' AS linkedin_url,
    1 AS is_featured,
    'active' AS status
  FROM dual
) src
ON (p.full_name = src.full_name AND p.category_id = src.category_id AND p.school_id = src.school_id)
WHEN MATCHED THEN UPDATE SET
  p.graduation_year     = src.graduation_year,
  p.profile_image_url   = src.profile_image_url,
  p.bio                 = src.bio,
  p.linkedin_url        = src.linkedin_url,
  p.is_featured         = src.is_featured,
  p.status              = src.status,
  p.updated_at          = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  person_id, category_id, school_id, full_name, email, graduation_year,
  profile_image_url, bio, linkedin_url, is_featured, status, created_at, updated_at
) VALUES (
  NULL, src.category_id, src.school_id, src.full_name, src.email, src.graduation_year,
  src.profile_image_url, src.bio, src.linkedin_url, src.is_featured, src.status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Edric achievements (from public awards snippet associated to the provided LinkedIn URL)
MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Edric Yeo' AND category_id='students' AND school_id='infocomm') AS person_id,
         'directors_list' AS achievement_type_id,
         'Director''s List – AY24/25 (April Semester)' AS achievement_title,
         'Placed on the Director''s List for AY24/25 April Semester.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         1 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Edric Yeo' AND category_id='students' AND school_id='infocomm') AS person_id,
         'gpa_excellence' AS achievement_type_id,
         'Best Performance – Mobile Applications Development' AS achievement_title,
         'Awarded Best Performance in Mobile Applications Development module.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         2 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO achievement_records a
USING (
  SELECT (SELECT person_id FROM persons WHERE full_name='Edric Yeo' AND category_id='students' AND school_id='infocomm') AS person_id,
         'gpa_excellence' AS achievement_type_id,
         'Best Performance – Fundamentals for IT Professionals II' AS achievement_title,
         'Awarded Best Performance in Fundamentals for IT Professionals II module.' AS achievement_description,
         NULL AS achievement_date,
         'Ngee Ann Polytechnic' AS organization,
         3 AS display_order
  FROM dual
) src
ON (a.person_id=src.person_id AND a.achievement_title=src.achievement_title AND NVL(a.achievement_date, DATE '1900-01-01')=NVL(src.achievement_date, DATE '1900-01-01'))
WHEN MATCHED THEN UPDATE SET a.achievement_description=src.achievement_description, a.organization=src.organization, a.display_order=src.display_order, a.updated_at=CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (achievement_id, person_id, achievement_type_id, achievement_title, achievement_description, achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at)
VALUES (NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description, src.achievement_date, src.organization, src.display_order, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;

-- =========================
-- Additional Featured Entries
-- =========================
--------------------------------------------------------------------------------
-- Patch (Oracle): Standardise Director's List format + add more achievements
-- for Edric Yeo (safe + idempotent)
--------------------------------------------------------------------------------

DECLARE
  v_person_id persons.person_id%TYPE;
BEGIN
  -- Resolve Edric's PERSON_ID once
  SELECT person_id
    INTO v_person_id
    FROM persons
   WHERE full_name   = 'Edric Yeo'
     AND category_id = 'students'
     AND school_id   = 'infocomm';

  -- 1) Standardise existing record title to the common format (ASCII hyphen)
  UPDATE achievement_records a
     SET a.achievement_type_id     = 'directors_list',
         a.achievement_title       = 'Director''s List - Year 2 Semester 1',
         a.achievement_description = 'Placed on the Director''s List for Year 2 Semester 1.',
         a.academic_year           = 'AY24/25',
         a.semester                = 'Year 2 Sem 1',
         a.organization            = 'Ngee Ann Polytechnic',
         a.display_order           = 1,
         a.is_featured             = 0,
         a.is_public               = 1,
         a.updated_at              = CURRENT_TIMESTAMP
   WHERE a.person_id = v_person_id
     AND a.achievement_title = 'Director''s List – AY24/25 (April Semester)';

  -- 2) Add remaining Director's List entries (MERGE idempotent)
  MERGE INTO achievement_records a
  USING (
    SELECT v_person_id AS person_id,
           'directors_list' AS achievement_type_id,
           'Director''s List - Year 2 Semester 2' AS achievement_title,
           'Placed on the Director''s List for Year 2 Semester 2.' AS achievement_description,
           'AY24/25' AS academic_year,
           'Year 2 Sem 2' AS semester,
           NULL AS achievement_date,
           'Ngee Ann Polytechnic' AS organization,
           2 AS display_order,
           0 AS is_featured,
           1 AS is_public
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

  MERGE INTO achievement_records a
  USING (
    SELECT v_person_id AS person_id,
           'directors_list' AS achievement_type_id,
           'Director''s List - Year 1 Semester 1' AS achievement_title,
           'Placed on the Director''s List for Year 1 Semester 1.' AS achievement_description,
           'AY23/24' AS academic_year,
           'Year 1 Sem 1' AS semester,
           NULL AS achievement_date,
           'Ngee Ann Polytechnic' AS organization,
           3 AS display_order,
           0 AS is_featured,
           1 AS is_public
      FROM dual
  ) src
  ON (a.person_id = src.person_id AND a.achievement_title = src.achievement_title
      AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01'))
  WHEN MATCHED THEN UPDATE SET
    a.achievement_type_id=src.achievement_type_id, a.achievement_description=src.achievement_description,
    a.academic_year=src.academic_year, a.semester=src.semester, a.organization=src.organization,
    a.display_order=src.display_order, a.is_featured=src.is_featured, a.is_public=src.is_public,
    a.updated_at=CURRENT_TIMESTAMP
  WHEN NOT MATCHED THEN INSERT (
    achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
    academic_year, semester, achievement_date, organization, display_order,
    is_featured, is_public, created_at, updated_at
  ) VALUES (
    NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
    src.academic_year, src.semester, src.achievement_date, src.organization, src.display_order,
    src.is_featured, src.is_public, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  MERGE INTO achievement_records a
  USING (
    SELECT v_person_id AS person_id,
           'directors_list' AS achievement_type_id,
           'Director''s List - Year 1 Semester 2' AS achievement_title,
           'Placed on the Director''s List for Year 1 Semester 2.' AS achievement_description,
           'AY23/24' AS academic_year,
           'Year 1 Sem 2' AS semester,
           NULL AS achievement_date,
           'Ngee Ann Polytechnic' AS organization,
           4 AS display_order,
           0 AS is_featured,
           1 AS is_public
      FROM dual
  ) src
  ON (a.person_id = src.person_id AND a.achievement_title = src.achievement_title
      AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01'))
  WHEN MATCHED THEN UPDATE SET
    a.achievement_type_id=src.achievement_type_id, a.achievement_description=src.achievement_description,
    a.academic_year=src.academic_year, a.semester=src.semester, a.organization=src.organization,
    a.display_order=src.display_order, a.is_featured=src.is_featured, a.is_public=src.is_public,
    a.updated_at=CURRENT_TIMESTAMP
  WHEN NOT MATCHED THEN INSERT (
    achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
    academic_year, semester, achievement_date, organization, display_order,
    is_featured, is_public, created_at, updated_at
  ) VALUES (
    NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
    src.academic_year, src.semester, src.achievement_date, src.organization, src.display_order,
    src.is_featured, src.is_public, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  -- 3) Best Performance – Full-Stack Development Project
  MERGE INTO achievement_records a
  USING (
    SELECT v_person_id AS person_id,
           'gpa_excellence' AS achievement_type_id,
           'Best Performance - Full-Stack Development Project' AS achievement_title,
           'Awarded Best Performance in Full-Stack Development Project.' AS achievement_description,
           NULL AS achievement_date,
           'Ngee Ann Polytechnic' AS organization,
           5 AS display_order,
           0 AS is_featured,
           1 AS is_public
      FROM dual
  ) src
  ON (a.person_id = src.person_id AND a.achievement_title = src.achievement_title
      AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01'))
  WHEN MATCHED THEN UPDATE SET
    a.achievement_type_id=src.achievement_type_id, a.achievement_description=src.achievement_description,
    a.organization=src.organization, a.display_order=src.display_order,
    a.is_featured=src.is_featured, a.is_public=src.is_public, a.updated_at=CURRENT_TIMESTAMP
  WHEN NOT MATCHED THEN INSERT (
    achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
    achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at
  ) VALUES (
    NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
    src.achievement_date, src.organization, src.display_order,
    src.is_featured, src.is_public, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  -- 4) Oracle 1-Year Internship
  MERGE INTO achievement_records a
  USING (
    SELECT v_person_id AS person_id,
           'internship' AS achievement_type_id,
           'Oracle 1-Year Internship' AS achievement_title,
           'Completed a 1-year internship at Oracle.' AS achievement_description,
           NULL AS achievement_date,
           'Oracle' AS organization,
           6 AS display_order,
           1 AS is_featured,
           1 AS is_public
      FROM dual
  ) src
  ON (a.person_id = src.person_id AND a.achievement_title = src.achievement_title
      AND NVL(a.achievement_date, DATE '1900-01-01') = NVL(src.achievement_date, DATE '1900-01-01'))
  WHEN MATCHED THEN UPDATE SET
    a.achievement_type_id=src.achievement_type_id, a.achievement_description=src.achievement_description,
    a.organization=src.organization, a.display_order=src.display_order,
    a.is_featured=src.is_featured, a.is_public=src.is_public, a.updated_at=CURRENT_TIMESTAMP
  WHEN NOT MATCHED THEN INSERT (
    achievement_id, person_id, achievement_type_id, achievement_title, achievement_description,
    achievement_date, organization, display_order, is_featured, is_public, created_at, updated_at
  ) VALUES (
    NULL, src.person_id, src.achievement_type_id, src.achievement_title, src.achievement_description,
    src.achievement_date, src.organization, src.display_order,
    src.is_featured, src.is_public, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  COMMIT;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20001, 'Edric Yeo not found in PERSONS (students/infocomm).');
END;


-- Alumni: Dr. Sarah Tan with multiple career milestones
INSERT INTO persons (category_id, school_id, full_name, graduation_year, bio, is_featured) VALUES
('alumni', 'engineering', 'Dr. Sarah Tan', '2005', 
 'Pioneering leader in robotics and AI with multiple entrepreneurial ventures', 1);

INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, organization, display_order) VALUES
(persons_seq.CURRVAL, 'career', 'Founded TechVenture Pte Ltd', 
    'Established leading robotics company serving 50+ clients across ASEAN',
    TO_DATE('2010-03-01', 'YYYY-MM-DD'), 'TechVenture Pte Ltd', 1);
INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, organization, display_order) VALUES
(persons_seq.CURRVAL, 'career', 'Promoted to CEO', 
    'Led company growth from 10 to 200+ employees, expanding to 5 countries',
    TO_DATE('2015-06-01', 'YYYY-MM-DD'), 'TechVenture Pte Ltd', 2);
INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, organization, display_order) VALUES
(persons_seq.CURRVAL, 'awards', 'Entrepreneur of the Year 2020', 
    'Recognized for innovation in robotics and AI solutions',
    TO_DATE('2020-11-15', 'YYYY-MM-DD'), 'Singapore Business Awards', 3);
INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, organization, display_order) VALUES
(persons_seq.CURRVAL, 'awards', 'PhD in Robotics', 
    'Completed doctorate research in autonomous systems',
    TO_DATE('2012-05-01', 'YYYY-MM-DD'), 'NTU Singapore', 4);

COMMIT;

-- Staff: Prof. John Chen with multiple achievements
INSERT INTO persons (category_id, school_id, full_name, bio, is_featured) VALUES
('staff', 'infocomm', 'Prof. John Chen', 
 'Dedicated educator and researcher with 15 years of excellence in teaching', 1);

INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, display_order) VALUES
(persons_seq.CURRVAL, 'teaching', 'Outstanding Educator Award 2024', 
    'Recognized for innovative teaching methods and student engagement',
    TO_DATE('2024-03-15', 'YYYY-MM-DD'), 1);
INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, display_order) VALUES
(persons_seq.CURRVAL, 'service_years', '15 Years of Dedicated Service', 
    'Celebrating 15 years of excellence in education at Ngee Ann Polytechnic',
    TO_DATE('2024-01-10', 'YYYY-MM-DD'), 2);
INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, display_order) VALUES
(persons_seq.CURRVAL, 'research_staff', 'Published 30+ Research Papers', 
    'Contributed significantly to computer science research in AI and machine learning',
    TO_DATE('2023-12-01', 'YYYY-MM-DD'), 3);
INSERT INTO achievement_records (person_id, achievement_type_id, achievement_title, achievement_description, 
    achievement_date, display_order) VALUES
(persons_seq.CURRVAL, 'mentorship', 'Mentored 500+ Students', 
    'Guided students to successful careers in technology industry',
    TO_DATE('2024-01-01', 'YYYY-MM-DD'), 4);

COMMIT;

-- Create Indexes for Performance
CREATE INDEX idx_persons_category ON persons(category_id);
CREATE INDEX idx_persons_school ON persons(school_id);
CREATE INDEX idx_persons_featured ON persons(is_featured);
CREATE INDEX idx_persons_status ON persons(status);
CREATE INDEX idx_achievement_person ON achievement_records(person_id);
CREATE INDEX idx_achievement_type ON achievement_records(achievement_type_id);
CREATE INDEX idx_achievement_date ON achievement_records(achievement_date);
CREATE INDEX idx_achievement_year ON achievement_records(academic_year);
CREATE INDEX idx_cca_person ON cca_activities(person_id);
CREATE INDEX idx_media_person ON media_gallery(person_id);
CREATE INDEX idx_media_achievement ON media_gallery(achievement_id);

-- Comprehensive View: Person with All Achievements
CREATE OR REPLACE VIEW vw_person_achievements AS
SELECT 
    p.person_id,
    p.full_name,
    p.email,
    p.bio,
    p.graduation_year,
    p.profile_image_url,
    p.is_featured as person_featured,
    c.category_id,
    c.category_name,
    s.school_id,
    s.school_name,
    s.color_code,
    a.achievement_id,
    a.achievement_title,
    a.achievement_description,
    at.achievement_type_name,
    a.academic_year,
    a.semester,
    a.achievement_date,
    a.gpa,
    a.position_held,
    a.organization,
    a.award_level,
    a.display_order,
    a.is_featured as achievement_featured
FROM persons p
JOIN categories c ON p.category_id = c.category_id
JOIN schools s ON p.school_id = s.school_id
LEFT JOIN achievement_records a ON p.person_id = a.person_id
LEFT JOIN achievement_types at ON a.achievement_type_id = at.achievement_type_id
WHERE p.status = 'active' AND (a.is_public IS NULL OR a.is_public = 1)
ORDER BY p.is_featured DESC, p.person_id, a.display_order;

-- Trigger for Updated Timestamp on persons
CREATE OR REPLACE TRIGGER update_persons_modtime
BEFORE UPDATE ON persons
FOR EACH ROW
BEGIN
    :new.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for Updated Timestamp on achievement_records
CREATE OR REPLACE TRIGGER update_achievements_modtime
BEFORE UPDATE ON achievement_records
FOR EACH ROW
BEGIN
    :new.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Example Queries:
-- Get Edric Yeo's achievements
-- SELECT * FROM vw_person_achievements WHERE person_id = 1 ORDER BY display_order;

-- Get all students from infocomm school
-- SELECT DISTINCT person_id, full_name, bio FROM vw_person_achievements 
-- WHERE category_id = 'students' AND school_id = 'infocomm';

-- Get achievement count by person
-- SELECT person_id, full_name, school_name, COUNT(achievement_id) as achievement_count
-- FROM vw_person_achievements
-- WHERE category_id = 'students'
-- GROUP BY person_id, full_name, school_name
-- ORDER BY achievement_count DESC;

------------------------------------------------------------
-- 1) CANVAS_BOARD  (one row per whiteboard / year / event)
------------------------------------------------------------
CREATE TABLE CANVAS_BOARD (
  BOARD_ID      NUMBER GENERATED BY DEFAULT AS IDENTITY
                PRIMARY KEY,
  BOARD_KEY     VARCHAR2(50) NOT NULL UNIQUE,
  TITLE         VARCHAR2(200) NOT NULL,
  DESCRIPTION   VARCHAR2(1000),
  WORLD_WIDTH   NUMBER(10)    DEFAULT 5000 NOT NULL,
  WORLD_HEIGHT  NUMBER(10)    DEFAULT 5000 NOT NULL,
  IS_ACTIVE     CHAR(1)       DEFAULT 'Y'
                CHECK (IS_ACTIVE IN ('Y', 'N')),
  CREATED_AT    TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

-- Default board
INSERT INTO CANVAS_BOARD (BOARD_KEY, TITLE, DESCRIPTION)
VALUES (
  'NP-MEMORY-WALL-2025',
  'NP Memory Wall 2025',
  'End-of-year community memory wall'
);

------------------------------------------------------------
-- 2) CANVAS_MESSAGES  (one row per message on a board)
------------------------------------------------------------
CREATE TABLE CANVAS_MESSAGES (
  MESSAGE_ID   NUMBER GENERATED BY DEFAULT AS IDENTITY
               PRIMARY KEY,
  BOARD_ID     NUMBER NOT NULL
               REFERENCES CANVAS_BOARD(BOARD_ID),
  X_COORD      NUMBER(10,2) NOT NULL,
  Y_COORD      NUMBER(10,2) NOT NULL,
  NOTE_COLOR   VARCHAR2(20),
  MESSAGE_TEXT VARCHAR2(1000) NOT NULL,
  AUTHOR_NAME  VARCHAR2(200),
  CREATED_AT   TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

-- Constraint to ensure NOTE_COLOR is one of the predefined values
ALTER TABLE CANVAS_MESSAGES
  ADD CONSTRAINT chk_canvas_note_color
  CHECK (NOTE_COLOR IN ('sky', 'emerald', 'amber', 'violet'));

  ALTER TABLE CANVAS_MESSAGES ADD (
  FEEL_EMOJI VARCHAR2(8 CHAR)
);

-- Index for faster retrieval of messages by board and creation time
CREATE INDEX IDX_CANVAS_MESSAGES_BOARD
  ON CANVAS_MESSAGES (BOARD_ID, CREATED_AT DESC);
COMMIT;

------------------------------------------------------------
-- Additional Module: Comments for Hall of Fame Persons
-- 1) Sequence for comments (if you use sequences elsewhere)
CREATE SEQUENCE HOF_PERSON_COMMENTS_SEQ
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

-- 2) Table to store comments for each Hall of Fame person
CREATE TABLE HOF_PERSON_COMMENTS (
  COMMENT_ID     NUMBER        NOT NULL,
  PERSON_ID      NUMBER        NOT NULL,
  DISPLAY_NAME   VARCHAR2(100),        -- optional name typed by user
  IS_ANONYMOUS   CHAR(1) DEFAULT 'Y'   -- 'Y' or 'N'
    CHECK (IS_ANONYMOUS IN ('Y','N')),
  CONTENT        CLOB          NOT NULL,
  CREATED_AT     TIMESTAMP DEFAULT SYSTIMESTAMP,

  CONSTRAINT HOF_PERSON_COMMENTS_PK PRIMARY KEY (COMMENT_ID),
  CONSTRAINT HOF_PERSON_COMMENTS_PERSON_FK
    FOREIGN KEY (PERSON_ID)
    REFERENCES PERSONS (PERSON_ID)     -- adjust to your person table name
    ON DELETE CASCADE
);

------------------------------------------------------------
-- Add Category: Community Honourees
------------------------------------------------------------

-- Insert category (idempotent)
MERGE INTO categories c
USING (
  SELECT 'community' AS category_id,
         'Community Honourees' AS category_name,
         4 AS display_order
  FROM dual
) src
ON (c.category_id = src.category_id)
WHEN MATCHED THEN UPDATE SET
  c.category_name  = src.category_name,
  c.display_order  = src.display_order
WHEN NOT MATCHED THEN INSERT (category_id, category_name, display_order, created_at)
VALUES (src.category_id, src.category_name, src.display_order, CURRENT_TIMESTAMP);

COMMIT;

------------------------------------------------------------
-- Achievement Types for Community Honourees (optional)
------------------------------------------------------------

MERGE INTO achievement_types t
USING (SELECT 'community_service' achievement_type_id, 'Community Service' achievement_type_name, 'community' category_id, 1 display_order FROM dual) src
ON (t.achievement_type_id = src.achievement_type_id)
WHEN MATCHED THEN UPDATE SET t.achievement_type_name=src.achievement_type_name, t.category_id=src.category_id, t.display_order=src.display_order
WHEN NOT MATCHED THEN INSERT (achievement_type_id, achievement_type_name, category_id, display_order, created_at)
VALUES (src.achievement_type_id, src.achievement_type_name, src.category_id, src.display_order, CURRENT_TIMESTAMP);

MERGE INTO achievement_types t
USING (SELECT 'volunteer_leadership' achievement_type_id, 'Volunteer Leadership' achievement_type_name, 'community' category_id, 2 display_order FROM dual) src
ON (t.achievement_type_id = src.achievement_type_id)
WHEN MATCHED THEN UPDATE SET t.achievement_type_name=src.achievement_type_name, t.category_id=src.category_id, t.display_order=src.display_order
WHEN NOT MATCHED THEN INSERT (achievement_type_id, achievement_type_name, category_id, display_order, created_at)
VALUES (src.achievement_type_id, src.achievement_type_name, src.category_id, src.display_order, CURRENT_TIMESTAMP);

MERGE INTO achievement_types t
USING (SELECT 'industry_partner' achievement_type_id, 'Industry Partnership' achievement_type_name, 'community' category_id, 3 display_order FROM dual) src
ON (t.achievement_type_id = src.achievement_type_id)
WHEN MATCHED THEN UPDATE SET t.achievement_type_name=src.achievement_type_name, t.category_id=src.category_id, t.display_order=src.display_order
WHEN NOT MATCHED THEN INSERT (achievement_type_id, achievement_type_name, category_id, display_order, created_at)
VALUES (src.achievement_type_id, src.achievement_type_name, src.category_id, src.display_order, CURRENT_TIMESTAMP);

COMMIT;

SELECT parameter, value
FROM nls_database_parameters
WHERE parameter IN ('NLS_CHARACTERSET', 'NLS_NCHAR_CHARACTERSET');

-- 1) Create aggregated reaction counts table (recommended)
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE CANVAS_MESSAGE_REACTION_COUNTS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

CREATE TABLE CANVAS_MESSAGE_REACTION_COUNTS (
  MESSAGE_ID      NUMBER NOT NULL,
  EMOJI           VARCHAR2(8 CHAR) NOT NULL,
  REACTION_COUNT  NUMBER DEFAULT 0 NOT NULL,
  UPDATED_AT      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT PK_CANVAS_REACTION_COUNTS PRIMARY KEY (MESSAGE_ID, EMOJI),
  CONSTRAINT FK_CANVAS_REACTION_COUNTS_MSG
    FOREIGN KEY (MESSAGE_ID) REFERENCES CANVAS_MESSAGES(MESSAGE_ID) ON DELETE CASCADE
);

CREATE INDEX IDX_REACTION_COUNTS_MSG ON CANVAS_MESSAGE_REACTION_COUNTS (MESSAGE_ID);

-- Optional: keep your old CANVAS_MESSAGE_REACTIONS table, but it’s no longer needed for counts.
-- If you want to fully remove it:
-- DROP TABLE CANVAS_MESSAGE_REACTIONS CASCADE CONSTRAINTS;

COMMIT;



