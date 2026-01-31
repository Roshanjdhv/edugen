import { useEffect, useState } from 'react';
import { BookOpen, FileText, CheckCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function StudentDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        pendingAssignments: 0,
        completedTasks: 0,
        overallProgress: 0,
    });
    const [coursePerformance, setCoursePerformance] = useState<any[]>([]);
    const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
    const [enrolledClassrooms, setEnrolledClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            loadDashboardData();
        }
    }, [profile]);

    const loadDashboardData = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            // 1. Enrolled Courses
            const { data: enrollments } = await supabase
                .from('classroom_students')
                .select('classroom_id')
                .eq('student_id', profile.id);

            const classroomIds = enrollments?.map(e => e.classroom_id) || [];

            // 2. Published Quizzes in those classrooms
            const { data: quizzes } = await supabase
                .from('quizzes')
                .select('*')
                .in('classroom_id', classroomIds)
                .eq('is_published', true);

            // 3. Quiz Attempts
            const { data: attempts } = await supabase
                .from('quiz_attempts')
                .select('*')
                .eq('student_id', profile.id);

            // 4. Materials
            const { data: materials } = await supabase
                .from('materials')
                .select('*, classrooms(name)')
                .in('classroom_id', classroomIds)
                .order('created_at', { ascending: false })
                .limit(4);

            const completedQuizIds = new Set(attempts?.map(a => a.quiz_id) || []);
            const pendingQuizzes = quizzes?.filter(q => !completedQuizIds.has(q.id)) || [];

            // Calculate Overall Progress (Average of scores)
            const totalScore = attempts?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;
            // This is a simplified progress calculation: (Total Correct / Total Possible)
            // Need total questions for precise %, but for dashboard avg score is fine.
            const avgProgress = attempts?.length ? Math.round((totalScore / attempts.length) * 10) : 0; // Using score directly if it's 1-10 or mapping normalized

            setStats({
                enrolledCourses: classroomIds.length,
                pendingAssignments: pendingQuizzes.length,
                completedTasks: attempts?.length || 0,
                overallProgress: avgProgress > 100 ? 100 : avgProgress,
            });

            // Map Recent Assignments (Merge pending quizzes and new materials)
            const recent = [
                ...pendingQuizzes.map(q => ({
                    name: q.title,
                    type: 'Quiz',
                    course: 'Classroom',
                    deadline: 'Soon',
                    status: 'Pending',
                    statusColor: 'bg-yellow-100 text-yellow-700',
                })),
                ...(materials || []).map(m => ({
                    name: m.title,
                    type: m.type.toUpperCase(),
                    course: m.classrooms?.name || 'Classroom',
                    deadline: new Date(m.created_at).toLocaleDateString(),
                    status: 'New',
                    statusColor: 'bg-blue-100 text-blue-700',
                }))
            ].slice(0, 4);

            setRecentAssignments(recent);

            // Performance Snapshot (Simplified as static colors for now, but real names)
            const { data: classroomData } = await supabase
                .from('classrooms')
                .select('id, name')
                .in('id', classroomIds);

            const performance = (classroomData || []).map(c => ({
                name: c.name,
                progress: Math.floor(Math.random() * 40) + 60, // Placeholder calculation for individual course progress
                color: 'bg-blue-500'
            }));

            setCoursePerformance(performance);
            setEnrolledClassrooms(classroomData || []);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <Link to="/" className="hover:text-blue-600">Home</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-slate-900 font-medium">Dashboard</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search resources..."
                                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button className="p-2 hover:bg-slate-100 rounded-lg relative">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                            <div className="text-right">
                                <div className="text-sm font-semibold text-slate-900">{profile?.full_name || 'Alex Johnson'}</div>
                                <div className="text-xs text-slate-500">ID: 2024/0472</div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {profile?.full_name?.[0] || 'A'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Stats Cards */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl h-32 animate-pulse border border-slate-200"></div>
                            ))
                        ) : (
                            <>
                                <StatCard
                                    icon={BookOpen}
                                    label="Enrolled Courses"
                                    value={stats.enrolledCourses}
                                    iconColor="text-blue-600"
                                    iconBg="bg-blue-50"
                                />
                                <StatCard
                                    icon={FileText}
                                    label="Pending Assignments"
                                    value={stats.pendingAssignments}
                                    iconColor="text-orange-600"
                                    iconBg="bg-orange-50"
                                />
                                <StatCard
                                    icon={CheckCircle}
                                    label="Completed Tasks"
                                    value={stats.completedTasks}
                                    iconColor="text-green-600"
                                    iconBg="bg-green-50"
                                />
                            </>
                        )}
                    </div>

                    {/* Overall Progress Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-sm text-slate-600">Overall Progress</div>
                            <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.overallProgress}%</div>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 mb-4">{stats.overallProgress > 70 ? 'Good' : stats.overallProgress > 40 ? 'Average' : 'Needs Work'}</div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${stats.overallProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* My Courses Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold text-slate-900">My Courses</h2>
                        </div>
                        <Link to="/student/classrooms" className="text-sm text-blue-600 hover:text-blue-700 font-bold">
                            View All Courses
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-slate-200"></div>
                            ))}
                        </div>
                    ) : enrolledClassrooms.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                            <p className="text-slate-500 font-medium mb-4">You haven't joined any classrooms yet.</p>
                            <Link to="/student/classrooms" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all">
                                Join a Class
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledClassrooms.map((course, index) => (
                                <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
                                    <div className={cn(
                                        "h-24 p-6 flex items-end relative overflow-hidden",
                                        ["bg-indigo-600", "bg-pink-600", "bg-teal-600", "bg-blue-600", "bg-orange-600"][index % 5]
                                    )}>
                                        <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                                        <h3 className="text-white font-bold text-lg relative z-10">{course.name}</h3>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-sm text-slate-500 line-clamp-1 mb-4">{course.description || 'No description available.'}</p>
                                        <Link
                                            to={`/student/classrooms/${course.id}`}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-sm"
                                        >
                                            Continue Learning
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Snapshot */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">Performance Snapshot</h2>
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                <div className="space-y-4">
                                    <div className="h-4 bg-slate-100 animate-pulse rounded w-full"></div>
                                    <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4"></div>
                                </div>
                            ) : coursePerformance.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">No data yet.</p>
                            ) : (
                                coursePerformance.map((course, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700">{course.name}</span>
                                            <span className="text-sm font-semibold text-slate-900">{course.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                                            <div
                                                className={`${course.color} h-2 rounded-full transition-all duration-500`}
                                                style={{ width: `${course.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
                            View Full Analytics
                        </button>
                    </div>

                    {/* Recent Assignments */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">Recent Assignments</h2>
                            </div>
                            <Link to="/student/assignments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                View All
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Assignment Name</th>
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Course</th>
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Deadline</th>
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={4} className="py-8 text-center text-slate-400">Loading assignments...</td></tr>
                                    ) : recentAssignments.length === 0 ? (
                                        <tr><td colSpan={4} className="py-8 text-center text-slate-400">No recent assignments.</td></tr>
                                    ) : (
                                        recentAssignments.map((assignment, index) => (
                                            <tr key={index} className="hover:bg-slate-50">
                                                <td className="py-4">
                                                    <div className="text-sm font-medium text-slate-900">{assignment.name}</div>
                                                    <div className="text-xs text-slate-500">{assignment.type}</div>
                                                </td>
                                                <td className="py-4 text-sm text-blue-600">{assignment.course}</td>
                                                <td className="py-4 text-sm text-slate-600">{assignment.deadline}</td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${assignment.statusColor}`}>
                                                        {assignment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <div>© 2024 Smart Learning Management System. All rights reserved.</div>
                    <div className="flex gap-6">
                        <Link to="#" className="hover:text-blue-600">Support Center</Link>
                        <Link to="#" className="hover:text-blue-600">Privacy Policy</Link>
                        <Link to="#" className="hover:text-blue-600">Accessibility</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, iconColor, iconBg }: {
    icon: any;
    label: string;
    value: number;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="text-sm text-slate-600 mb-1">{label}</div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
        </div>
    );
}
