import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Hardcoded credentials check
        if (password === 'edugen2026') {
            toast.success('Admin login successful!');
            sessionStorage.setItem('admin_auth', 'true');
            navigate('/admin');
        } else {
            toast.error('Invalid admin password');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-50 rounded-full -ml-12 -mb-12" />

                    {/* Logo & Header */}
                    <div className="relative text-center mb-10">
                        <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-200 mb-6">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Admin Portal</h1>
                        <p className="text-slate-500 font-medium">Please enter your secure access key</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-6 relative">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Access Key</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-mono tracking-widest"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Authenticating...' : 'UNLOOCK ACCESS'}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <GraduationCap className="w-4 h-4" />
                            Back to Student LMS
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-50">
                    &copy; 2026 edugen secure gateway
                </div>
            </div>
        </div>
    );
}
