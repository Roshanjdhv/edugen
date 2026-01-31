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
    UserCircle
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

                        {!isAdmin && (
                            <NavLink
                                to={isTeacher ? "/teacher/classrooms" : "/student/classrooms"}
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
                                <span>Courses</span>
                            </NavLink>
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
                    <div className="p-4 border-t border-slate-100 space-y-2">
                        <NavLink
                            to="/settings"
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
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </NavLink>

                        {/* User Profile Info */}
                        <div className="flex items-center gap-3 px-4 py-3 mt-2 border-t border-slate-50">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900 truncate">
                                    {profile?.full_name || 'User'}
                                </div>
                                <div className="text-xs text-slate-500 truncate capitalize text-ellipsis">
                                    {isStudent ? `Student ID: #${profile?.id?.slice(0, 4) || '8821'}` : profile?.role}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all text-left"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
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
