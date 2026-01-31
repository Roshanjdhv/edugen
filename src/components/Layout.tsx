import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    LogOut,
    Menu,
    GraduationCap,
    Users,
    Bell
} from 'lucide-react';
import { cn } from '../lib/utils'; // Make sure utils exists or use clsx directly if preferred, but I created it.

export default function Layout() {
    const { user, profile, signOut, isStudent, isTeacher, isAdmin } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const closeSidebar = () => setIsSidebarOpen(false);

    const studentLinks = [
        { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/classrooms', label: 'My Classrooms', icon: BookOpen },
        // { to: '/student/account', label: 'My Account', icon: User },
    ];

    const teacherLinks = [
        { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
        // { to: '/teacher/classrooms', label: 'Classrooms', icon: BookOpen }, // Dashboard covers this
        { to: '/teacher/announcements', label: 'Announcements', icon: Bell },
    ];

    const adminLinks = [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users', icon: Users },
    ];

    const links = isStudent ? studentLinks : isTeacher ? teacherLinks : isAdmin ? adminLinks : [];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:transform-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Smart LMS</span>
                    </div>

                    <div className="p-4">
                        <div className="mb-6 px-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {profile?.role || 'User'}
                            </p>
                            <div className="font-medium text-slate-900 truncate">
                                {profile?.full_name || user?.email}
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {links.map((link) => {
                                const Icon = link.icon;
                                const isActive = location.pathname === link.to;
                                return (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={closeSidebar}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                            isActive
                                                ? "bg-blue-50 text-blue-700 font-medium"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-auto p-4 border-t border-slate-100">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                <header className="bg-white border-b border-slate-200 lg:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-slate-900">Smart LMS</span>
                    </div>
                </header>

                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
