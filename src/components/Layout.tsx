import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    LogOut,
    GraduationCap,
    FileText,
    TrendingUp,
    Settings,
    UserCircle,
    ClipboardCheck,
    HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
    const { signOut, profile, isAdmin, isTeacher, isStudent } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await profile; // Placeholder to avoid unused profile if needed, but signOut is used
        await signOut();
        navigate('/login');
    };

    const closeSidebar = () => setIsSidebarOpen(false);

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
                    {/* Logo Section */}
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-slate-900">Smart LMS</div>
                                <div className="text-xs text-slate-500">
                                    {isAdmin ? 'Admin Portal' : isTeacher ? 'Teacher Portal' : 'Student Portal'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                        <NavLink
                            to={isAdmin ? "/admin" : isTeacher ? "/teacher" : "/student"}
                            onClick={closeSidebar}
                            end
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md font-medium"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )
                            }
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Dashboard</span>
                        </NavLink>

                        {isTeacher && (
                            <>
                                <NavLink
                                    to="/teacher/classrooms"
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md font-medium"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )
                                    }
                                >
                                    <BookOpen className="w-5 h-5" />
                                    <span>My Classes</span>
                                </NavLink>
                                <NavLink
                                    to="/teacher/assignments"
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md font-medium"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )
                                    }
                                >
                                    <FileText className="w-5 h-5" />
                                    <span>Assignments</span>
                                </NavLink>
                                <NavLink
                                    to="/teacher/grading"
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md font-medium"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )
                                    }
                                >
                                    <ClipboardCheck className="w-5 h-5" />
                                    <span>Grading</span>
                                </NavLink>
                                <NavLink
                                    to="/teacher/analytics"
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md font-medium"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )
                                    }
                                >
                                    <TrendingUp className="w-5 h-5" />
                                    <span>Student Analytics</span>
                                </NavLink>
                            </>
                        )}

                        {isStudent && (
                            <>
                                <NavLink
                                    to="/student/assignments"
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md font-medium"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )
                                    }
                                >
                                    <FileText className="w-5 h-5" />
                                    <span>Assignments</span>
                                </NavLink>
                                <NavLink
                                    to="/student/progress"
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md font-medium"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )
                                    }
                                >
                                    <TrendingUp className="w-5 h-5" />
                                    <span>Analytics</span>
                                </NavLink>
                            </>
                        )}
                    </nav>

                    {/* Bottom Section - Profile & Logout */}
                    <div className="p-4 border-t border-slate-100 space-y-1">
                        <NavLink
                            to="/settings"
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm",
                                    isActive
                                        ? "bg-slate-100 text-slate-900 font-medium"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )
                            }
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </NavLink>

                        <NavLink
                            to="/help"
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm",
                                    isActive
                                        ? "bg-slate-100 text-slate-900 font-medium"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )
                            }
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Help Center</span>
                        </NavLink>

                        {/* User Profile Info */}
                        <div className="flex items-center gap-3 px-3 py-3 mt-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border border-slate-200">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900 truncate">
                                    {profile?.full_name || 'Dr. Sarah Jenkins'}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 truncate">
                                    {profile?.role === 'teacher' ? 'Senior Professor' : profile?.role || 'Member'}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto">
                <div className="lg:hidden p-4 border-b bg-white flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <LayoutDashboard className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-slate-900">Smart LMS</span>
                </div>
                <Outlet />
            </main>
        </div>
    );
}
