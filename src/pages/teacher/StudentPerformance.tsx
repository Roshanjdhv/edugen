import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Video, Trophy, Activity } from 'lucide-react';

interface StudentPerformanceProps {
    classroomId: string;
}

interface StudentMetric {
    id: string;
    full_name: string;
    email: string;
    materials_viewed: number;
    videos_watched: number;
    quiz_avg: number;
    overall_score: number;
}

export default function StudentPerformance({ classroomId }: StudentPerformanceProps) {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<StudentMetric[]>([]);
    const [averages, setAverages] = useState({
        materials: 0,
        videos: 0,
        quizzes: 0,
        overall: 0
    });

    useEffect(() => {
        fetchPerformanceData();
    }, [classroomId]);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Students
            const { data: studentsData, error: studentsError } = await supabase
                .from('classroom_students')
                .select('student_id, profiles:student_id(id, full_name, email)')
                .eq('classroom_id', classroomId);

            if (studentsError) throw studentsError;

            // 2. Fetch Totals (Materials & Videos)
            const { data: materialsData } = await supabase
                .from('materials')
                .select('id, type')
                .eq('classroom_id', classroomId);

            const totalMaterials = materialsData?.filter(m => m.type !== 'video').length || 0;
            const totalVideos = materialsData?.filter(m => m.type === 'video').length || 0;

            // 3. Fetch Views & Attempts
            const { data: materialViews } = await supabase
                .from('material_views')
                .select('student_id')
                .eq('classroom_id', classroomId);

            const { data: videoViews } = await supabase
                .from('video_views')
                .select('student_id')
                .eq('classroom_id', classroomId);

            const { data: quizAttempts } = await supabase
                .from('quiz_attempts')
                .select('student_id, percentage')
                .in('quiz_id', (
                    await supabase.from('quizzes').select('id').eq('classroom_id', classroomId)
                ).data?.map(q => q.id) || []);

            // 4. Calculate Metrics per Student
            const calculatedMetrics = studentsData?.map((item: any) => {
                const studentId = item.student_id;
                const profile = item.profiles;

                // Counts
                const mViews = materialViews?.filter(v => v.student_id === studentId).length || 0;
                const vViews = videoViews?.filter(v => v.student_id === studentId).length || 0;

                // Percentages
                const materialPct = totalMaterials > 0 ? (mViews / totalMaterials) * 100 : 0;
                const videoPct = totalVideos > 0 ? (vViews / totalVideos) * 100 : 0;

                // Quiz Avg
                const studentAttempts = quizAttempts?.filter(a => a.student_id === studentId) || [];
                const distinctQuizAvg = studentAttempts.length > 0
                    ? studentAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / studentAttempts.length
                    : 0;

                // Overall Score: (Quiz% * 0.6) + (Material% * 0.2) + (Video% * 0.2)
                // Capped at 100 in case of duplicate views (if unique constraint missing)
                const safeMaterialPct = Math.min(materialPct, 100);
                const safeVideoPct = Math.min(videoPct, 100);

                const overall = (distinctQuizAvg * 0.6) + (safeMaterialPct * 0.2) + (safeVideoPct * 0.2);

                return {
                    id: studentId,
                    full_name: profile.full_name,
                    email: profile.email,
                    materials_viewed: mViews,
                    videos_watched: vViews,
                    quiz_avg: Math.round(distinctQuizAvg),
                    overall_score: Math.round(overall)
                };
            }) || [];

            setMetrics(calculatedMetrics);

            // Calculate Class Averages
            if (calculatedMetrics.length > 0) {
                setAverages({
                    materials: Math.round(calculatedMetrics.reduce((acc, curr) => acc + (totalMaterials ? (curr.materials_viewed / totalMaterials) * 100 : 0), 0) / calculatedMetrics.length),
                    videos: Math.round(calculatedMetrics.reduce((acc, curr) => acc + (totalVideos ? (curr.videos_watched / totalVideos) * 100 : 0), 0) / calculatedMetrics.length),
                    quizzes: Math.round(calculatedMetrics.reduce((acc, curr) => acc + curr.quiz_avg, 0) / calculatedMetrics.length),
                    overall: Math.round(calculatedMetrics.reduce((acc, curr) => acc + curr.overall_score, 0) / calculatedMetrics.length)
                });
            }

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading performance data...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Class Average</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{averages.overall}%</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Material Engagement</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{averages.materials}%</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                            <Video className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Video Engagement</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{averages.videos}%</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Quiz Performance</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{averages.quizzes}%</div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Student Performance Details</h2>
                    <span className="text-sm text-slate-500">{metrics.length} Students</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Student</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Materials</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Videos</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Quiz Avg</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Overall</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {metrics.map(student => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{student.full_name}</div>
                                        <div className="text-xs text-slate-500">{student.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min((student.materials_viewed / (averages.materials || 1)) * 50, 100)}%` }} // Just a visual relative bar
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{student.materials_viewed}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-pink-500 rounded-full"
                                                    style={{ width: `${Math.min((student.videos_watched / (averages.videos || 1)) * 50, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{student.videos_watched}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.quiz_avg >= 80 ? 'bg-green-100 text-green-800' :
                                            student.quiz_avg >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {student.quiz_avg}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${student.overall_score >= 80 ? 'bg-green-500' :
                                                        student.overall_score >= 60 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                        }`}
                                                    style={{ width: `${student.overall_score}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-slate-900">{student.overall_score}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {metrics.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No performance data available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
