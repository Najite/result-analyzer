import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Result } from '../lib/supabase';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Calendar,
  Star,
  Brain,
  Lightbulb,
  Users,
  Clock
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGPA = () => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return (totalScore / results.length / 25).toFixed(2);
  };

  const calculateAverageScore = () => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return (totalScore / results.length).toFixed(1);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceAdvice = () => {
    const gpa = parseFloat(calculateGPA());
    const averageScore = parseFloat(calculateAverageScore());

    if (gpa >= 3.5) {
      return {
        type: 'excellent',
        icon: <Award className="h-6 w-6 text-green-500" />,
        title: 'Outstanding Performance! 🌟',
        message: 'Exceptional work! You\'re in the top tier of students. Consider mentoring peers and taking on leadership roles.',
        tips: [
          'Maintain your excellent study habits',
          'Consider advanced courses or certifications',
          'Share your knowledge by tutoring others',
          'Explore research opportunities'
        ],
        color: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
        textColor: 'text-green-800'
      };
    } else if (gpa >= 3.0) {
      return {
        type: 'good',
        icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
        title: 'Great Performance! 👍',
        message: 'You\'re doing very well! Focus on consistency and aim to improve in subjects where you scored below 75%.',
        tips: [
          'Review subjects with lower scores',
          'Join study groups for challenging topics',
          'Set specific improvement goals',
          'Seek feedback from instructors'
        ],
        color: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200',
        textColor: 'text-blue-800'
      };
    } else if (gpa >= 2.5) {
      return {
        type: 'satisfactory',
        icon: <Target className="h-6 w-6 text-yellow-500" />,
        title: 'Good Progress 📈',
        message: 'You\'re on the right track! There\'s room for improvement. Focus on developing better study strategies.',
        tips: [
          'Create a structured study schedule',
          'Identify and work on weak subjects',
          'Use active learning techniques',
          'Consider getting a study partner'
        ],
        color: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200',
        textColor: 'text-yellow-800'
      };
    } else {
      return {
        type: 'needs-improvement',
        icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
        title: 'Let\'s Improve Together 💪',
        message: 'Don\'t worry! Every expert was once a beginner. Let\'s work on strategies to boost your performance.',
        tips: [
          'Meet with your academic advisor immediately',
          'Join remedial classes if available',
          'Form study groups with classmates',
          'Break down complex topics into smaller parts',
          'Use visual aids and practice tests'
        ],
        color: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
        textColor: 'text-red-800'
      };
    }
  };

  const getSubjectAnalysis = () => {
    const subjectPerformance = results.reduce((acc, result) => {
      if (!acc[result.subject]) {
        acc[result.subject] = { total: 0, count: 0, scores: [] };
      }
      acc[result.subject].total += result.score;
      acc[result.subject].count += 1;
      acc[result.subject].scores.push(result.score);
      return acc;
    }, {} as Record<string, { total: number; count: number; scores: number[] }>);

    return Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: (data.total / data.count).toFixed(1),
      trend: data.scores.length > 1 ? 
        (data.scores[data.scores.length - 1] > data.scores[0] ? 'improving' : 
         data.scores[data.scores.length - 1] < data.scores[0] ? 'declining' : 'stable') : 'stable'
    })).sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
  };

  const performanceAdvice = getPerformanceAdvice();
  const subjectAnalysis = getSubjectAnalysis();
  const gpa = parseFloat(calculateGPA());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl text-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
            <p className="text-blue-100 text-lg">
              {user?.level} - {user?.semester?.charAt(0).toUpperCase() + user?.semester?.slice(1)} Semester
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-200" />
                <span className="text-blue-100">Academic Session 2023/2024</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Star className="h-12 w-12 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subjects</p>
              <p className="text-3xl font-bold text-gray-900">{results.length}</p>
              <p className="text-xs text-gray-500 mt-1">Courses enrolled</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{calculateAverageScore()}%</p>
              <p className="text-xs text-gray-500 mt-1">Overall performance</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CGPA</p>
              <p className="text-3xl font-bold text-gray-900">{calculateGPA()}</p>
              <p className="text-xs text-gray-500 mt-1">Out of 4.0</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Class Rank</p>
              <p className="text-3xl font-bold text-gray-900">
                {gpa >= 3.5 ? 'Top 10%' : gpa >= 3.0 ? 'Top 25%' : gpa >= 2.5 ? 'Top 50%' : 'Bottom 50%'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Estimated position</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Advisory */}
      <div className={`border-2 rounded-2xl p-8 ${performanceAdvice.color}`}>
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            {performanceAdvice.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-bold mb-3 ${performanceAdvice.textColor}`}>
              {performanceAdvice.title}
            </h3>
            <p className={`text-lg mb-4 ${performanceAdvice.textColor}`}>
              {performanceAdvice.message}
            </p>
            <div className="bg-white bg-opacity-50 rounded-xl p-4">
              <h4 className={`font-semibold mb-3 flex items-center ${performanceAdvice.textColor}`}>
                <Lightbulb className="h-5 w-5 mr-2" />
                Personalized Tips for You:
              </h4>
              <ul className="space-y-2">
                {performanceAdvice.tips.map((tip, index) => (
                  <li key={index} className={`flex items-start space-x-2 ${performanceAdvice.textColor}`}>
                    <span className="text-sm font-medium">•</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Analysis */}
      {subjectAnalysis.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Subject Performance Analysis</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectAnalysis.map((subject, index) => (
                <div key={subject.subject} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{subject.subject}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      subject.trend === 'improving' ? 'bg-green-100 text-green-700' :
                      subject.trend === 'declining' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {subject.trend}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{subject.average}%</span>
                    <div className={`p-2 rounded-lg ${
                      parseFloat(subject.average) >= 80 ? 'bg-green-100' :
                      parseFloat(subject.average) >= 70 ? 'bg-blue-100' :
                      parseFloat(subject.average) >= 60 ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                      <BarChart3 className={`h-4 w-4 ${
                        parseFloat(subject.average) >= 80 ? 'text-green-600' :
                        parseFloat(subject.average) >= 70 ? 'text-blue-600' :
                        parseFloat(subject.average) >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Your Academic Results</h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last updated: {results.length > 0 ? new Date(results[0].created_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {results.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
            <p className="text-gray-500">Your academic results will appear here once they are published.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={result.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{result.score}%</span>
                        <div className={`w-16 h-2 rounded-full ${
                          result.score >= 80 ? 'bg-green-200' :
                          result.score >= 70 ? 'bg-blue-200' :
                          result.score >= 60 ? 'bg-yellow-200' :
                          'bg-red-200'
                        }`}>
                          <div 
                            className={`h-2 rounded-full ${
                              result.score >= 80 ? 'bg-green-500' :
                              result.score >= 70 ? 'bg-blue-500' :
                              result.score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${result.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {result.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.session}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;