import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'admin' | 'student';
  level?: 'ND1' | 'ND2' | 'HND1' | 'HND2';
  semester?: 'first' | 'second';
  cgpa?: number;
  created_at: string;
}

export interface Result {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  grade: string;
  semester: string;
  level: string;
  session: string;
  created_at: string;
}

export interface SMSLog {
  id: string;
  student_id: string;
  phone: string;
  message: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  sent_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  level: 'ND1' | 'ND2' | 'HND1' | 'HND2';
  semester: 'first' | 'second';
  created_at: string;
}

export interface StudentCourse {
  id: string;
  student_id: string;
  course_id: string;
  session: string;
  created_at: string;
  course?: Course;
}