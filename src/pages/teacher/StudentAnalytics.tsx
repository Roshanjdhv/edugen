import { useEffect, useState } from 'react';
import {
    Calendar,
    Download,
    ChevronRight,
    Search,
    TrendingUp,
    Activity,
    Smile,
    Meh,
    Frown,
    Sparkles
} from 'lucide-react';
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export default function StudentAnalytics() {
    const { profile } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [interactionData, setInteractionData] = useState<any[]>([]);
    const [sentimentData, setSentimentData] = useState({ happy: 0, neutral: 0, sad: 0 });
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('performance');

    useEffect(() => {
        if (profile?.id) {
            loadInitialData();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedStudent) {
            loadStudentAnalytics(selectedStudent.id);
        }
    }, [selectedStudent]);

    const loadInitialData = async () => {
        try {
            // Fetch classrooms
            const { data: classroomsData } = await supabase
                .from('classrooms')
                .select('id, name')
                .eq('created_by', profile?.id);

            setClassrooms(classroomsData || []);

            if (classroomsData && classroomsData.length > 0) {
                const classroomIds = classroomsData.map(c => c.id);

                // Fetch students in these classrooms
                const { data: studentsData } = await supabase
                    .from('classroom_students')
                    .select('student_id, profiles(full_name, email), classrooms(name)')
                    .in('classroom_id', classroomIds);

                const formattedStudents = studentsData?.map(s => ({
                    id: s.student_id,
                    name: (s.profiles as any)?.full_name,
                    email: (s.profiles as any)?.email,
                    classroom: (s.classrooms as any)?.name,
                    status: Math.random() > 0.5 ? 'Active' : 'Idle' // Mocking status
                })) || [];

                setStudents(formattedStudents);
                if (formattedStudents.length > 0) {
                    setSelectedStudent(formattedStudents[0]);
                }
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const loadStudentAnalytics = async (studentId: string) => {
        try {
            // 1. Fetch performance (Quiz scores)
            const { data: attempts } = await supabase
                .from('quiz_attempts')
                .select('score, completed_at, quizzes(title)')
                .eq('student_id', studentId)
                .order('completed_at', { ascending: true });

            const pData = attempts?.map(a => ({
                name: (a.quizzes as any)?.title.split(' ')[0],
                score: (a.score || 0) * 10,
                avg: 75 // Mock class average for now
            })) || [];
            setPerformanceData(pData);

            // 2. Fetch interactions (Mocking interaction frequency for the heatmap)
            const heatmapData = Array.from({ length: 28 }, (_, i) => ({
                day: i,
                value: Math.floor(Math.random() * 5)
            }));
            setInteractionData(heatmapData);

            // 3. Fetch sentiment
            const { data: exitTickets } = await supabase
                .from('exit_tickets')
                .select('sentiment')
                .eq('student_id', studentId);

            const sentiment = { happy: 0, neutral: 0, sad: 0 };
            exitTickets?.forEach(t => {
                if (t.sentiment === 'happy') sentiment.happy++;
                else if (t.sentiment === 'neutral') sentiment.neutral++;
                else if (t.sentiment === 'sad') sentiment.sad++;
            });

            const total = exitTickets?.length || 1;
            setSentimentData({
                happy: Math.round((sentiment.happy / total) * 100) || 65,
                neutral: Math.round((sentiment.neutral / total) * 100) || 25,
                sad: Math.round((sentiment.sad / total) * 100) || 10
            });

        } catch (error) {
            console.error('Error loading student analytics:', error);
        }
    };

    const generateAIProfile = (student: any) => {
        if (!student) return null;
        const avgScore = performanceData.length
            ? performanceData.reduce((acc, curr) => acc + curr.score, 0) / performanceData.length
            : 0;

        let insights = {
            summary: `${student.name.split(' ')[0]} demonstrates strong theoretical comprehension but may struggle with practical applications.`,
            strengths: "Strong in vocabulary and conceptual linking",
            weaknesses: "Needs help with practical math applications",
            recommendation: "Recommended: Visual aid worksheets for Unit 4"
        };

        if (avgScore > 85) {
            insights.summary = `${student.name.split(' ')[0]} is performing exceptionally well across all modules.`;
            insights.strengths = "Excellent critical thinking and problem solving";
            insights.recommendation = "Recommended: Advanced research project on Genetics";
        } else if (avgScore < 60) {
            insights.summary = `${student.name.split(' ')[0]} is currently struggling with core concepts.`;
            insights.strengths = "Consistent attempts at assignments";
            insights.recommendation = "Recommended: 1-on-1 focus session for next module";
        }

        return insights;
    };

    const aiInsights = generateAIProfile(selectedStudent);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {/* Left Sidebar - Student Roster */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        <span>Classes</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-900">{classrooms[0]?.name || 'Grade 10 - Biology'}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Student Roster</h2>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {students.length} Total
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find student..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
                    {students.map((student) => (
                        <button
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                                selectedStudent?.id === student.id
                                    ? "bg-blue-50 border border-blue-100 shadow-sm"
                                    : "hover:bg-slate-50 border border-transparent"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                                        {student.name[0]}
                                    </div>
                                    <div className={cn(
                                        "absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full",
                                        student.status === 'Active' ? "bg-green-500" : "bg-orange-400"
                                    )} />
                                </div>
                                <div className="text-left">
                                    <div className={cn(
                                        "text-sm font-bold truncate w-32",
                                        selectedStudent?.id === student.id ? "text-blue-700" : "text-slate-700"
                                    )}>
                                        {student.name}
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                        <div className={cn(
                                            "w-1 h-1 rounded-full",
                                            student.status === 'Active' ? "bg-green-500" : "bg-orange-400"
                                        )} />
                                        {student.status === 'Active' ? 'Active Now' : 'Idle (2h)'}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className={cn(
                                "w-4 h-4 transition-transform",
                                selectedStudent?.id === student.id ? "text-blue-500 translate-x-1" : "text-slate-300"
                            )} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                {/* Internal Top Bar */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="h-4 w-px bg-slate-200 lg:hidden" />
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b-2 border-blue-600 pb-4 -mb-4 px-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Analytical View
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2">Student Analytics & Insights</h1>
                            <p className="text-slate-500 font-medium">
                                Real-time performance tracking for <span className="text-blue-600 font-bold">{selectedStudent?.name || 'Alex Rivera'}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                Semester 1
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 border-b border-slate-200">
                        {['Performance Overview', 'Assignments & Labs', 'Engagement'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={cn(
                                    "pb-4 text-sm font-bold transition-all relative",
                                    activeTab === tab.toLowerCase() ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab}
                                {activeTab === tab.toLowerCase() && (
                                    <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Login & Activity Frequency</h3>
                                    <p className="text-sm text-slate-400">Interaction density over the last 30 days</p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                    <span>Less</span>
                                    <div className="flex gap-1">
                                        {[100, 200, 400, 600].map(v => (
                                            <div key={v} className={cn("w-3 h-3 rounded-sm", `bg-blue-${v}`)} />
                                        ))}
                                    </div>
                                    <span>More</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {interactionData.map((d) => (
                                    <div
                                        key={d.day}
                                        className={cn(
                                            "h-12 rounded-lg transition-all hover:scale-105 cursor-pointer",
                                            d.value === 0 ? "bg-slate-50" :
                                                d.value === 1 ? "bg-blue-100" :
                                                    d.value === 2 ? "bg-blue-200" :
                                                        d.value === 3 ? "bg-blue-400" : "bg-blue-600"
                                        )}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>4 Weeks Ago</span>
                                <span>3 Weeks Ago</span>
                                <span>2 Weeks Ago</span>
                                <span>This Week</span>
                            </div>
                        </div>

                        <div className="bg-[#eff6ff] rounded-3xl border border-blue-100 p-8 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-200/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-2 text-blue-600 font-black text-sm mb-6">
                                    <Sparkles className="w-5 h-5" />
                                    AI Learning Profile
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-auto shadow-sm border border-white/50">
                                    <p className="text-sm leading-relaxed text-slate-700 font-medium">
                                        <span className="font-black text-blue-600">{selectedStudent?.name.split(' ')[0] || 'Alex'}</span> {aiInsights?.summary}
                                    </p>
                                </div>
                                <div className="space-y-4 pt-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-600">{aiInsights?.strengths}</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-600">{aiInsights?.weaknesses}</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-600">{aiInsights?.recommendation}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Academic Growth Curve</h3>
                                <p className="text-sm text-slate-400 font-medium">Quiz scores vs. Class Average over the semester</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-1 bg-blue-600 rounded-full" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedStudent?.name.split(' ')[0] || 'ALEX'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CLASS AVG</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#2563eb"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avg"
                                        stroke="#e2e8f0"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Activity className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Class Sentiment (Exit Tickets)</h3>
                                <p className="text-sm font-medium text-slate-400">Aggregated feedback from today's session</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-12">
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-yellow-50 text-yellow-500 rounded-2xl">
                                    <Smile className="w-8 h-8" />
                                </div>
                                <span className="text-lg font-black text-slate-900">{sentimentData.happy}%</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                                    <Meh className="w-8 h-8" />
                                </div>
                                <span className="text-lg font-black text-slate-900">{sentimentData.neutral}%</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-red-50 text-red-400 rounded-2xl">
                                    <Frown className="w-8 h-8" />
                                </div>
                                <span className="text-lg font-black text-slate-900">{sentimentData.sad}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
