import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, BookOpen, UserCheck, Shield } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        activeTeachers: 0,
        activeStudents: 0,
        totalClassrooms: 0
    });
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, []);

    const fetchStats = async () => {
        try {
            // Mock stats or efficient counts if possible
            // Supabase count is easy
            const { count: teachers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
            const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
            const { count: classrooms } = await supabase.from('classrooms').select('*', { count: 'exact', head: true });

            setStats({
                activeTeachers: teachers || 0,
                activeStudents: students || 0,
                totalClassrooms: classrooms || 0
            });
        } catch (e) {
            console.error(e);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20);
            if (!error) setUsers(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
                    <p className="text-slate-500">System overview and user management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.activeTeachers}</div>
                        <div className="text-sm text-slate-500">Active Teachers</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.activeStudents}</div>
                        <div className="text-sm text-slate-500">Active Students</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.totalClassrooms}</div>
                        <div className="text-sm text-slate-500">Total Classrooms</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Recent Users</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Date Joined</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">No users found.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{user.full_name}</td>
                                        <td className="px-6 py-4 capitalize">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-600 flex items-center gap-1">
                                                <UserCheck className="w-3 h-3" /> Active
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
    );
}
