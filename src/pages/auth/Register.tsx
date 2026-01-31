import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { BookOpen, UserPlus, GraduationCap, School } from 'lucide-react';
import type { Role } from '../../types';

export default function Register() {
    const [role, setRole] = useState<Role>('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign up auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create profile entry manually
                // Note: Ideally this should be done via a Trigger in Postgres for tighter security,
                // but for this MVP and per prompt instructions to "Store role information",
                // we will attempt a manual insert.
                // If RLS allows "Users can insert their own profile" with auth.uid() = id, this works.

                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: authData.user.id,
                        email: email,
                        full_name: fullName,
                        role: role,
                    },
                ]);

                if (profileError) {
                    // If trigger handled it, this might fail on duplicate, which is fine.
                    // But if no trigger, this is necessary.
                    console.error('Profile creation error:', profileError);
                    // If error is duplicate key, ignore it (trigger might have run)
                    if (!profileError.message.includes('duplicate key')) {
                        throw profileError;
                    }
                }

                toast.success('Registration successful! Please sign in.');
                navigate('/login');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-center mb-8">
                    <div className="bg-blue-600 p-3 rounded-full">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
                    Create Action Account
                </h2>

                {/* Role Selection */}
                <div className="flex gap-4 mb-8">
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'student'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-blue-200 text-slate-600'
                            }`}
                    >
                        <GraduationCap className="w-6 h-6" />
                        <span className="font-medium">Student</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'teacher'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-blue-200 text-slate-600'
                            }`}
                    >
                        <School className="w-6 h-6" />
                        <span className="font-medium">Teacher</span>
                    </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
