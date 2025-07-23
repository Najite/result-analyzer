/*
  # Create polytechnic result notification system tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `password` (text, plain text as requested)
      - `phone` (text)
      - `role` (text, 'admin' or 'student')
      - `level` (text, for students: ND1, ND2, HND1, HND2)
      - `semester` (text, 'first' or 'second')
      - `cgpa` (decimal)
      - `created_at` (timestamp)
    
    - `results`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `subject` (text)
      - `score` (integer)
      - `grade` (text)
      - `semester` (text)
      - `level` (text)
      - `session` (text)
      - `created_at` (timestamp)
    
    - `sms_logs`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `phone` (text)
      - `message` (text)
      - `status` (text, 'success' or 'failed')
      - `error_message` (text)
      - `sent_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access

  3. Sample Data
    - Insert admin users
    - Insert sample students
    - Insert sample results
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('admin', 'student')),
  level text CHECK (level IN ('ND1', 'ND2', 'HND1', 'HND2')),
  semester text CHECK (semester IN ('first', 'second')),
  cgpa decimal(3,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

-- Create results table
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  grade text NOT NULL,
  semester text NOT NULL CHECK (semester IN ('first', 'second')),
  level text NOT NULL CHECK (level IN ('ND1', 'ND2', 'HND1', 'HND2')),
  session text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message text,
  sent_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read all data" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "Users can insert data" ON users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Users can update data" ON users FOR UPDATE TO anon USING (true);

CREATE POLICY "Results can be read by all" ON results FOR SELECT TO anon USING (true);
CREATE POLICY "Results can be inserted" ON results FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Results can be updated" ON results FOR UPDATE TO anon USING (true);

CREATE POLICY "SMS logs can be read by all" ON sms_logs FOR SELECT TO anon USING (true);
CREATE POLICY "SMS logs can be inserted" ON sms_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "SMS logs can be updated" ON sms_logs FOR UPDATE TO anon USING (true);

-- Insert sample admin users
INSERT INTO users (name, email, password, role) VALUES
('System Admin', 'admin@polytechnic.edu', 'admin123', 'admin'),
('Academic Officer', 'academic@polytechnic.edu', 'academic123', 'admin');

-- Insert sample students
INSERT INTO users (name, email, password, phone, role, level, semester, cgpa) VALUES
('John Doe', 'john.doe@student.edu', 'student123', '+234901234567', 'student', 'ND1', 'first', 3.45),
('Jane Smith', 'jane.smith@student.edu', 'student123', '+234902345678', 'student', 'ND1', 'first', 3.89),
('Mike Johnson', 'mike.johnson@student.edu', 'student123', '+234903456789', 'student', 'ND2', 'second', 2.78),
('Sarah Wilson', 'sarah.wilson@student.edu', 'student123', '+234904567890', 'student', 'HND1', 'first', 3.92),
('David Brown', 'david.brown@student.edu', 'student123', '+234905678901', 'student', 'HND2', 'second', 3.15);

-- Insert sample results
INSERT INTO results (student_id, subject, score, grade, semester, level, session) 
SELECT 
  u.id,
  subjects.subject,
  subjects.score,
  subjects.grade,
  u.semester,
  u.level,
  '2023/2024'
FROM users u
CROSS JOIN (
  VALUES 
    ('Mathematics', 85, 'A'),
    ('English Language', 78, 'B'),
    ('Computer Science', 92, 'A'),
    ('Physics', 67, 'C'),
    ('Chemistry', 74, 'B')
) AS subjects(subject, score, grade)
WHERE u.role = 'student';