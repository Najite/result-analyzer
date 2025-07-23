import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { smsService } from '../lib/sms';
import type { User, Result, SMSLog, Course, StudentCourse } from '../lib/supabase';
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Send, 
  RefreshCw, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  Plus,
  Edit3
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'sms' | 'add-student' | 'add-result' | 'analytics'>('overview');
  const [smsFilter, setSmsFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    level: 'ND1' as const,
    semester: 'first' as const
  });
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentCoursesForResult, setStudentCoursesForResult] = useState<(StudentCourse & { course: Course })[]>([]);
  const [courseScores, setCourseScores] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsResponse, smsLogsResponse, resultsResponse, coursesResponse, studentCoursesResponse] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'student'),
        supabase.from('sms_logs').select('*').order('sent_at', { ascending: false }),
        supabase.from('results').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('student_courses').select(`
          *,
          course:courses(*)
        `)
      ]);

      if (studentsResponse.data) setStudents(studentsResponse.data);
      if (smsLogsResponse.data) setSmsLogs(smsLogsResponse.data);
      if (resultsResponse.data) setResults(resultsResponse.data);
      if (coursesResponse.data) setCourses(coursesResponse.data);
      if (studentCoursesResponse.data) setStudentCourses(studentCoursesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    const student = students.find(s => s.id === studentId);
    if (student) {
      const assignedCourses = studentCourses.filter(sc => 
        sc.student_id === studentId && 
        sc.course?.level === student.level && 
        sc.course?.semester === student.semester
      ) as (StudentCourse & { course: Course })[];
      setStudentCoursesForResult(assignedCourses);
      
      // Initialize scores object
      const initialScores: Record<string, string> = {};
      assignedCourses.forEach(sc => {
        const existingResult = results.find(r => 
          r.student_id === studentId && 
          r.subject === sc.course.name
        );
        initialScores[sc.course_id] = existingResult ? existingResult.score.toString() : '';
      });
      setCourseScores(initialScores);
    }
  };
  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: newStudentData, error } = await supabase
        .from('users')
        .insert([{ ...newStudent, role: 'student', cgpa: 0.00 }])
        .select()
        .single();

      if (!error && newStudentData) {
        // Assign courses to the new student based on their level and semester
        const relevantCourses = courses.filter(c => 
          c.level === newStudent.level && 
          c.semester === newStudent.semester
        );
        
        const courseAssignments = relevantCourses.map(course => ({
          student_id: newStudentData.id,
          course_id: course.id,
          session: '2023/2024'
        }));
        
        if (courseAssignments.length > 0) {
          await supabase.from('student_courses').insert(courseAssignments);
        }
        
        setNewStudent({
          name: '',
          email: '',
          password: '',
          phone: '',
          level: 'ND1',
          semester: 'first'
        });
        await fetchData();
        alert('Student added successfully!');
      } else {
        alert('Error adding student: ' + error.message);
      }
    } catch (error) {
      alert('Error adding student');
    }

    setIsLoading(false);
  };

  const addResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const student = students.find(s => s.id === selectedStudent);
      if (!student) return;

      const resultsToAdd = [];
      
      for (const [courseId, scoreStr] of Object.entries(courseScores)) {
        if (scoreStr.trim() === '') continue;
        
        const score = parseInt(scoreStr);
        if (isNaN(score) || score < 0 || score > 100) continue;
        
        let grade = 'F';
        if (score >= 80) grade = 'A';
        else if (score >= 70) grade = 'B';
        else if (score >= 60) grade = 'C';
        else if (score >= 50) grade = 'D';
        
        const course = courses.find(c => c.id === courseId);
        if (!course) continue;
        
        // Check if result already exists
        const existingResult = results.find(r => 
          r.student_id === selectedStudent && 
          r.subject === course.name
        );
        
        if (existingResult) {
          // Update existing result
          await supabase
            .from('results')
            .update({ score, grade })
            .eq('id', existingResult.id);
        } else {
          // Add new result
          resultsToAdd.push({
            student_id: selectedStudent,
            subject: course.name,
            score,
            grade,
            level: student.level,
            semester: student.semester,
            session: '2023/2024'
          });
        }
      }
      
      if (resultsToAdd.length > 0) {
        const { error } = await supabase.from('results').insert(resultsToAdd);
        if (error) throw error;
      }
      
      // Update student CGPA
      const updatedResults = await supabase
        .from('results')
        .select('*')
        .eq('student_id', selectedStudent);
        
      if (updatedResults.data && updatedResults.data.length > 0) {
        const totalScore = updatedResults.data.reduce((sum, r) => sum + r.score, 0);
        const newCGPA = (totalScore / updatedResults.data.length / 25).toFixed(2);
        
        await supabase
          .from('users')
          .update({ cgpa: parseFloat(newCGPA) })
          .eq('id', selectedStudent);
      }
      
      setSelectedStudent('');
      setStudentCoursesForResult([]);
      setCourseScores({});
      await fetchData();
      alert('Results updated successfully!');
    } catch (error) {
      alert('Error updating results: ' + error);
    }

    setIsLoading(false);
  };

  const sendResultNotifications = async (studentIds?: string[]) => {
    setIsLoading(true);
    const targetStudents = studentIds ? 
      students.filter(s => studentIds.includes(s.id)) : 
      students;

    for (const student of targetStudents) {
      const studentResults = results.filter(r => r.student_id === student.id);
      if (studentResults.length === 0) continue;

      const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0);
      const averageScore = totalScore / studentResults.length;
      
      const message = `Dear ${student.name}, your results are ready. Average: ${averageScore.toFixed(1)}%. CGPA: ${student.cgpa}. Check your portal for details.`;

      const smsResult = await smsService.sendSMS(student.phone || '', message);
      
      await supabase.from('sms_logs').insert([{
        student_id: student.id,
        phone: student.phone || '',
        message,
        status: smsResult.success ? 'success' : 'failed',
        error_message: smsResult.error
      }]);
    }

    await fetchData();
    setIsLoading(false);
    alert('Notifications sent!');
  };

  const resendFailedSMS = async () => {
    const failedLogs = smsLogs.filter(log => log.status === 'failed');
    const studentIds = [...new Set(failedLogs.map(log => log.student_id))];
    await sendResultNotifications(studentIds);
  };

  const filteredSmsLogs = smsLogs.filter(log => 
    smsFilter === 'all' || log.status === smsFilter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const calculateCGPA = (studentId: string) => {
    const studentResults = results.filter(r => r.student_id === studentId);
    if (studentResults.length === 0) return 0;
    
    const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0);
    return (totalScore / studentResults.length / 25).toFixed(2);
  };

  // Analytics calculations
  const getAnalytics = () => {
    const totalStudents = students.length;
    const studentsWithResults = students.filter(s => 
      results.some(r => r.student_id === s.id)
    ).length;
    
    const averageCGPA = students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / totalStudents;
    
    const gradeDistribution = results.reduce((acc, result) => {
      acc[result.grade] = (acc[result.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const levelDistribution = students.reduce((acc, student) => {
      acc[student.level || 'Unknown'] = (acc[student.level || 'Unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const performanceCategories = students.reduce((acc, student) => {
      const cgpa = student.cgpa || 0;
      if (cgpa >= 3.5) acc.excellent++;
      else if (cgpa >= 3.0) acc.good++;
      else if (cgpa >= 2.5) acc.satisfactory++;
      else acc.needsImprovement++;
      return acc;
    }, { excellent: 0, good: 0, satisfactory: 0, needsImprovement: 0 });

    return {
      totalStudents,
      studentsWithResults,
      averageCGPA: averageCGPA.toFixed(2),
      gradeDistribution,
      levelDistribution,
      performanceCategories,
      totalResults: results.length,
      successfulSMS: smsLogs.filter(log => log.status === 'success').length,
      failedSMS: smsLogs.filter(log => log.status === 'failed').length
    };
  };

  const analytics = getAnalytics();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-blue-100">Polytechnic Student Management System</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'add-result', label: 'Add Result', icon: BookOpen },
              { id: 'sms', label: 'SMS Logs', icon: MessageSquare },
              { id: 'add-student', label: 'Add Student', icon: UserPlus }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Students</p>
                      <p className="text-3xl font-bold">{analytics.totalStudents}</p>
                    </div>
                    <Users className="h-12 w-12 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Average CGPA</p>
                      <p className="text-3xl font-bold">{analytics.averageCGPA}</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Results</p>
                      <p className="text-3xl font-bold">{analytics.totalResults}</p>
                    </div>
                    <BookOpen className="h-12 w-12 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">SMS Sent</p>
                      <p className="text-3xl font-bold">{analytics.successfulSMS + analytics.failedSMS}</p>
                    </div>
                    <MessageSquare className="h-12 w-12 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => sendResultNotifications()}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                    <span>Send All Notifications</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('add-student')}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Add New Student</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('add-result')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Result</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
              
              {/* Performance Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Award className="h-6 w-6 text-green-600" />
                        <span className="font-medium">Excellent (3.5+ CGPA)</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{analytics.performanceCategories.excellent}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                        <span className="font-medium">Good (3.0-3.4 CGPA)</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{analytics.performanceCategories.good}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Target className="h-6 w-6 text-yellow-600" />
                        <span className="font-medium">Satisfactory (2.5-2.9 CGPA)</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-600">{analytics.performanceCategories.satisfactory}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <span className="font-medium">Needs Improvement (&lt;2.5 CGPA)</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">{analytics.performanceCategories.needsImprovement}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          grade === 'A' ? 'bg-green-100 text-green-800' :
                          grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          grade === 'D' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Grade {grade}
                        </span>
                        <span className="text-lg font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Level Distribution */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Student Distribution by Level</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.levelDistribution).map(([level, count]) => (
                    <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">{level}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SMS Analytics */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">SMS Notification Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analytics.successfulSMS}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analytics.failedSMS}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.successfulSMS + analytics.failedSMS > 0 
                        ? Math.round((analytics.successfulSMS / (analytics.successfulSMS + analytics.failedSMS)) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-blue-700">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Students ({students.length})</h2>
                <div className="space-x-2">
                  <button
                    onClick={() => sendResultNotifications()}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isLoading ? 'Sending...' : 'Send All Notifications'}</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.level} - {student.semester}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (student.cgpa || 0) >= 3.5 ? 'bg-green-100 text-green-800' :
                              (student.cgpa || 0) >= 3.0 ? 'bg-blue-100 text-blue-800' :
                              (student.cgpa || 0) >= 2.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {calculateCGPA(student.id)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => sendResultNotifications([student.id])}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Send SMS
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Result Tab */}
          {activeTab === 'add-result' && (
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add/Update Student Results</h2>
              
              {!selectedStudent ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                  <select
                    required
                    value={selectedStudent}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.level} {student.semester} Semester
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Student: {students.find(s => s.id === selectedStudent)?.name}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Level: {students.find(s => s.id === selectedStudent)?.level} - 
                      {students.find(s => s.id === selectedStudent)?.semester?.charAt(0).toUpperCase() + 
                       students.find(s => s.id === selectedStudent)?.semester?.slice(1)} Semester
                    </p>
                    <button
                      onClick={() => {
                        setSelectedStudent('');
                        setStudentCoursesForResult([]);
                        setCourseScores({});
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Change Student
                    </button>
                  </div>

                  <form onSubmit={addResults} className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Assigned Courses ({studentCoursesForResult.length})
                    </h4>
                    
                    {studentCoursesForResult.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No courses assigned to this student</p>
                        <p className="text-gray-500 text-sm">Please assign courses first</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentCoursesForResult.map((studentCourse) => (
                          <div key={studentCourse.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-gray-900">{studentCourse.course.name}</h5>
                                <p className="text-sm text-gray-500">{studentCourse.course.code}</p>
                              </div>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {studentCourse.course.level}
                              </span>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Score (0-100)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={courseScores[studentCourse.course_id] || ''}
                                onChange={(e) => setCourseScores({
                                  ...courseScores,
                                  [studentCourse.course_id]: e.target.value
                                })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter score"
                              />
                              {courseScores[studentCourse.course_id] && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Grade: {
                                    parseInt(courseScores[studentCourse.course_id]) >= 80 ? 'A' :
                                    parseInt(courseScores[studentCourse.course_id]) >= 70 ? 'B' :
                                    parseInt(courseScores[studentCourse.course_id]) >= 60 ? 'C' :
                                    parseInt(courseScores[studentCourse.course_id]) >= 50 ? 'D' : 'F'
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {studentCoursesForResult.length > 0 && (
                      <div className="flex space-x-4 pt-4">
                        <button
                          type="submit"
                          disabled={isLoading || Object.values(courseScores).every(score => score.trim() === '')}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? 'Updating...' : 'Update Results'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const emptyScores: Record<string, string> = {};
                            studentCoursesForResult.forEach(sc => {
                              emptyScores[sc.course_id] = '';
                            });
                            setCourseScores(emptyScores);
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}

          {/* SMS Logs Tab */}
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">SMS Logs</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={smsFilter}
                    onChange={(e) => setSmsFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All SMS</option>
                    <option value="success">Successful</option>
                    <option value="failed">Failed</option>
                  </select>
                  <button
                    onClick={resendFailedSMS}
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Resend Failed</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSmsLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.phone}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.message}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(log.status)}
                              <span className="capitalize">{log.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.sent_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Student Tab */}
          {activeTab === 'add-student' && (
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Student</h2>
              <form onSubmit={addStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="text"
                    required
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+234901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={newStudent.level}
                    onChange={(e) => setNewStudent({...newStudent, level: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ND1">ND1</option>
                    <option value="ND2">ND2</option>
                    <option value="HND1">HND1</option>
                    <option value="HND2">HND2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    value={newStudent.semester}
                    onChange={(e) => setNewStudent({...newStudent, semester: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="first">First Semester</option>
                    <option value="second">Second Semester</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Adding...' : 'Add Student'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;