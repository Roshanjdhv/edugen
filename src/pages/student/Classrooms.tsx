import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircle, ArrowRight, Check, Grid, List, CirclePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentClassrooms() {
    const { user } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeFilter, setActiveFilter] = useState<'active' | 'upcoming' | 'archived'>('active');

    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const gradients = [
        'from-indigo-600 to-purple-600',
        'from-pink-600 to-fuchsia-600',
        'from-teal-600 to-green-600',
        'from-blue-600 to-cyan-600',
        'from-orange-600 to-red-600',
    ];

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([
            fetchClassrooms(),
            fetchActivity()
        ]);
        setLoading(false);
    };

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
                        description,
                        created_by,
                        profiles!created_by (
                            full_name,
                            role
                        )
                    )
                `)
                .eq('student_id', user.id);

            if (error) throw error;

            const formatted = data.map((item: any, index: number) => ({
                id: item.classrooms.id,
                name: item.classrooms.name,
                description: item.classrooms.description,
                instructor: item.classrooms.profiles?.full_name || 'Teacher',
                title: item.classrooms.profiles?.role || 'Instructor',
                gradient: gradients[index % gradients.length],
                nextLesson: 'Latest Material',
                nextTime: 'Just posted'
            }));

            setClassrooms(formatted);
        } catch (error: any) {
            console.error('Error fetching classrooms:', error);
            // toast.error('Could not load classrooms');
        }
    };

    const fetchActivity = async () => {
        if (!user) return;
        try {
            // Fetch recent materials for joined classrooms
            const { data: materials, error: mError } = await supabase
                .from('materials')
                .select('*, classrooms(name)')
                .order('created_at', { ascending: false })
                .limit(5);

            if (mError) throw mError;

            const formattedActivity = (materials || []).map(m => ({
                type: m.type === 'video' ? 'session' : 'assignment',
                color: m.type === 'video' ? 'bg-yellow-500' : 'bg-blue-500',
                title: m.type === 'video' ? 'New lecture available' : 'New material posted',
                description: `${m.classrooms?.name}: ${m.title}`,
                time: new Date(m.created_at).toLocaleDateString()
            }));

            setActivity(formattedActivity);
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    };

    const handleJoinClassroom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoining(true);
        try {
            const { data: classroom, error: searchError } = await supabase
                .from('classrooms')
                .select('id')
                .eq('code', joinCode.trim())
                .single();

            if (searchError || !classroom) {
                throw new Error('Invalid classroom code');
            }

            const { error: joinError } = await supabase
                .from('classroom_students')
                .insert({
                    classroom_id: classroom.id,
                    student_id: user?.id
                });

            if (joinError) {
                if (joinError.code === '23505') {
                    throw new Error('You have already joined this classroom');
                }
                throw joinError;
            }

            // toast.success('Joined classroom successfully!');
            setJoinCode('');
            loadData();
        } catch (error: any) {
            // toast.error(error.message || 'Failed to join classroom');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-6">
                <h1 className="text-2xl font-bold text-slate-900">My Learning Spaces</h1>
                <p className="text-sm text-slate-600 mt-1">View and manage your active classrooms and learning materials</p>
            </div>

            {/* Main Content */}
            <div className="p-6 max-w-7xl mx-auto">
                {/* Join Classroom Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-10 border border-blue-100/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-5">
                            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
                                <CirclePlus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">Join a Classroom</h2>
                                <p className="text-sm text-slate-600 mt-1">Enter your course invitation code to get started immediately.</p>
                            </div>
                        </div>
                        <form onSubmit={handleJoinClassroom} className="flex gap-3 w-full md:w-auto">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Classroom Code"
                                className="flex-1 md:w-72 px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium text-slate-700 placeholder:text-slate-400"
                                required
                            />
                            <button
                                type="submit"
                                disabled={joining}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {joining ? 'Joining...' : 'Join'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Active Classes - Expanded Area */}
                    <div className="lg:col-span-9">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Active Classes</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                            : "space-y-4"
                        }>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-slate-200"></div>
                                ))
                            ) : classrooms.length === 0 ? (
                                <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
                                    <p className="text-slate-500 font-medium">You haven't joined any classrooms yet.</p>
                                </div>
                            ) : (
                                classrooms.map((course) => (
                                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                        {/* Gradient Header */}
                                        <div className={`bg-gradient-to-br ${course.gradient} h-32 p-6 flex items-end relative overflow-hidden flex-shrink-0`}>
                                            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                                            <h3 className="text-white font-bold text-2xl relative z-10">{course.name}</h3>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <UserCircle className="w-6 h-6 text-slate-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 text-sm truncate">{course.instructor}</div>
                                                    <div className="text-xs text-slate-500 truncate">{course.title}</div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Next Lesson</div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="font-bold text-slate-900 text-sm truncate">{course.nextLesson}</div>
                                                    <div className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${course.nextTime.includes('hours') ? 'bg-blue-100 text-blue-600' :
                                                        course.nextTime.includes('Friday') ? 'bg-green-100 text-green-600' :
                                                            'bg-purple-100 text-purple-600'
                                                        }`}>
                                                        {course.nextTime}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <Link
                                                    to={`/student/classrooms/${course.id}`}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-sm group"
                                                >
                                                    View Details
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Consolidated Labels & Activity */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Quick Filters */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Quick Filters</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setActiveFilter('active')}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeFilter === 'active' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {activeFilter === 'active' && <Check className="w-4 h-4 text-blue-600" />}
                                        <span className="text-sm font-medium">Active</span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                        {classrooms.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('upcoming')}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeFilter === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {activeFilter === 'upcoming' && <Check className="w-4 h-4 text-blue-600" />}
                                        <span className="text-sm font-medium">Upcoming</span>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">12</span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('archived')}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeFilter === 'archived' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {activeFilter === 'archived' && <Check className="w-4 h-4 text-blue-600" />}
                                        <span className="text-sm font-medium">Archived</span>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">8</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {activity.length === 0 ? (
                                    <p className="text-xs text-slate-500">No recent activity.</p>
                                ) : (
                                    activity.map((item, index) => (
                                        <div key={index} className="flex gap-3">
                                            <div className={`w-2 h-2 ${item.color} rounded-full mt-1.5 flex-shrink-0`}></div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-slate-900 mb-0.5">{item.title}</div>
                                                <div className="text-xs text-slate-600 mb-1">{item.description}</div>
                                                <div className="text-xs text-slate-400">{item.time}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                                See All Activity
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <div>© 2024 Nexus LMS. Empowering students worldwide</div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-blue-600">Documentation</a>
                        <a href="#" className="hover:text-blue-600">Support</a>
                        <a href="#" className="hover:text-blue-600">Privacy Policy</a>
                    </div>
                </footer>
            </div>
        </div>
    );
}
