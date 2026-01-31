import { useState } from 'react';
import { X, Plus, Trash2, HelpCircle, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import type { Question, QuestionType } from '../types';

interface CreateQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    classroomId: string;
    onSuccess: () => void;
}

export default function CreateQuizModal({ isOpen, onClose, classroomId, onSuccess }: CreateQuizModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [timeLimit, setTimeLimit] = useState(30);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const addQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            question_text: '',
            question_type: type,
            options: type === 'mcq' ? ['', '', '', ''] : undefined,
            correct_option: type === 'mcq' ? 0 : undefined,
            correct_answer: type === 'short_answer' ? '' : undefined,
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options![oIndex] = value;
            setQuestions(newQuestions);
        }
    };

    const handleCreateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || questions.length === 0) {
            toast.error('Add at least one question');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Quiz
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title,
                    classroom_id: classroomId,
                    time_limit_minutes: timeLimit,
                    created_by: user.id,
                    is_published: true // Auto-publish for now
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // 2. Create Questions
            const questionsToInsert = questions.map(q => ({
                quiz_id: quiz.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                correct_option: q.correct_option,
                correct_answer: q.correct_answer
            }));

            const { error: questionsError } = await supabase
                .from('questions')
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

            toast.success('Quiz created successfully!');
            onSuccess();
            onClose();
            // Reset state
            setTitle('');
            setTimeLimit(30);
            setQuestions([]);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-600 rounded-t-xl text-white">
                    <h2 className="text-xl font-bold">Create New Quiz</h2>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleCreateQuiz} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Quiz Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="E.g. Mid-term Algebra"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Time Limit (Minutes)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={timeLimit}
                                onChange={e => setTimeLimit(parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Questions Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <List className="w-5 h-5 text-blue-600" />
                                Questions ({questions.length})
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => addQuestion('mcq')}
                                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> MCQ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addQuestion('short_answer')}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Short Answer
                                </button>
                            </div>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm">No questions added yet. Click above to add one.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {questions.map((q, qIndex) => (
                                    <div key={qIndex} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex)}
                                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-white border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-slate-600">
                                                    {qIndex + 1}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${q.question_type === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {q.question_type}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Text</label>
                                                <textarea
                                                    required
                                                    value={q.question_text}
                                                    onChange={e => updateQuestion(qIndex, { question_text: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                                    placeholder="What is the capital of France?"
                                                />
                                            </div>

                                            {q.question_type === 'mcq' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {q.options?.map((opt, oIndex) => (
                                                        <div key={oIndex} className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Option {oIndex + 1}</label>
                                                                <input
                                                                    type="radio"
                                                                    name={`correct-${qIndex}`}
                                                                    checked={q.correct_option === oIndex}
                                                                    onChange={() => updateQuestion(qIndex, { correct_option: oIndex })}
                                                                    className="w-3 h-3 text-blue-600"
                                                                    required
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={opt}
                                                                onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                                                                placeholder={`Option ${oIndex + 1}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correct Answer</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={q.correct_answer}
                                                        onChange={e => updateQuestion(qIndex, { correct_answer: e.target.value })}
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="E.g. Paris"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 sticky bottom-0 bg-white -mx-6 -mb-6 p-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || questions.length === 0}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
                        >
                            {loading ? 'Creating...' : 'Create Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
