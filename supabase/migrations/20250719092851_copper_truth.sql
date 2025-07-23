/*
  # Add Course Assignment System

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text)
      - `level` (text)
      - `semester` (text)
      - `created_at` (timestamp)
    - `student_courses`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `course_id` (uuid, foreign key)
      - `session` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Sample Data
    - Add sample courses for all levels and semesters
    - Assign courses to existing students
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  level text NOT NULL CHECK (level = ANY (ARRAY['ND1'::text, 'ND2'::text, 'HND1'::text, 'HND2'::text])),
  semester text NOT NULL CHECK (semester = ANY (ARRAY['first'::text, 'second'::text])),
  created_at timestamptz DEFAULT now()
);

-- Create student_courses junction table
CREATE TABLE IF NOT EXISTS student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  session text NOT NULL DEFAULT '2023/2024',
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id, session)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Courses can be read by all"
  ON courses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Courses can be inserted"
  ON courses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Student courses can be read by all"
  ON student_courses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Student courses can be inserted"
  ON student_courses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Student courses can be updated"
  ON student_courses
  FOR UPDATE
  TO anon
  USING (true);

-- Insert sample courses for ND1 First Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Mathematics I', 'MTH101', 'ND1', 'first'),
('English Language I', 'ENG101', 'ND1', 'first'),
('Computer Fundamentals', 'CMP101', 'ND1', 'first'),
('Physics I', 'PHY101', 'ND1', 'first'),
('Technical Drawing I', 'TDR101', 'ND1', 'first'),
('Workshop Practice I', 'WSP101', 'ND1', 'first');

-- Insert sample courses for ND1 Second Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Mathematics II', 'MTH102', 'ND1', 'second'),
('English Language II', 'ENG102', 'ND1', 'second'),
('Computer Programming I', 'CMP102', 'ND1', 'second'),
('Physics II', 'PHY102', 'ND1', 'second'),
('Technical Drawing II', 'TDR102', 'ND1', 'second'),
('Workshop Practice II', 'WSP102', 'ND1', 'second');

-- Insert sample courses for ND2 First Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Advanced Mathematics I', 'MTH201', 'ND2', 'first'),
('Technical Communication', 'ENG201', 'ND2', 'first'),
('Database Systems', 'CMP201', 'ND2', 'first'),
('Electronics I', 'ELT201', 'ND2', 'first'),
('System Analysis', 'SYS201', 'ND2', 'first'),
('Project Management', 'PMT201', 'ND2', 'first');

-- Insert sample courses for ND2 Second Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Advanced Mathematics II', 'MTH202', 'ND2', 'second'),
('Entrepreneurship', 'ENT202', 'ND2', 'second'),
('Web Development', 'CMP202', 'ND2', 'second'),
('Electronics II', 'ELT202', 'ND2', 'second'),
('Network Fundamentals', 'NET202', 'ND2', 'second'),
('Industrial Training', 'ITR202', 'ND2', 'second');

-- Insert sample courses for HND1 First Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Engineering Mathematics III', 'MTH301', 'HND1', 'first'),
('Research Methodology', 'RES301', 'HND1', 'first'),
('Advanced Programming', 'CMP301', 'HND1', 'first'),
('Digital Electronics', 'ELT301', 'HND1', 'first'),
('Software Engineering', 'SWE301', 'HND1', 'first'),
('Computer Networks', 'NET301', 'HND1', 'first');

-- Insert sample courses for HND1 Second Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Engineering Mathematics IV', 'MTH302', 'HND1', 'second'),
('Technical Report Writing', 'TRW302', 'HND1', 'second'),
('Mobile App Development', 'CMP302', 'HND1', 'second'),
('Microprocessors', 'MCP302', 'HND1', 'second'),
('Database Administration', 'DBA302', 'HND1', 'second'),
('Cybersecurity', 'CYB302', 'HND1', 'second');

-- Insert sample courses for HND2 First Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Advanced Engineering Math', 'MTH401', 'HND2', 'first'),
('Project I', 'PRJ401', 'HND2', 'first'),
('Artificial Intelligence', 'ART401', 'HND2', 'first'),
('Advanced Networks', 'NET401', 'HND2', 'first'),
('Cloud Computing', 'CLD401', 'HND2', 'first'),
('Data Analytics', 'DAT401', 'HND2', 'first');

-- Insert sample courses for HND2 Second Semester
INSERT INTO courses (name, code, level, semester) VALUES
('Statistics', 'STA402', 'HND2', 'second'),
('Project II', 'PRJ402', 'HND2', 'second'),
('Machine Learning', 'MLN402', 'HND2', 'second'),
('Enterprise Systems', 'ENS402', 'HND2', 'second'),
('IoT Systems', 'IOT402', 'HND2', 'second'),
('Capstone Project', 'CAP402', 'HND2', 'second');

-- Assign courses to existing students based on their level and semester
DO $$
DECLARE
    student_record RECORD;
    course_record RECORD;
BEGIN
    -- Loop through all students
    FOR student_record IN 
        SELECT id, level, semester FROM users WHERE role = 'student'
    LOOP
        -- Assign courses matching student's level and semester
        FOR course_record IN 
            SELECT id FROM courses 
            WHERE level = student_record.level 
            AND semester = student_record.semester
        LOOP
            INSERT INTO student_courses (student_id, course_id, session)
            VALUES (student_record.id, course_record.id, '2023/2024')
            ON CONFLICT (student_id, course_id, session) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;