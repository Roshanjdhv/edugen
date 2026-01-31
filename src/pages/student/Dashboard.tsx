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
            } catch (error) {
                console.error('Error fetching stats:', error);
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
                    <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
                    <p className="text-slate-500 text-sm">No new announcements.</p>
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
