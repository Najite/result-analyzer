/*
  # Add Sample Results Data

  1. Sample Results
    - Add comprehensive result data for students
    - Include various subjects and performance levels
    - Cover different semesters and levels
  
  2. Update Student CGPAs
    - Calculate and update CGPA based on results
    - Ensure realistic performance distribution
*/

-- Add sample results for John Doe (ND1 student)
INSERT INTO results (student_id, subject, score, grade, semester, level, session) VALUES
  ((SELECT id FROM users WHERE email = 'john.doe@student.edu'), 'Mathematics', 85, 'A', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'john.doe@student.edu'), 'English Language', 78, 'B', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'john.doe@student.edu'), 'Computer Science', 92, 'A', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'john.doe@student.edu'), 'Physics', 74, 'B', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'john.doe@student.edu'), 'Chemistry', 68, 'C', 'first', 'ND1', '2023/2024');

-- Add sample results for Jane Smith (ND2 student)
INSERT INTO results (student_id, subject, score, grade, semester, level, session) VALUES
  ((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), 'Advanced Mathematics', 88, 'A', 'first', 'ND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), 'Technical Writing', 82, 'A', 'first', 'ND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), 'Database Management', 90, 'A', 'first', 'ND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), 'Web Development', 86, 'A', 'first', 'ND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), 'Data Structures', 79, 'B', 'first', 'ND2', '2023/2024');

-- Add sample results for Mike Johnson (HND1 student)
INSERT INTO results (student_id, subject, score, grade, semester, level, session) VALUES
  ((SELECT id FROM users WHERE email = 'mike.johnson@student.edu'), 'Engineering Mathematics', 65, 'C', 'first', 'HND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'mike.johnson@student.edu'), 'Professional Communication', 70, 'B', 'first', 'HND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'mike.johnson@student.edu'), 'Software Engineering', 72, 'B', 'first', 'HND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'mike.johnson@student.edu'), 'System Analysis', 58, 'D', 'first', 'HND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'mike.johnson@student.edu'), 'Project Management', 75, 'B', 'first', 'HND1', '2023/2024');

-- Add sample results for Sarah Wilson (HND2 student)
INSERT INTO results (student_id, subject, score, grade, semester, level, session) VALUES
  ((SELECT id FROM users WHERE email = 'sarah.wilson@student.edu'), 'Advanced Software Engineering', 94, 'A', 'first', 'HND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'sarah.wilson@student.edu'), 'Research Methodology', 89, 'A', 'first', 'HND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'sarah.wilson@student.edu'), 'Artificial Intelligence', 91, 'A', 'first', 'HND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'sarah.wilson@student.edu'), 'Mobile App Development', 87, 'A', 'first', 'HND2', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'sarah.wilson@student.edu'), 'Cybersecurity', 85, 'A', 'first', 'HND2', '2023/2024');

-- Add sample results for David Brown (ND1 student)
INSERT INTO results (student_id, subject, score, grade, semester, level, session) VALUES
  ((SELECT id FROM users WHERE email = 'david.brown@student.edu'), 'Mathematics', 45, 'F', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'david.brown@student.edu'), 'English Language', 52, 'D', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'david.brown@student.edu'), 'Computer Science', 48, 'F', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'david.brown@student.edu'), 'Physics', 55, 'D', 'first', 'ND1', '2023/2024'),
  ((SELECT id FROM users WHERE email = 'david.brown@student.edu'), 'Chemistry', 42, 'F', 'first', 'ND1', '2023/2024');

-- Update CGPAs based on calculated averages
UPDATE users SET cgpa = 3.54 WHERE email = 'john.doe@student.edu';
UPDATE users SET cgpa = 3.70 WHERE email = 'jane.smith@student.edu';
UPDATE users SET cgpa = 2.80 WHERE email = 'mike.johnson@student.edu';
UPDATE users SET cgpa = 3.86 WHERE email = 'sarah.wilson@student.edu';
UPDATE users SET cgpa = 1.94 WHERE email = 'david.brown@student.edu';