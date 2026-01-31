import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Timer, Send, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Quiz, Question } from '../../types';

export default function TakeQuiz() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: string | number }>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    useEffect(() => {
        if (id) {
            fetchQuizData();
        }
    }, [id]);

    useEffect(() => {
        if (timeLeft === 0) {
            handleSubmit();
        }
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const fetchQuizData = async () => {
        try {
            // 1. Fetch Quiz
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', id)
                .single();

            if (quizError) throw quizError;
            setQuiz(quizData);
            setTimeLeft(quizData.time_limit_minutes * 60);

            // 2. Fetch Questions
            const { data: questionsData, error: questionsError } = await supabase
                .from('questions')
                .select('*')
                .eq('quiz_id', id);

            if (questionsError) throw questionsError;
            setQuestions(questionsData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load quiz');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: string, answer: string | number) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleSubmit = async () => {
        if (isSubmitting || isFinished) return;
        setIsSubmitting(true);

        try {
            let score = 0;
            const answersToInsert = questions.map(q => {
                const userAnswer = answers[q.id!];
                let isCorrect = false;

                if (q.question_type === 'mcq') {
                    isCorrect = userAnswer === q.correct_option;
                } else {
                    isCorrect = String(userAnswer).toLowerCase().trim() === String(q.correct_answer).toLowerCase().trim();
                }

                if (isCorrect) score++;

                return {
                    question_id: q.id,
                    answer: String(userAnswer),
                    is_correct: isCorrect
                };
            });

            // 1. Create Attempt
            const { data: attempt, error: attemptError } = await supabase
                .from('quiz_attempts')
                .insert({
                    quiz_id: id,
                    student_id: user?.id,
                    score: score,
                    completed_at: new Promise(resolve => resolve(new Date().toISOString())) // Fix for TS type if needed, but standard ISO works
                })
                .select()
                .single();

            if (attemptError) throw attemptError;

            // 2. Insert Answers
            const { error: answersError } = await supabase
                .from('quiz_answers')
                .insert(answersToInsert.map(a => ({ ...a, attempt_id: attempt.id })));

            if (answersError) throw answersError;

            setFinalScore(score);
            setIsFinished(true);
            toast.success('Quiz submitted successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to submit quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-500">Preparing your quiz...</div>;

    if (isFinished) {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Quiz Completed!</h1>
                <p className="text-slate-500 mb-8 font-medium">Your results have been recorded successfully.</p>

                <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-slate-100">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</div>
                    <div className="text-6xl font-black text-blue-600">
                        {finalScore} <span className="text-2xl text-slate-300 font-bold">/ {questions.length}</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/student/classrooms/${quiz?.classroom_id}`)}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                >
                    Return to Classroom
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center sticky top-4 z-10">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900">{quiz?.title}</h1>
                    <p className="text-sm text-slate-500 font-medium">Question {currentIndex + 1} of {questions.length}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black ${timeLeft !== null && timeLeft < 60 ? 'border-red-200 bg-red-50 text-red-600 animate-pulse' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                    <Timer className="w-5 h-5" />
                    {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 min-h-[400px] flex flex-col animate-in slide-in-from-right-4 duration-300">
                <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-wider">
                            {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                            {currentQuestion.question_text}
                        </h2>
                    </div>

                    {currentQuestion.question_type === 'mcq' ? (
                        <div className="grid gap-3">
                            {currentQuestion.options?.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(currentQuestion.id!, idx)}
                                    className={`p-5 rounded-2xl border-2 text-left font-bold transition-all transform active:scale-[0.98] ${answers[currentQuestion.id!] === idx
                                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-50'
                                        : 'border-slate-100 hover:border-blue-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${answers[currentQuestion.id!] === idx ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-400'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        {option}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Type your answer below</label>
                            <input
                                type="text"
                                value={answers[currentQuestion.id!] || ''}
                                onChange={(e) => handleAnswer(currentQuestion.id!, e.target.value)}
                                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-lg transition-all"
                                placeholder="Answer here..."
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="mt-12 flex justify-between items-center gap-4 border-t border-slate-50 pt-8">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 font-bold text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Previous
                    </button>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 active:scale-95 disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                            Submit Quiz
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                        >
                            Next Question
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
