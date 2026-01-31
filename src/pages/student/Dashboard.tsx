import { useEffect, useState } from 'react';
import { BookOpen, Clock, CheckCircle, BarChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        pendingTasks: 3, // Mock data
        completedTasks: 12, // Mock data
        averageScore: 85, // Mock data
    });
    const [loading, setLoading] = useState(true);
    const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);

    useEffect(() => {
        async function fetchStats() {
            if (!user) return;
            try {
                const { count, error } = await supabase
                    .from('classroom_students')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', user.id);

                if (!error) {
                    setStats(prev => ({ ...prev, enrolledCourses: count || 0 }));
                }

                // Fetch recent announcements from student's classrooms
                const { data: classrooms } = await supabase
                    .from('classroom_students')
                    .select('classroom_id')
                    .eq('student_id', user.id);

                if (classrooms && classrooms.length > 0) {
                    const roomIds = classrooms.map(c => c.classroom_id);
                    const { data: announcements } = await supabase
                        .from('announcements')
                        .select('*, classrooms(name), profiles(full_name)')
                        .in('classroom_id', roomIds)
                        .order('created_at', { ascending: false })
                        .limit(3);

                    if (announcements) setRecentAnnouncements(announcements);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [user]);

    if (loading) {
        return <div className="p-4">Loading stats...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
                <p className="text-slate-500">Welcome back, Student!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={BookOpen}
                    label="Enrolled Courses"
                    value={stats.enrolledCourses}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Clock}
                    label="Pending Tasks"
                    value={stats.pendingTasks}
                    color="bg-orange-500"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Completed Tasks"
                    value={stats.completedTasks}
                    color="bg-green-500"
                />
                <StatCard
                    icon={BarChart}
                    label="Average Score"
                    value={`${stats.averageScore}%`}
                    color="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions / Recent Activity Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="flex gap-4">
                        <Link to="/student/classrooms" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Join New Classroom
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold mb-4 text-slate-900 font-black uppercase tracking-widest">Recent Announcements</h2>
                    <div className="space-y-4">
                        {recentAnnouncements.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">No new announcements.</p>
                        ) : (
                            recentAnnouncements.map(a => (
                                <Link
                                    key={a.id}
                                    to={`/student/classrooms/${a.classroom_id}`}
                                    className="block p-4 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{a.title}</h3>
                                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-100 text-slate-400 font-bold">
                                            {new Date(a.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">{a.content}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span className="text-blue-600">{a.classrooms?.name}</span>
                                        <span>•</span>
                                        <span>{a.profiles?.full_name}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                        {recentAnnouncements.length > 0 && (
                            <Link to="/student/classrooms" className="block text-center text-sm font-bold text-blue-600 hover:underline pt-2">
                                View All Announcements &rarr;
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className={`p-4 rounded-lg ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
            </div>
        </div>
    );
}
