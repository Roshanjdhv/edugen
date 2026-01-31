import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserCheck, Shield, Trash2, AlertCircle, BookOpen, FileText, LayoutDashboard, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        activeTeachers: 0,
        activeStudents: 0,
        totalClassrooms: 0,
        totalUsers: 0,
        totalMaterials: 0,
        totalQuizzes: 0,
        totalAnnouncements: 0,
        totalSubmissions: 0
    });
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, []);

    const fetchStats = async () => {
        try {
            const [
                { count: teachers },
                { count: students },
                { count: classrooms },
                { count: total },
                { count: materials },
                { count: quizzes },
                { count: announcements },
                { count: attempts }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
                supabase.from('classrooms').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('materials').select('*', { count: 'exact', head: true }),
                supabase.from('quizzes').select('*', { count: 'exact', head: true }),
                supabase.from('announcements').select('*', { count: 'exact', head: true }),
                supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
            ]);

            setStats({
                activeTeachers: teachers || 0,
                activeStudents: students || 0,
                totalClassrooms: classrooms || 0,
                totalUsers: total || 0,
                totalMaterials: materials || 0,
                totalQuizzes: quizzes || 0,
                totalAnnouncements: announcements || 0,
                totalSubmissions: attempts || 0
            });
        } catch (e) {
            console.error(e);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            if (!error) setUsers(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete the account for ${name}? This action cannot be undone.`)) return;

        setDeletingId(userId);
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);

            if (error) throw error;

            toast.success(`${name}'s account has been removed`);
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-8 p-6 lg:p-10 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Control</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Global User & Analytics Management</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-black text-slate-900 uppercase">System Online</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Students"
                    value={stats.activeStudents}
                    icon={Users}
                    color="blue"
                    description="Registered student accounts"
                />
                <StatCard
                    label="Total Teachers"
                    value={stats.activeTeachers}
                    icon={Shield}
                    color="purple"
                    description="Verified educators"
                />
                <StatCard
                    label="Total Population"
                    value={stats.totalUsers}
                    icon={UserCheck}
                    color="indigo"
                    description="Combined user base"
                />
                <StatCard
                    label="Active Classrooms"
                    value={stats.totalClassrooms}
                    icon={LayoutDashboard}
                    color="cyan"
                    description="Total created rooms"
                />
                <StatCard
                    label="Study Materials"
                    value={stats.totalMaterials}
                    icon={BookOpen}
                    color="emerald"
                    description="Resources uploaded"
                />
                <StatCard
                    label="Quizzes Setup"
                    value={stats.totalQuizzes}
                    icon={FileText}
                    color="amber"
                    description="Assessments created"
                />
                <StatCard
                    label="Student Submissions"
                    value={stats.totalSubmissions}
                    icon={Send}
                    color="rose"
                    description="Completed quiz attempts"
                />
                <StatCard
                    label="System Updates"
                    value={stats.totalAnnouncements}
                    icon={FileText}
                    color="slate"
                    description="Global announcements"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">User Registry</h2>
                        <p className="text-slate-400 text-sm font-medium">Full list of all registered accounts in the system</p>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all w-full md:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Access Level</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Join Date</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <AlertCircle className="w-12 h-12" />
                                            <span className="font-bold uppercase tracking-widest text-sm">No Users Found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users
                                    .filter(user =>
                                        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-lg uppercase transition-transform group-hover:scale-110">
                                                        {user.full_name?.[0] || '?'}
                                                    </div>
                                                    <span className="font-black text-slate-900">{user.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-2 ${user.role === 'teacher' ? 'bg-purple-50 text-purple-600' :
                                                    user.role === 'admin' ? 'bg-red-50 text-red-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.role === 'teacher' ? 'bg-purple-600' :
                                                        user.role === 'admin' ? 'bg-red-600' :
                                                            'bg-blue-600'
                                                        }`} />
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-bold text-slate-500">{user.email}</td>
                                            <td className="px-8 py-5 font-bold text-slate-400 text-sm">
                                                {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                        disabled={deletingId === user.id}
                                                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50"
                                                        title="Permanently Remove Account"
                                                    >
                                                        {deletingId === user.id ? (
                                                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, description }: any) {
    const colorMap: any = {
        blue: 'text-blue-600 bg-blue-50',
        purple: 'text-purple-600 bg-purple-50',
        cyan: 'text-cyan-600 bg-cyan-50',
        indigo: 'text-indigo-600 bg-indigo-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50',
        rose: 'text-rose-600 bg-rose-50',
        slate: 'text-slate-600 bg-slate-50'
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-4 group hover:-translate-y-1 transition-all duration-300">
            <div className={`p-4 rounded-2xl w-fit ${colorMap[color] || colorMap.blue}`}>
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <div className="text-4xl font-black text-slate-900 tracking-tight mb-1">{value.toLocaleString()}</div>
                <div className="text-sm font-black text-slate-900 uppercase tracking-widest">{label}</div>
                <p className="text-xs text-slate-400 font-medium mt-2">{description}</p>
            </div>
        </div>
    );
}
