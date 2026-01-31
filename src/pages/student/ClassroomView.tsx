import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FileText, Video, ClipboardList, Megaphone, ArrowLeft, Timer, Play, CheckCircle, X, Download, Eye, ExternalLink, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function StudentClassroomView() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'materials' | 'lectures' | 'quizzes' | 'announcements'>('materials');
    const [classroom, setClassroom] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [materials, setMaterials] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [announcementComments, setAnnouncementComments] = useState<Record<string, any[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [quizTab, setQuizTab] = useState<'ongoing' | 'completed'>('ongoing');
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const [previewLoading, setPreviewLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchClassroom();
            fetchMaterials();
            fetchQuizzes();
            fetchAnnouncements();
            fetchQuizAttempts();
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

    const getPreviewUrl = (url: string) => {
        if (!url) return '';
        const extension = url.split('.').pop()?.toLowerCase();
        const officeExtensions = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

        if (officeExtensions.includes(extension || '')) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        }

        // For PDFs, use direct URL as it's more reliable in most browsers
        // We add #toolbar=0 to hide the default browser PDF toolbar if possible
        if (extension === 'pdf') {
            return `${url}#toolbar=0&view=FitH`;
        }

        return url;
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

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*, profiles(full_name)')
                .eq('classroom_id', id)
                .order('created_at', { ascending: false });
            if (!error && data) {
                setAnnouncements(data);
                data.forEach(a => fetchComments(a.id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchComments = async (announcementId: string) => {
        try {
            const { data, error } = await supabase
                .from('announcement_comments')
                .select('*, profiles(full_name)')
                .eq('announcement_id', announcementId)
                .order('created_at', { ascending: true });

            if (!error) {
                setAnnouncementComments(prev => ({
                    ...prev,
                    [announcementId]: data || []
                }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const postComment = async (announcementId: string, parentId?: string) => {
        const content = newComment[parentId || announcementId];
        if (!content?.trim() || !user) return;

        try {
            const { error } = await supabase
                .from('announcement_comments')
                .insert({
                    announcement_id: announcementId,
                    user_id: user.id,
                    content: content.trim(),
                    parent_id: parentId || null
                });

            if (error) {
                console.error('Comment error:', error);
                toast.error(error.message || 'Failed to post comment');
                return;
            }

            setNewComment(prev => ({ ...prev, [parentId || announcementId]: '' }));
            setReplyingTo(null);
            fetchComments(announcementId);
            toast.success('Comment posted!');
        } catch (e) {
            console.error(e);
            toast.error('Failed to post comment');
        }
    };

    const fetchQuizAttempts = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('quiz_attempts')
                .select('*')
                .eq('student_id', user.id);
            if (!error) setQuizAttempts(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const trackView = async (materialId: string, type: string) => {
        if (!user) return;
        try {
            const table = type === 'video' ? 'video_views' : 'material_views';
            const column = type === 'video' ? 'video_id' : 'material_id';

            await supabase.from(table).insert({
                student_id: user.id,
                classroom_id: id,
                [column]: materialId
            });
        } catch (error) {
            // Ignore unique constraint violations (duplicate views)
            console.log('View tracking:', error);
        }
    };

    const ongoingQuizzes = quizzes.filter(q => !quizAttempts.some(a => a.quiz_id === q.id));
    const completedQuizzes = quizzes.filter(q => quizAttempts.some(a => a.quiz_id === q.id));

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
                    { id: 'lectures', label: 'Recorded Lectures', icon: Video },
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
                        {materials.filter(m => m.type !== 'video').length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No study materials available yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {materials.filter(m => m.type !== 'video').map(m => (
                                    <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{m.title}</h3>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{m.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setPreviewLoading(true);
                                                    trackView(m.id, m.type);
                                                    setSelectedMaterial(m);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all transform active:scale-95 shadow-md shadow-blue-100"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                            <a
                                                href={m.file_url}
                                                download={m.title}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => trackView(m.id, m.type)}
                                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                title="Download"
                                            >
                                                <Download className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'lectures' && (
                    <div className="space-y-6">
                        {materials.filter(m => m.type === 'video').length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No recorded lectures available yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {materials.filter(m => m.type === 'video').map(m => (
                                    <div key={m.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all group">
                                        <div className="aspect-video bg-slate-900 relative">
                                            <video src={m.file_url} className="w-full h-full object-cover opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <button
                                                    onClick={() => {
                                                        setPreviewLoading(true);
                                                        trackView(m.id, m.type);
                                                        setSelectedMaterial(m);
                                                    }}
                                                    className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all shadow-xl"
                                                >
                                                    <Play className="w-8 h-8 text-white fill-current" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black rounded-md uppercase tracking-widest">
                                                HD Lecture
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-black text-slate-900 text-lg mb-1 line-clamp-1">{m.title}</h3>
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    <Timer className="w-3.3 h-3.3" />
                                                    Recorded
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPreviewLoading(true);
                                                        trackView(m.id, m.type);
                                                        setSelectedMaterial(m);
                                                    }}
                                                    className="text-blue-600 font-black text-sm hover:underline"
                                                >
                                                    WATCH NOW
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'quizzes' && (
                    <div className="space-y-8">
                        {/* Switch Buttons */}
                        <div className="flex justify-center">
                            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-slate-200">
                                <button
                                    onClick={() => setQuizTab('ongoing')}
                                    className={`px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${quizTab === 'ongoing'
                                        ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    Ongoing
                                    <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs">
                                        {ongoingQuizzes.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setQuizTab('completed')}
                                    className={`px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${quizTab === 'completed'
                                        ? 'bg-white text-green-600 shadow-md ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    Completed
                                    <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-xs">
                                        {completedQuizzes.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {quizTab === 'ongoing' ? (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                                        Available Quizzes
                                    </h2>
                                    {ongoingQuizzes.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold text-lg">No quizzes available at the moment.</p>
                                            <p className="text-slate-400 text-sm">Check back later for new assignments.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {ongoingQuizzes.map(q => (
                                                <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                                    <div className="flex items-center gap-5">
                                                        <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                            <ClipboardList className="w-8 h-8" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-extrabold text-slate-900 text-xl">{q.title}</h3>
                                                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1.5 font-bold">
                                                                <span className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg">
                                                                    <Timer className="w-4 h-4" />
                                                                    {q.time_limit_minutes} mins
                                                                </span>
                                                                <span className="text-blue-600 uppercase tracking-widest text-xs">New</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        to={`/student/quizzes/${q.id}`}
                                                        className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group-hover:scale-105"
                                                    >
                                                        <Play className="w-5 h-5 fill-current" />
                                                        START NOW
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                                        Your Results
                                    </h2>
                                    {completedQuizzes.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold text-lg">You haven't completed any quizzes yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {completedQuizzes.map(q => {
                                                const attempt = quizAttempts.find(a => a.quiz_id === q.id);
                                                return (
                                                    <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-green-300 transition-all duration-300">
                                                        <div className="flex items-center gap-5">
                                                            <div className="relative">
                                                                <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                                                                    <CheckCircle className="w-8 h-8" />
                                                                </div>
                                                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white shadow-sm">
                                                                    {Math.round(attempt?.percentage)}%
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-extrabold text-slate-800 text-xl">{q.title}</h3>
                                                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1.5 font-bold">
                                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg">
                                                                        Completed
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span className="text-slate-400">Score: {attempt?.score}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="text-2xl font-black text-slate-900">
                                                                {attempt?.percentage?.toFixed(1)}%
                                                            </div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final Grade</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="space-y-6">
                        {announcements.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No announcements yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map(a => (
                                    <div
                                        key={a.id}
                                        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all overflow-hidden group hover:shadow-xl duration-300"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-xl font-bold text-slate-900">{a.title}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                                                        {new Date(a.created_at).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedAnnouncement(a)}
                                                        className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                                            <div className="mt-6 pt-4 border-t border-slate-50 text-sm text-slate-500 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-black ring-4 ring-blue-50">
                                                    {a.profiles?.full_name?.[0] || 'T'}
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-slate-900 leading-none mb-0.5">
                                                        {a.profiles?.full_name || 'Teacher'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">Classroom Teacher</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments Section */}
                                        <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-4">
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4 text-blue-600" />
                                                Comments ({announcementComments[a.id]?.length || 0})
                                            </h4>

                                            <div className="space-y-3">
                                                {announcementComments[a.id]?.filter(c => !c.parent_id).map(comment => (
                                                    <div key={comment.id} className="space-y-2">
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-900 text-xs">{comment.profiles?.full_name}</span>
                                                                    <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setReplyingTo(comment.id)}
                                                                    className="text-[10px] font-bold text-blue-600 hover:underline"
                                                                >
                                                                    Reply
                                                                </button>
                                                            </div>
                                                            <p className="text-sm text-slate-600">{comment.content}</p>
                                                        </div>

                                                        {/* Threaded Replies */}
                                                        {announcementComments[a.id]?.filter(reply => reply.parent_id === comment.id).map(reply => (
                                                            <div key={reply.id} className="ml-8 bg-slate-100/50 p-2.5 rounded-lg border-l-2 border-blue-200 flex items-start gap-2">
                                                                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[8px] font-bold mt-0.5 flex-shrink-0">
                                                                    {reply.profiles?.full_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                                        <span className="font-bold text-slate-800 text-[10px]">{reply.profiles?.full_name}</span>
                                                                        <span className="text-[8px] text-slate-400">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-600 leading-relaxed">{reply.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Reply form for specific comment */}
                                                        {replyingTo === comment.id && (
                                                            <div className="ml-8 mt-2 flex gap-2 animate-in slide-in-from-left-2 duration-200">
                                                                <input
                                                                    type="text"
                                                                    autoFocus
                                                                    placeholder={`Reply to ${comment.profiles?.full_name}...`}
                                                                    value={newComment[comment.id] || ''}
                                                                    onChange={(e) => setNewComment(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                                    onKeyPress={(e) => e.key === 'Enter' && postComment(a.id, comment.id)}
                                                                    className="flex-1 bg-white border border-blue-200 rounded-lg px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <button
                                                                    onClick={() => postComment(a.id, comment.id)}
                                                                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700"
                                                                >
                                                                    Post
                                                                </button>
                                                                <button
                                                                    onClick={() => setReplyingTo(null)}
                                                                    className="text-slate-400 hover:text-slate-600"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {(!announcementComments[a.id] || announcementComments[a.id].length === 0) && (
                                                    <p className="text-xs text-slate-400 italic">No comments yet. Be the first to reply!</p>
                                                )}
                                            </div>

                                            {/* Comment Form */}
                                            <div className="mt-4 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Write a comment..."
                                                    value={newComment[a.id] || ''}
                                                    onChange={(e) => setNewComment(prev => ({ ...prev, [a.id]: e.target.value }))}
                                                    onKeyPress={(e) => e.key === 'Enter' && postComment(a.id)}
                                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                                />
                                                <button
                                                    onClick={() => postComment(a.id)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                                                >
                                                    POST
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Preview Modal */}
            {selectedMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    {selectedMaterial.type === 'video' ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg sm:text-xl line-clamp-1">{selectedMaterial.title}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedMaterial.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={selectedMaterial.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Open in new tab"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                                <button
                                    onClick={() => setSelectedMaterial(null)}
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - Previewer */}
                        <div className="flex-1 bg-slate-50 relative flex items-center justify-center overflow-hidden">
                            {previewLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-slate-500 font-bold animate-pulse text-sm">Loading Preview...</p>
                                </div>
                            )}

                            {selectedMaterial.type === 'video' ? (
                                <video
                                    src={selectedMaterial.file_url}
                                    controls
                                    autoPlay
                                    onLoadedData={() => setPreviewLoading(false)}
                                    className="max-w-full max-h-full w-auto h-auto shadow-2xl rounded-lg bg-black object-contain"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <iframe
                                    src={getPreviewUrl(selectedMaterial.file_url)}
                                    className="w-full h-full border-none shadow-inner"
                                    title={selectedMaterial.title}
                                    onLoad={() => setPreviewLoading(false)}
                                />
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                            <a
                                href={selectedMaterial.file_url}
                                download={selectedMaterial.title}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                Download Resource
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcement Focused View Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Megaphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-xl line-clamp-1">Announcement</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                        Published {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-4">{selectedAnnouncement.title}</h2>
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg">{selectedAnnouncement.content}</p>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                    Comments ({announcementComments[selectedAnnouncement.id]?.length || 0})
                                </h4>

                                <div className="space-y-6">
                                    {announcementComments[selectedAnnouncement.id]?.filter(c => !c.parent_id).map(comment => (
                                        <div key={comment.id} className="space-y-3">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                                                            {comment.profiles?.full_name?.[0] || 'S'}
                                                        </div>
                                                        <div>
                                                            <span className="block font-black text-slate-900 text-sm leading-none">
                                                                {comment.profiles?.full_name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setReplyingTo(comment.id)}
                                                        className="text-xs font-bold text-blue-600 hover:underline"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed ml-11">{comment.content}</p>
                                            </div>

                                            {/* Threaded Replies in Modal */}
                                            {announcementComments[selectedAnnouncement.id]?.filter(reply => reply.parent_id === comment.id).map(reply => (
                                                <div key={reply.id} className="ml-11 bg-slate-100/30 p-3 rounded-xl border-l-2 border-blue-100 flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-white text-blue-500 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs flex-shrink-0">
                                                        {reply.profiles?.full_name?.[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-slate-800 text-xs">{reply.profiles?.full_name}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed">{reply.content}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Reply field for modal comment */}
                                            {replyingTo === comment.id && (
                                                <div className="ml-11 mt-2 flex gap-2 animate-in slide-in-from-left-2">
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder={`Reply to ${comment.profiles?.full_name}...`}
                                                        value={newComment[comment.id] || ''}
                                                        onChange={(e) => setNewComment(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                        onKeyPress={(e) => e.key === 'Enter' && postComment(selectedAnnouncement.id, comment.id)}
                                                        className="flex-1 bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                    />
                                                    <button
                                                        onClick={() => postComment(selectedAnnouncement.id, comment.id)}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-700 shadow-lg shadow-blue-100"
                                                    >
                                                        POST
                                                    </button>
                                                    <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!announcementComments[selectedAnnouncement.id] || announcementComments[selectedAnnouncement.id].length === 0) && (
                                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400 italic">No comments yet. Start the conversation!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Post Comment */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment[selectedAnnouncement.id] || ''}
                                    onChange={(e) => setNewComment(prev => ({ ...prev, [selectedAnnouncement.id]: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && postComment(selectedAnnouncement.id)}
                                    className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                                <button
                                    onClick={() => postComment(selectedAnnouncement.id)}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                                >
                                    SEND
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
