import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users,
    TrendingUp,
    ClipboardCheck,
    Radio,
    Search,
    Bell,
    Calendar,
    ChevronRight,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeacherDashboard() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        avgProgress: 0,
        pendingGrading: 0,
        liveSessions: 0
    });
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

    useEffect(() => {
        if (profile?.id) {
            loadDashboardData();
        }
    }, [profile]);

    const loadDashboardData = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            // 1. Fetch Classrooms for this teacher
            const { data: classrooms } = await supabase
                .from('classrooms')
                .select('id, name')
                .eq('created_by', profile.id);

            const classroomIds = classrooms?.map(c => c.id) || [];

            // 2. Fetch Student Count
            const { count: studentCount } = await supabase
                .from('classroom_students')
                .select('*', { count: 'exact', head: true })
                .in('classroom_id', classroomIds);

            // 3. Fetch Quiz Attempts for Teacher's Quizzes
            const { data: quizzes } = await supabase
                .from('quizzes')
                .select('id, title, classroom_id')
                .in('classroom_id', classroomIds);

            const quizIds = quizzes?.map(q => q.id) || [];

            const { data: attempts } = await supabase
                .from('quiz_attempts')
                .select('*, profiles(full_name), quizzes(title, classroom_id)')
                .in('quiz_id', quizIds)
                .order('completed_at', { ascending: false });

            // 4. Calculate Stats
            const avgScore = attempts?.length
                ? attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / attempts.length
                : 0;

            setStats({
                totalStudents: studentCount || 0,
                avgProgress: Math.round(avgScore * 10), // Assuming score out of 10
                pendingGrading: attempts?.filter(a => a.score === null).length || (attempts?.length ? Math.floor(attempts.length / 3) : 0), // Mock pending if no null scores
                liveSessions: 3 // Placeholder
            });

            // 5. Performance Chart (Avg Score per Classroom)
            const classScores: Record<string, number[]> = {};
            attempts?.forEach(a => {
                const cId = a.quizzes?.classroom_id;
                const cName = classrooms?.find(c => c.id === cId)?.name || 'Unknown';
                if (!classScores[cName]) classScores[cName] = [];
                classScores[cName].push((a.score || 0) * 10);
            });

            const chartData = Object.entries(classScores).map(([name, scores]) => ({
                name: name.split(' ')[0], // Short name
                avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            })).slice(0, 5);
            setPerformanceData(chartData);

            // 6. At Risk Students (Avg < 60%)
            const studentAvgMap = new Map();
            attempts?.forEach(a => {
                const sId = a.student_id;
                if (!studentAvgMap.has(sId)) studentAvgMap.set(sId, { name: a.profiles?.full_name, scores: [] });
                studentAvgMap.get(sId).scores.push((a.score || 0) * 10);
            });

            const atRisk = Array.from(studentAvgMap.values())
                .map(s => ({
                    name: s.name,
                    score: Math.round(s.scores.reduce((a: any, b: any) => a + b, 0) / s.scores.length),
                    status: 'Low Engagement'
                }))
                .filter(s => s.score < 60)
                .slice(0, 3);
            setAtRiskStudents(atRisk);

            // 7. Recent Submissions
            const recent = (attempts || []).slice(0, 5).map(a => ({
                id: a.id,
                student: a.profiles?.full_name || 'Anonymous',
                class: classrooms?.find(c => c.id === a.quizzes?.classroom_id)?.name || 'Class',
                assignment: a.quizzes?.title || 'Quiz',
                date: new Date(a.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ago',
            }));
            setRecentSubmissions(recent);

        } catch (error) {
            console.error('Error loading teacher dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search students, classes, or files..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-600 hover:bg-white rounded-lg transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#f8fafc]"></span>
                    </button>
                    <button className="p-2 text-slate-600 hover:bg-white rounded-lg transition-colors">
                        <Calendar className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back, here's what's happening in your classes today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Users}
                    label="Total Students"
                    value={loading ? '...' : stats.totalStudents.toLocaleString()}
                    change="+12%"
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Avg. Class Progress"
                    value={loading ? '...' : `${stats.avgProgress}%`}
                    change="+5%"
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <StatCard
                    icon={ClipboardCheck}
                    label="Pending Grading"
                    value={loading ? '...' : stats.pendingGrading.toString()}
                    tag="Action Needed"
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
                <StatCard
                    icon={Radio}
                    label="Live Sessions"
                    value={loading ? '...' : stats.liveSessions.toString()}
                    tag="Today"
                    color="text-green-600"
                    bg="bg-green-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Performance Comparison */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-slate-900">Class Performance Comparison</h2>
                        <select className="text-sm bg-slate-50 border-none rounded-lg px-3 py-1 font-medium text-slate-600 outline-none">
                            <option>Current Semester</option>
                        </select>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        {loading ? (
                            <div className="w-full h-full animate-pulse bg-slate-50 rounded-lg"></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Students at Risk */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Students at Risk</h2>
                        <Link to="#" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
                    </div>
                    <div className="space-y-6">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-lg"></div>
                            ))
                        ) : atRiskStudents.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">No students at risk.</div>
                        ) : (
                            atRiskStudents.map((student, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{student.name}</div>
                                            <div className="text-xs text-slate-500">Score: {student.score}% • {student.status}</div>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                        <button className="w-full py-2.5 mt-4 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-blue-200 hover:text-blue-500 transition-all">
                            Set Alert Thresholds
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-slate-900">Recent Submissions</h2>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-200">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading submissions...</td></tr>
                            ) : recentSubmissions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No submissions found.</td></tr>
                            ) : (
                                recentSubmissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                                                    {sub.student[0]}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{sub.student}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{sub.class}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{sub.assignment}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{sub.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                                Open Grader
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Showing {recentSubmissions.length} submissions
                    </div>
                    <div className="flex gap-2">
                        <button className="p-1.5 border border-slate-200 rounded bg-white text-slate-400 hover:text-slate-600">
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                        <button className="p-1.5 border border-slate-200 rounded bg-white text-slate-400 hover:text-slate-600">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, change, color, bg, tag }: any) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className={`p-2.5 ${bg} ${color} rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            {change && (
                <div className="absolute top-6 right-6 text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded">
                    {change}
                </div>
            )}
            {tag && (
                <div className={`absolute top-6 right-6 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tag.includes('Action') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {tag}
                </div>
            )}
            <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
    );
}
