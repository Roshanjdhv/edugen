import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, Video, ClipboardList, Megaphone, Users, Plus } from 'lucide-react';
import UploadMaterialModal from '../../components/UploadMaterialModal';

export default function ClassroomDetails() {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<'materials' | 'lectures' | 'quizzes' | 'announcements' | 'students'>('materials');
    const [classroom, setClassroom] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Data states
    const [materials, setMaterials] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchClassroom();
            fetchMaterials();
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

                        {materials.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No study materials uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {materials.map(m => (
                                    <div key={m.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                                {m.type === 'video' ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{m.title}</h3>
                                                <p className="text-sm text-slate-500 uppercase">{m.type}</p>
                                            </div>
                                        </div>
                                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'lectures' && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 mb-4">Recorded lectures appear in Study Materials with type 'video'.</p>
                        <button
                            onClick={() => { setActiveTab('materials'); setIsUploadModalOpen(true); }}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Upload a Video
                        </button>
                    </div>
                )}

                {activeTab === 'quizzes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Quizzes</h2>
                            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <Plus className="w-4 h-4" />
                                Create Quiz
                            </button>
                        </div>
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No quizzes created yet.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="text-center py-12">Announcements Coming Soon</div>
                )}

                {activeTab === 'students' && (
                    <div className="text-center py-12">Student List Coming Soon</div>
                )}

                <UploadMaterialModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    classroomId={id!}
                    onSuccess={fetchMaterials}
                />
            </div>
        </div>
    );
}
