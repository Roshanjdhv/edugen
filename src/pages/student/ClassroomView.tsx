import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FileText, Video, ClipboardList, Megaphone, ArrowLeft, Timer, Play } from 'lucide-react';

export default function StudentClassroomView() {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<'materials' | 'quizzes' | 'announcements'>('materials');
    const [classroom, setClassroom] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [materials, setMaterials] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchClassroom();
            fetchMaterials();
            fetchQuizzes();
        }
    }, [id]);

    const fetchClassroom = async () => {
        try {
            const { data, error } = await supabase.from('classrooms').select('*').eq('id', id).single();
            if (error) throw error;
            setClassroom(data);
        } catch (error) {
            console.error('Error fetching classroom:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const { data, error } = await supabase.from('materials').select('*').eq('classroom_id', id).order('created_at', { ascending: false });
            if (!error) setMaterials(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const { data, error } = await supabase.from('quizzes').select('*').eq('classroom_id', id).eq('is_published', true).order('created_at', { ascending: false });
            if (!error) setQuizzes(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading classroom...</div>;
    if (!classroom) return <div className="p-8 text-center text-slate-500 font-medium">Classroom not found.</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <Link to="/student/classrooms" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                Back to Classrooms
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{classroom.name}</h1>
                <p className="text-slate-600 leading-relaxed max-w-2xl">{classroom.description}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                {[
                    { id: 'materials', label: 'Study Materials', icon: FileText },
                    { id: 'quizzes', label: 'Quizzes', icon: ClipboardList },
                    { id: 'announcements', label: 'Announcements', icon: Megaphone },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-8 py-5 font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id
                            ? 'text-blue-600 border-blue-600 bg-blue-50/30'
                            : 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'materials' && (
                    <div className="space-y-6">
                        {materials.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No study materials available yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {materials.map(m => (
                                    <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {m.type === 'video' ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{m.title}</h3>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{m.type}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={m.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
                                        >
                                            Open
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'quizzes' && (
                    <div className="space-y-6">
                        {quizzes.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No quizzes scheduled yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {quizzes.map(q => (
                                    <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-indigo-300 hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <ClipboardList className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-lg">{q.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <Timer className="w-4 h-4 text-slate-400" />
                                                        {q.time_limit_minutes} minutes
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-indigo-600 font-bold">Ready to Start</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/student/quizzes/${q.id}`}
                                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200 active:scale-95"
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                            Start Quiz
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Stay tuned for announcements!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
