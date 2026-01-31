import { useEffect, useState } from 'react';
import { ClipboardList, Calendar, Download, ChevronRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function Assignments() {
    const { profile } = useAuth();
    const [assignmentsBySubject, setAssignmentsBySubject] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            fetchAssignments();
        }
    }, [profile]);

    const fetchAssignments = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            // 1. Get enrolled classrooms
            const { data: enrollments } = await supabase
                .from('classroom_students')
                .select('classroom_id, classrooms(name)')
                .eq('student_id', profile.id);

            if (!enrollments) return;

            const classroomIds = enrollments.map(e => e.classroom_id);
            const classroomNames = enrollments.reduce((acc, e: any) => {
                acc[e.classroom_id] = e.classrooms?.name || 'Unknown Subject';
                return acc;
            }, {} as Record<string, string>);

            // 2. Get assignments for these classrooms
            const { data: assignmentsData, error } = await supabase
                .from('assignments')
                .select('*')
                .in('classroom_id', classroomIds)
                .order('due_date', { ascending: true });

            if (error) throw error;

            // 3. Group by subject
            const grouped = (assignmentsData || []).reduce((acc, a) => {
                const subjectName = classroomNames[a.classroom_id];
                if (!acc[subjectName]) acc[subjectName] = [];
                acc[subjectName].push(a);
                return acc;
            }, {} as Record<string, any[]>);

            setAssignmentsBySubject(grouped);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <Link to="/" className="hover:text-blue-600">Home</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-slate-900 font-medium">Assignments</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Your Assignments</h1>
                        <p className="text-sm text-slate-600 mt-1">Manage and track your coursework across all subjects</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-6 max-w-7xl mx-auto">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-slate-200"></div>
                        ))}
                    </div>
                ) : Object.keys(assignmentsBySubject).length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">No Assignments Found</h2>
                        <p className="text-slate-500 mt-2">You don't have any assignments posted in your classrooms yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(assignmentsBySubject).map(([subject, assignments]) => (
                            <div key={subject} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 bg-blue-50/30">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                        {subject}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                                        {assignments.length} {assignments.length === 1 ? 'Assignment' : 'Assignments'}
                                    </p>
                                </div>
                                <div className="p-4 flex-1 space-y-4">
                                    {assignments.map(a => (
                                        <div key={a.id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{a.title}</h3>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{a.content}</p>

                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                                    <Calendar className={`w-3.5 h-3.5 ${new Date(a.due_date) < new Date() ? 'text-red-500' : 'text-blue-500'}`} />
                                                    <span className={new Date(a.due_date) < new Date() ? 'text-red-600' : ''}>
                                                        Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No deadline'}
                                                    </span>
                                                </div>
                                                {a.file_url && (
                                                    <a
                                                        href={a.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        title="Download Attachment"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-slate-50 mt-auto border-t border-slate-100">
                                    <Link
                                        to={`/student/classrooms/${assignments[0].classroom_id}`}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 uppercase tracking-widest"
                                    >
                                        Go to Classroom <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
