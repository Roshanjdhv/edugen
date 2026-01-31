import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Users, BookOpen, MoreVertical, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Classroom {
    id: string;
    name: string;
    code: string;
    description: string;
    student_count?: number;
}

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchClassrooms();
    }, [user]);

    const fetchClassrooms = async () => {
        if (!user) return;
        try {
            // Fetch classrooms and count students (mock count for now as referencing count is complex in one query without raw sql function sometimes)
            // We'll stick to simple fetch first
            const { data, error } = await supabase
                .from('classrooms')
                .select('*, classroom_students(count)')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const classroomsWithCounts = data?.map(room => ({
                ...room,
                student_count: room.classroom_students?.[0]?.count || 0
            })) || [];

            setClassrooms(classroomsWithCounts);
        } catch (error) {
            console.error('Error fetching classrooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast.success('Classroom code copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Teacher Dashboard</h1>
                    <p className="text-slate-500">Manage your classrooms and students</p>
                </div>
                <Link
                    to="/teacher/classrooms/create"
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm hover:shadow"
                >
                    <Plus className="w-5 h-5" />
                    Create Classroom
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading classrooms...</div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No classrooms yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first classroom to start sharing materials and quizzes with your students.</p>
                    <Link
                        to="/teacher/classrooms/create"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create a Classroom Now &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map((room) => (
                        <div key={room.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="p-6 border-b border-slate-50">
                                <div className="flex justify-between items-start mb-4">
                                    <Link to={`/teacher/classrooms/${room.id}`} className="block">
                                        <h3 className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">{room.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{room.description}</p>
                                    </Link>
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                    <span className="font-medium">Code:</span>
                                    <code className="font-mono text-blue-600 font-bold tracking-wide">{room.code}</code>
                                    <button
                                        onClick={() => copyCode(room.code, room.id)}
                                        className="ml-auto text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Copy Code"
                                    >
                                        {copiedId === room.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Users className="w-4 h-4" />
                                    <span>{room.student_count || 0} Students</span>
                                </div>
                                <Link to={`/teacher/classrooms/${room.id}`} className="text-blue-600 font-medium hover:underline">
                                    Manage &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
