-- Create the milestones table
CREATE TABLE milestones (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year NUMBER(4) NOT NULL,
    title VARCHAR2(500) NOT NULL,
    description CLOB NOT NULL,
    category VARCHAR2(100),
    era_name VARCHAR2(100),
    image_url VARCHAR2(500),
    display_order NUMBER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster year-based queries
CREATE INDEX idx_milestones_year ON milestones(year);
CREATE INDEX idx_milestones_category ON milestones(category);

-- Insert 1960s milestones
INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1963, 'Ngee Ann College Inaugurated', 'Ngee Ann College was inaugurated on May 25, 1963, marking the beginning of a quality educational institution linking the Chinese-speaking community to its cultural roots.', 'Foundation', 'Founding Years', 1);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1963, 'Independent Institution', 'The College became a legal independent institution governed by a Council.', 'Governance', 'Founding Years', 2);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1965, 'Name Change to Technical College', 'To reflect its expanded role and focus on technical education, the College changed its name to Ngee Ann Technical College.', 'Identity', 'Founding Years', 3);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1966, 'Move to Clementi Campus', 'The College moved from the Teochew Building at Tank Road to its Clementi campus.', 'Campus', 'Founding Years', 4);

-- Insert 1970s milestones
INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1970, 'Degree Courses Phased Out', 'The degree courses were phased out to focus on diploma-level education.', 'Academic', 'Changing Focus', 5);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1970, 'English as Medium of Instruction', 'English replaced Chinese as the College''s sole medium of instruction, marking a significant shift in educational approach.', 'Academic', 'Changing Focus', 6);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1970, 'Business Orientation Programme', 'The Business Orientation Programme was introduced to enhance students'' business acumen.', 'Academic', 'Changing Focus', 7);

-- Insert 1980s milestones
INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1981, 'Phase I Campus Expansion', 'A five-year Phase I campus expansion project was launched to cater to accelerated increase in student enrolment. Completed in 1986, it included new buildings, laboratories, lecture theatres, four canteens, a sports complex, three residential apartment blocks and an eight-story administration building.', 'Campus', 'From College to Polytechnic', 8);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1982, 'Became Ngee Ann Polytechnic', 'To reflect its expanded role in providing quality education, the college''s name was changed to Ngee Ann Polytechnic. Course curricula were also revised to promote practical and hands-on training.', 'Identity', 'From College to Polytechnic', 9);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1983, 'Continuing Education Centre', 'The Continuing Education Centre (currently known as CET Academy) was set up to provide a platform for postgraduates and working professionals to further their education and upgrade their skills.', 'Academic', 'From College to Polytechnic', 10);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1987, 'Phase II Campus Expansion', 'NP embarked on Phase II campus expansion that added new facilities such as teaching blocks. Two subsequent phases were rolled out in 1990 and 1992.', 'Campus', 'From College to Polytechnic', 11);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1988, '25th Anniversary Celebration', 'NP celebrated its 25th anniversary with enrolment surpassing the 10,000-mark. The late president Mr Ong Teng Cheong planted a Tembusu tree to mark the occasion. Dr Tay Eng Soon planted a time capsule that was unearthed in 2013.', 'Milestone', 'From College to Polytechnic', 12);

-- Insert 1990s milestones
INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1990, 'International Fellowship Programme', 'NP''s Human Resource Office started the International Fellowship and Visiting Lecturer Scheme, attracting lecturers from UK, US, Australia, Japan, New South Wales, China and India.', 'Academic', 'Pioneered E-Learning', 13);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1992, 'Campus Redevelopment Programme', 'The Polytechnic rolled out a new phase of campus environment and facilities upgrading. Known as Phase 1 campus redevelopment programme, the Multi-Purpose Hall underwent major refurbishment works.', 'Campus', 'Pioneered E-Learning', 14);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1997, 'First Mobile E-Learning', 'The Polytechnic was the first of its kind to launch Mobile e-Learning, which encompassed a notebook ownership scheme, a wireless campus network and an e-learning platform.', 'Technology', 'Pioneered E-Learning', 15);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(1999, 'Singapore Quality Class Award', 'NP was accorded the prestigious Singapore Quality Class Award, recognizing its commitment to excellence.', 'Recognition', 'Pioneered E-Learning', 16);

-- Insert 2000s milestones
INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2000, 'Ngee Ann Learning Model', 'The Polytechnic launched the Ngee Ann Learning Model (NLM), its unique broad-based approach of equipping students with a judicious blend of hard and soft skills to thrive in the knowledge economy. NP also pioneered a talent development programme and unveiled the Lifestyle Library.', 'Academic', 'Rapid Growth', 17);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2001, 'Interdisciplinary Studies', 'NP rolled out its plan to incorporate interdisciplinary studies into the curriculum, promoting cross-disciplinary learning.', 'Academic', 'Rapid Growth', 18);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2002, 'Convention Centre Built', 'As part of Phase 5 redevelopment plan, an expansive two-level 1,800-seat Convention Centre housing four lecture theatres was built to replace The Octagon.', 'Campus', 'Rapid Growth', 19);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2003, 'Office for Innovation & Enterprise', 'The Office for Innovation and Enterprise (IE) was formed to offer industry partners consultancy services and showcase technological expertise. It launched the EnterpriZe! Scheme to help enterprising students commercialise their products and business ideas.', 'Innovation', 'Rapid Growth', 20);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2004, 'China Immersion Programme', 'The Polytechnic collaborated with Zhejiang University City College to provide Diploma in Chinese Studies students with the chance to go on a China immersion programme. The School of Engineering also launched the Common First Year Pathway Programme.', 'International', 'Rapid Growth', 21);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2005, 'Marine & Offshore Technology Centre', 'NP and SPRING Singapore jointly established the Marine & Offshore Technology Centre of Innovation (MOT COI) to catalyse the growth of the marine industry by helping SMEs with technology innovation.', 'Innovation', 'Rapid Growth', 22);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2006, 'First Poly-FSI Degree Partnership', 'Under the Ministry of Education''s Polytechnic-Foreign Specialised Institute scheme, NP was the first to strike a degree tie-up with Boston''s Wheelock College to offer graduates a Bachelor of Science in Early Childhood Educational Studies and Leadership.', 'Academic', 'Rapid Growth', 23);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2007, 'Solar Technology Centre', 'NP launched a $1 million Solar Technology Centre, partly funded by the Economic Development Board, serving as a hotbed for applied research and student projects on solar technology.', 'Innovation', 'Rapid Growth', 24);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2008, 'Environmental & Water Tech Centre', 'A $7.6 million Environmental and Water Technology Centre of Innovation officially opened, helping SMEs develop commercially-viable products in water treatment, waste management, pollution control, and clean energy.', 'Innovation', 'Rapid Growth', 25);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2008, 'School of Science & Technology Partnership', 'NP was picked to play a key role in setting up the School of Science and Technology (SST), tapping the Polytechnic''s expertise in applied learning for curriculum, pedagogy and campus development.', 'Partnership', 'Rapid Growth', 26);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2009, 'Media CET Centre', 'NP signed an MOU with Singapore Media Academy and Workforce Development Agency to jointly set up Singapore''s first Media CET Centre to train media professionals as part of a $40 million government initiative.', 'Academic', 'Rapid Growth', 27);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2009, 'The Christieara Programme', 'NP''s talent development programme was revamped and renamed The Christieara Programme (TCP) to nurture high calibre students. A new feature was the California Challenge, a three-week study trip with a liberal arts focus.', 'Academic', 'Rapid Growth', 28);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2009, 'Phase 6 Campus Development Begins', 'The Teo Hang Sam Building and Canteen One were demolished to make way for the new block Seventy3, marking the onset of Phase 6 campus redevelopment.', 'Campus', 'Rapid Growth', 29);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2009, 'm:idea Launch', 'The School of Film & Media Studies officially launched m:idea, the first media conglomerate operated by an educational institution in Singapore, offering a full suite of media services.', 'Innovation', 'Rapid Growth', 30);

-- Insert 2010s milestones
INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2010, 'Dialogue in the Dark', 'The Polytechnic officially launched Dialogue in the Dark Singapore, a walking tour in complete darkness led by visually impaired guides. It was the first in the world to be set up in an educational institution.', 'Innovation', 'Future-Ready', 31);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2011, 'Optometry Centre', 'NP opened a $1.2-million Optometry Centre with state-of-the-art facilities for Diploma in Optometry students to gain clinical practice experience.', 'Campus', 'Future-Ready', 32);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2011, 'NTU Strategic Affiliation', 'NP embarked on a strategic affiliation with Nanyang Technological University to reshape the way engineering is taught at the diploma level.', 'Partnership', 'Future-Ready', 33);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2012, 'Seventy3 & Sports Complex Upgrade', 'NP students began enjoying first-rate facilities with the new building Seventy3 for arts and cultural activities. The Sports Complex underwent a facelift. The projects cost $57 million under Phase 6 campus development.', 'Campus', 'Future-Ready', 34);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2013, '50th Anniversary & 4th Strategic Plan', 'Prime Minister Lee Hsien Loong unveiled a blueprint setting out NP''s 10-year plan to better prepare students to thrive in the global workplace. The 4th Strategic Plan spanned from 2013 to 2022.', 'Milestone', 'Future-Ready', 35);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2015, 'Industry Mentors Network', 'In line with the national SkillsFuture movement, NP initiated the Industry Mentors'' Network (IMN) programme, connecting first-year students to industry professionals for career advice and networking.', 'Academic', 'Future-Ready', 36);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2016, 'Service-Learning Initiative', 'NP became the first polytechnic in Singapore to infuse Service-Learning as a signature pedagogy into its core curriculum across all diploma programmes, developing students with a big heart for the community.', 'Academic', 'Future-Ready', 37);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2017, 'Smart Learning Spaces', 'NP partnered with seven industry leaders (Autodesk, Microsoft, Quann, SAP, S3 Innovate, ThoughtWorks, V-Key) to build new smart learning spaces for InfoComm Technology students as part of the Smart Campus initiative.', 'Technology', 'Future-Ready', 38);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2017, 'Campus Ecosystem Programme', 'In line with Smart Nation initiatives, NP started Campus Ecosystem, a programme aiming to attract 100 start-ups focusing on Student Life, Teaching & Learning, Work Culture and Work Processes.', 'Innovation', 'Future-Ready', 39);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2018, 'Pollinate Incubator Launch', 'NP spearheaded the launch of "Pollinate", a new joint poly incubator at JTC Launchpad @ one-north to support entrepreneurship efforts by Polytechnic alumni, starting with 14 start-ups.', 'Innovation', 'Future-Ready', 40);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2018, 'GIA Innovators Academy Partner', 'Singapore''s Economic Development Board launched the Global Innovation Alliance (GIA) Innovators Academy. NP is the only polytechnic partner appointed alongside NTU, NUS and SMU.', 'Partnership', 'Future-Ready', 41);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2018, 'OpenCerts Blockchain Initiative', 'NP jointly developed OpenCerts, using blockchain technology for secure digital certificate verification, in partnership with SkillsFuture Singapore, GovTech and MOE. First blockchain technology harnessed at national level.', 'Technology', 'Future-Ready', 42);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2019, 'EVA - AI Virtual Assistant', 'NP piloted an AI-powered platform for Early Admissions Exercise. EVA, the first virtual assistant, was deployed to enhance the EAE selection process and improve administrative efficiency.', 'Technology', 'Future-Ready', 43);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2019, 'AGILE Campus Incubator', 'NP and UOB jointly launched AGILE (Accelerating Growth in Innovation, Learning and Entrepreneurship), a campus incubator to nurture start-ups and drive student entrepreneurship.', 'Innovation', 'Future-Ready', 44);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2019, 'Prudential AI Training Partnership', 'NP partnered Prudential to train its 1,200 employees to equip them with skills to better leverage data using Artificial Intelligence.', 'Partnership', 'Future-Ready', 45);

-- Insert 2020s milestones
INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2020, 'Career Jumpstart Package', 'In light of the COVID-19 pandemic, NP announced Career Jumpstart, a graduation support package providing close to 400 job employment and learning opportunities for the graduating Class of 2020.', 'Student Support', 'Future-Ready', 46);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2020, 'Virtual Graduation Ceremonies', 'As in-person graduation ceremonies were cancelled due to COVID-19 restrictions, NP initiated virtual festivities to commemorate the special occasion for the Class of 2020.', 'Innovation', 'Future-Ready', 47);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2020, 'Robotics Research & Innovation Centre', 'The NP Robotics Research & Innovation Centre (RRIC) was launched to co-create customised robotics solutions with industry partners. NP also inked an MOU with SingHealth Polyclinics to develop HIRO, a disinfection robot.', 'Innovation', 'Future-Ready', 48);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2020, 'Personalised Learning Pathway', 'NP was the first polytechnic in Singapore to pilot a Personalised Learning Pathway (PLP) programme, giving all full-time diploma students the chance to graduate with a minor certificate in addition to their diploma.', 'Academic', 'Future-Ready', 49);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2021, 'Johnson & Johnson Experience Centre', 'The first-ever omni-channel Johnson & Johnson Experience Centre equipped with retail technologies was launched on the NP campus, serving as an integrated lifestyle store and training facility.', 'Partnership', 'Future-Ready', 50);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2021, 'Human-Centred Design Institute', 'NP''s CET Academy launched Singapore''s first-ever Human-Centred Design Institute (HCDI) in partnership with global training institute LUMA and with support of SkillsFuture Singapore.', 'Academic', 'Future-Ready', 51);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2022, 'NP x Carousell Sustainability Lab', 'NP launched the NP x Carousell Sustainability Lab to commemorate 20 years of innovation and entrepreneurship. The new incubator space was established in collaboration with recommerce group Carousell.', 'Innovation', 'Future-Ready', 52);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2023, '60th Anniversary & NP2030', 'As part of NP''s 60th anniversary, the polytechnic announced its 5th Strategic Plan, or NP2030, which shares the polytechnic''s vision and outlines its priorities and strategies for a shared and sustainable future.', 'Milestone', 'Future-Ready', 53);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2023, 'Autonomous Shuttle Service', 'NP became the first institute of higher learning with an autonomous shuttle service serving its campus with the launch of the MooBus through a partnership with MooVita Pte Ltd.', 'Technology', 'Future-Ready', 54);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2023, 'Industry-in-Curriculum Framework', 'With increasing technological adoption across industries, NP announced the launch of its new Industry-in-Curriculum (IiC) framework at its inaugural Industry Partners Appreciation Day, further aligning students'' learning with latest industry developments.', 'Academic', 'Future-Ready', 55);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2024, 'M:idea Playground Launch', 'NP unveiled the M:idea Playground, an immersive on-campus space. The event marked NP''s initiative in pioneering virtual production training, one of the most sought-after skills in content creation.', 'Innovation', 'Future-Ready', 56);

INSERT INTO milestones (year, title, description, category, era_name, display_order) VALUES
(2024, 'Green Technology Infrastructure', 'NP and Yinson GreenTech jointly unveiled green technology infrastructure on campus, comprising synergy.lab (IoT-enabled smart energy management centre), a solar farm and electric vehicle charging facilities powered by renewable energy.', 'Sustainability', 'Future-Ready', 57);

COMMIT;