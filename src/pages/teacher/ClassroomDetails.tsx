import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, Video, ClipboardList, Megaphone, Users, Plus, Timer, Trash2, Activity, X, MessageCircle } from 'lucide-react';
import UploadMaterialModal from '../../components/UploadMaterialModal';
import CreateQuizModal from '../../components/CreateQuizModal';
import CreateAnnouncementModal from '../../components/CreateAnnouncementModal';
import StudentPerformance from '../../pages/teacher/StudentPerformance';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';


export default function ClassroomDetails() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    console.log('Rendering ClassroomDetails, ID:', id);
    const [activeTab, setActiveTab] = useState<'materials' | 'lectures' | 'quizzes' | 'announcements' | 'students' | 'performance'>('materials');
    const [classroom, setClassroom] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
    const [isCreateAnnouncementModalOpen, setIsCreateAnnouncementModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);


    // Data states
    const [materials, setMaterials] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [announcementComments, setAnnouncementComments] = useState<Record<string, any[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);


    useEffect(() => {
        if (id) {
            fetchClassroom();
            fetchMaterials();
            fetchQuizzes();
            fetchAnnouncements();
            fetchStudents();
        }
    }, [id]);


    const fetchClassroom = async () => {
        try {
            const { data, error } = await supabase.from('classrooms').select('*').eq('id', id).single();
            if (error) throw error;
            setClassroom(data);
        } catch (error) {
            console.error('Error fetching classroom:', error);
            toast.error('Failed to load classroom details');
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
    }

    const fetchQuizzes = async () => {
        try {
            const { data, error } = await supabase.from('quizzes').select('*').eq('classroom_id', id).order('created_at', { ascending: false });
            if (!error) setQuizzes(data || []);
        } catch (e) {
            console.error(e);
        }
    }

    const deleteQuiz = async (quizId: string) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return;
        try {
            const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
            if (error) throw error;
            toast.success('Quiz deleted');
            fetchQuizzes();
        } catch (error: any) {
            toast.error(error.message);
        }
    }



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
    }

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
        console.log('DEBUG: postComment called', { announcementId, parentId, content, userId: user?.id });

        if (!content?.trim()) {
            console.log('DEBUG: content is empty, returning');
            return;
        }
        if (!user) {
            console.log('DEBUG: user is not authenticated, returning');
            toast.error('You must be logged in to comment');
            return;
        }

        try {
            const payload = {
                announcement_id: announcementId,
                user_id: user.id,
                content: content.trim(),
                parent_id: parentId || null
            };
            console.log('DEBUG: Sending payload to Supabase:', payload);

            const { error } = await supabase
                .from('announcement_comments')
                .insert(payload);

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

    const fetchStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('classroom_students')
                .select('*, profiles:student_id(id, full_name, email)')
                .eq('classroom_id', id);

            if (!error && data) {
                const formattedStudents = data.map((item: any) => ({
                    joined_at: item.joined_at,
                    ...(item.profiles || { full_name: 'Unknown', email: 'No Email' })
                }));
                console.log('Fetched students:', formattedStudents);
                setStudents(formattedStudents);
            }
        } catch (e) {
            console.error(e);
        }
    }



    const removeStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to remove this student?')) return;
        try {
            const { error } = await supabase
                .from('classroom_students')
                .delete()
                .eq('classroom_id', id)
                .eq('student_id', studentId);

            if (error) throw error;
            toast.success('Student removed from classroom');
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading classroom...</div>;
    if (!classroom) return <div className="p-8 text-center text-slate-500">Classroom not found.</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{classroom.name}</h1>
                <p className="text-slate-500">{classroom.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    Code: <span className="font-mono font-bold">{classroom.code}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
                {[
                    { id: 'materials', label: 'Study Materials', icon: FileText },
                    { id: 'lectures', label: 'Recorded Lectures', icon: Video },
                    { id: 'quizzes', label: 'Quizzes', icon: ClipboardList },
                    { id: 'announcements', label: 'Announcements', icon: Megaphone },
                    { id: 'students', label: 'Students', icon: Users },
                    { id: 'performance', label: 'Performance', icon: Users }, // Using Users icon as placeholder or maybe ACTIVITY if I imported it
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'materials' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Study Materials</h2>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Material
                            </button>
                        </div>

                        {materials.filter(m => m.type !== 'video').length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No study materials uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {materials.filter(m => m.type !== 'video').map(m => (
                                    <div key={m.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between group hover:border-blue-300 hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{m.title}</h3>
                                                <p className="text-sm text-slate-500 uppercase">{m.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline px-3 py-1">View</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'lectures' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Recorded Lectures</h2>
                            <button
                                onClick={() => { setActiveTab('materials'); setIsUploadModalOpen(true); }}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Video
                            </button>
                        </div>

                        {materials.filter(m => m.type === 'video').length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No recorded lectures uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {materials.filter(m => m.type === 'video').map(m => (
                                    <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col group hover:border-blue-300 hover:shadow-md transition-all">
                                        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4 relative">
                                            <video src={m.file_url} className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all">
                                                    <Video className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-900 line-clamp-1">{m.title}</h3>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Video Lecture</p>
                                            </div>
                                            <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline text-sm">Watch</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'quizzes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Quizzes</h2>
                            <button
                                onClick={() => setIsCreateQuizModalOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Quiz
                            </button>
                        </div>

                        {quizzes.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No quizzes created yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {quizzes.map(q => (
                                    <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <ClipboardList className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{q.title}</h3>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Timer className="w-3 h-3" />
                                                        {q.time_limit_minutes} mins
                                                    </span>
                                                    <span>•</span>
                                                    <span>{q.is_published ? 'Published' : 'Draft'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => deleteQuiz(q.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <button className="text-blue-600 font-bold hover:underline px-3 py-1">View Results</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}


                {activeTab === 'announcements' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Announcements</h2>
                            <button
                                onClick={() => setIsCreateAnnouncementModalOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Announcement
                            </button>
                        </div>

                        {announcements.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No announcements yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map(a => (
                                    <div
                                        key={a.id}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-bold text-slate-900">{a.title}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-500">
                                                        {new Date(a.created_at).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedAnnouncement(a)}
                                                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                                            <div className="mt-4 text-sm text-slate-500 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {a.profiles?.full_name?.[0] || 'T'}
                                                </div>
                                                Posted by {a.profiles?.full_name || 'Teacher'}
                                            </div>
                                        </div>

                                        {/* Comments Section */}
                                        <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                Comments ({announcementComments[a.id]?.length || 0})
                                            </h4>

                                            <div className="space-y-2">
                                                {announcementComments[a.id]?.filter(c => !c.parent_id).map(comment => (
                                                    <div key={comment.id} className="space-y-2">
                                                        <div className="bg-white p-3 rounded-lg border border-slate-200/50 shadow-sm animate-in fade-in slide-in-from-top-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-900 text-xs text-blue-600">
                                                                        {comment.profiles?.full_name}
                                                                        {comment.user_id === classroom?.teacher_id && (
                                                                            <span className="ml-1.5 bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full">Teacher</span>
                                                                        )}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setReplyingTo(comment.id); }}
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
                                                                    className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <button
                                                                    onClick={() => postComment(a.id, comment.id)}
                                                                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700"
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
                                                    <p className="text-xs text-slate-400 italic py-2">No comments yet.</p>
                                                )}
                                            </div>

                                            {/* Comment Form */}
                                            <div className="mt-3 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Reply to this announcement..."
                                                    value={newComment[a.id] || ''}
                                                    onChange={(e) => setNewComment(prev => ({ ...prev, [a.id]: e.target.value }))}
                                                    onKeyPress={(e) => e.key === 'Enter' && postComment(a.id)}
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                                />
                                                <button
                                                    onClick={() => postComment(a.id)}
                                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Students ({students.length})</h2>
                        </div>

                        {students.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No students joined yet.</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Joined Date</th>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map(student => (
                                            <tr key={student.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900">{student.full_name}</td>
                                                <td className="px-6 py-4 text-slate-500">{student.email}</td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {new Date(student.joined_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => removeStudent(student.id)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'performance' && (
                    <StudentPerformance classroomId={id!} />
                )}

                <UploadMaterialModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    classroomId={id!}
                    onSuccess={fetchMaterials}
                />

                <CreateQuizModal
                    isOpen={isCreateQuizModalOpen}
                    onClose={() => setIsCreateQuizModalOpen(false)}
                    classroomId={id!}
                    onSuccess={fetchQuizzes}
                />

                <CreateAnnouncementModal
                    isOpen={isCreateAnnouncementModalOpen}
                    onClose={() => setIsCreateAnnouncementModalOpen(false)}
                    classroomId={id!}
                    onSuccess={fetchAnnouncements}
                />
            </div>

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
                                    <h3 className="font-black text-slate-900 text-xl line-clamp-1">Announcement Details</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                        Posted {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
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
                                    Discussion ({announcementComments[selectedAnnouncement.id]?.length || 0})
                                </h4>

                                <div className="space-y-6">
                                    {announcementComments[selectedAnnouncement.id]?.filter(c => !c.parent_id).map(comment => (
                                        <div key={comment.id} className="space-y-3">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                                                            {comment.profiles?.full_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <span className="block font-black text-slate-900 text-sm leading-none">
                                                                {comment.profiles?.full_name}
                                                                {comment.user_id === classroom?.teacher_id && (
                                                                    <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase">Teacher</span>
                                                                )}
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
                                            <p className="text-sm text-slate-400 italic">No comments yet from students.</p>
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
                                    placeholder="Write a reply..."
                                    value={newComment[selectedAnnouncement.id] || ''}
                                    onChange={(e) => setNewComment(prev => ({ ...prev, [selectedAnnouncement.id]: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && postComment(selectedAnnouncement.id)}
                                    className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                                <button
                                    onClick={() => postComment(selectedAnnouncement.id)}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                                >
                                    REPLY
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
