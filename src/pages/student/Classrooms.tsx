import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Plus, Book, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Classroom {
    id: string;
    name: string;
    code: string;
    description: string;
    created_by: string;
}

export default function StudentClassrooms() {
    const { user } = useAuth();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchClassrooms();
    }, [user]);

    const fetchClassrooms = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('classroom_students')
                .select(`
          classroom_id,
          classrooms (
            id,
            name,
            code,
            description,
            created_by
          )
        `)
                .eq('student_id', user.id);

            if (error) throw error;

            // Flatten structure
            const formattedClassrooms = data.map((item: any) => item.classrooms).filter(Boolean);
            setClassrooms(formattedClassrooms);
        } catch (error: any) {
            console.error('Error fetching classrooms:', error);
            toast.error('Could not load classrooms');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClassroom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoining(true);
        try {
            // 1. Find classroom by code
            const { data: classroom, error: searchError } = await supabase
                .from('classrooms')
                .select('id')
                .eq('code', joinCode.trim())
                .single();

            if (searchError || !classroom) {
                throw new Error('Invalid classroom code');
            }

            // 2. Add student to classroom
            const { error: joinError } = await supabase
                .from('classroom_students')
                .insert({
                    classroom_id: classroom.id,
                    student_id: user?.id
                });

            if (joinError) {
                if (joinError.code === '23505') { // Unique violation
                    throw new Error('You have already joined this classroom');
                }
                throw joinError;
            }

            toast.success('Joined classroom successfully!');
            setJoinCode('');
            fetchClassrooms(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || 'Failed to join classroom');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Classrooms</h1>
                    <p className="text-slate-500">View and join your classes</p>
                </div>
            </div>

            {/* Join Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Join a Classroom
                </h2>
                <form onSubmit={handleJoinClassroom} className="flex gap-4">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Enter Classroom Code"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                    />
                    <button
                        type="submit"
                        disabled={joining}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {joining ? 'Joining...' : 'Join'}
                    </button>
                </form>
            </div>

            {/* Classrooms Grid */}
            {loading ? (
                <div className="text-center py-12">Loading classrooms...</div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <Book className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">You haven't joined any classrooms yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map((room) => (
                        <Link
                            key={room.id}
                            to={`/student/classrooms/${room.id}`}
                            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group"
                        >
                            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex items-end">
                                <h3 className="text-white font-bold text-xl">{room.name}</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                    {room.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                                    Enter Classroom
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
