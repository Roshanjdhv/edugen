import { useEffect, useState } from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Progress() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        gpa: '0.00',
        pending: 0,
        attendance: '98%',
        rank: '1/1'
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [recentGrades, setRecentGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            loadProgressData();
        }
    }, [profile]);

    const loadProgressData = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            // 1. Fetch Classrooms for Subjects
            const { data: enrollments } = await supabase
                .from('classroom_students')
                .select('classroom_id, classrooms(name)')
                .eq('student_id', profile.id);

            const classroomIds = enrollments?.map(e => e.classroom_id) || [];

            // 2. Fetch Quiz Attempts for GPA and Chart
            const { data: attempts } = await supabase
                .from('quiz_attempts')
                .select('*, quizzes(title, classroom_id)')
                .eq('student_id', profile.id)
                .order('completed_at', { ascending: true });

            // 3. Fetch Published Quizzes for Pending Count
            const { data: quizzes } = await supabase
                .from('quizzes')
                .select('id')
                .in('classroom_id', classroomIds)
                .eq('is_published', true);

            const attemptedQuizIds = new Set(attempts?.map(a => a.quiz_id) || []);
            const pendingCount = (quizzes?.filter(q => !attemptedQuizIds.has(q.id)) || []).length;

            // Calculate GPA (Simplified: Score/Total * 4.0 scale if score is out of question count, but we'll use avg % for now)
            // Assuming score is raw. Let's assume normalized 100 for display.
            const avgScore = attempts?.length
                ? attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / attempts.length
                : 0;
            const gpaValue = (avgScore * 0.4).toFixed(2); // Scale to 4.0 if score is out of 10

            setStats({
                gpa: gpaValue,
                pending: pendingCount,
                attendance: '98%', // Placeholder
                rank: '12/150' // Placeholder
            });

            // Chart Data (Latest 6 attempts)
            const cData = (attempts || []).slice(-6).map((a, i) => ({
                name: `Q${i + 1}`,
                yourGrade: (a.score || 0) * 10, // Normalized to 100
                classAvg: 75
            }));
            setChartData(cData);

            // Recent Grades
            const recent = (attempts || [])
                .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                .slice(0, 5)
                .map(a => {
                    const enrollment = enrollments?.find(e => e.classroom_id === a.quizzes?.classroom_id);
                    const classroomName = Array.isArray(enrollment?.classrooms)
                        ? (enrollment?.classrooms[0] as any)?.name
                        : (enrollment?.classrooms as any)?.name;

                    return {
                        assignment: a.quizzes?.title || 'Quiz',
                        subject: classroomName || 'Classroom',
                        grade: (a.score || 0) * 10,
                        classAvg: 78,
                        status: (a.score || 0) >= 8 ? 'EXCELLENT' : (a.score || 0) >= 6 ? 'GOOD' : 'BELOW AVG',
                        statusColor: (a.score || 0) >= 8 ? 'bg-green-100 text-green-700' : (a.score || 0) >= 6 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700',
                    };
                });
            setRecentGrades(recent);

            // Subject Progress (Avg score per classroom)
            const subjMap = new Map();
            attempts?.forEach(a => {
                const cId = a.quizzes?.classroom_id;
                if (!subjMap.has(cId)) subjMap.set(cId, []);
                subjMap.get(cId).push((a.score || 0) * 10);
            });

            const subjectsList = (enrollments || []).map(e => {
                const scores = subjMap.get(e.classroom_id) || [];
                const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
                const classroomName = Array.isArray(e.classrooms)
                    ? (e.classrooms[0] as any)?.name
                    : (e.classrooms as any)?.name;

                return {
                    name: classroomName || 'Classroom',
                    progress: avg,
                    color: 'bg-blue-500'
                };
            });
            setSubjects(subjectsList);

        } catch (error) {
            console.error('Error loading progress:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <Link to="/" className="hover:text-blue-600">Home</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-slate-900 font-medium">Progress</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Student Progress Analytics</h1>
                        <p className="text-sm text-slate-600 mt-1">Detailed breakdown of your academic performance for Semester 2</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search analytics..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                            <Calendar className="w-4 h-4" />
                            Last 6 Months
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-6 max-w-7xl mx-auto">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatsCard
                        label="Current GPA"
                        value={loading ? '...' : stats.gpa}
                        change="+0.2"
                        isPositive={true}
                    />
                    <StatsCard
                        label="Assignments Pending"
                        value={loading ? '...' : stats.pending.toString()}
                        change="From recently joined"
                        isPositive={false}
                    />
                    <StatsCard
                        label="Attendance Rate"
                        value={stats.attendance}
                        change="Consistent"
                        isPositive={true}
                    />
                    <StatsCard
                        label="Class Rank"
                        value={stats.rank}
                        change="Top 8%"
                        isPositive={true}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Subject Progress */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Subject Progress</h2>
                        <div className="space-y-5">
                            {loading ? (
                                <div className="py-8 text-center text-slate-400">Loading progress...</div>
                            ) : subjects.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">No subjects yet.</div>
                            ) : (
                                subjects.map((subject, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                                            <span className="text-sm font-semibold text-slate-900">{subject.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div
                                                className={`${subject.color} h-2 rounded-full transition-all duration-500`}
                                                style={{ width: `${subject.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="w-full mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm">
                            View Course Modules
                        </button>
                    </div>

                    {/* Marks per Assignment Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Marks per Assignment</h2>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-slate-600">Your Grade</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                    <span className="text-slate-600">Class Avg</span>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 100]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="yourGrade" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="classAvg" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coursework Completion */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Coursework Completion</h2>
                        <div className="flex items-center justify-center mb-6">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="#e2e8f0"
                                        strokeWidth="16"
                                        fill="none"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="#3b82f6"
                                        strokeWidth="16"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 80 * 0.75} ${2 * Math.PI * 80}`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-bold text-slate-900">75%</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Completed</div>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-center text-slate-600">
                            You are ahead of <span className="font-semibold text-slate-900">82%</span> of your classmates this semester!
                        </p>
                    </div>

                    {/* Recent Grades */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Recent Grades</h2>
                            <Link to="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                View All History
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Assignment</th>
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Subject</th>
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Grade</th>
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Class Avg</th>
                                        <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentGrades.length === 0 ? (
                                        <tr><td colSpan={5} className="py-8 text-center text-slate-400">No grades yet.</td></tr>
                                    ) : (
                                        recentGrades.map((grade, index) => (
                                            <tr key={index} className="hover:bg-slate-50">
                                                <td className="py-4 text-sm font-medium text-slate-900">{grade.assignment}</td>
                                                <td className="py-4 text-sm text-slate-600">{grade.subject}</td>
                                                <td className="py-4 text-sm font-semibold text-slate-900">{grade.grade}/100</td>
                                                <td className="py-4 text-sm text-slate-600">{grade.classAvg}/100</td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${grade.statusColor}`}>
                                                        {grade.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ label, value, change, isPositive }: {
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-2">{label}</div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {change}
            </div>
        </div>
    );
}
