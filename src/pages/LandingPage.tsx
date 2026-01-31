import { Link } from 'react-router-dom';
import { BookOpen, Users, Building2, GraduationCap, Target, CheckCircle2, Play, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            <span className="text-xl font-bold text-slate-900">SmartLMS</span>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                How It Works
                            </a>
                            <a href="#roles" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                Roles
                            </a>
                            <a href="#analytics" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                Analytics
                            </a>
                        </nav>

                        {/* CTA Buttons */}
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/register"
                                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                            >
                                Get Started
                            </Link>
                            <Link
                                to="/login"
                                className="px-5 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-6">
                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                                Smart Learning.{' '}
                                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                    Smarter Progress.
                                </span>
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                                The all-in-one platform for modern education and smarter growth. Empowering students, teachers, and institutions with innovative collaboration.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    Start Free Trial
                                </Link>
                                <button className="inline-flex items-center px-6 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:border-slate-400 transition-all">
                                    <Play className="w-4 h-4 mr-2" />
                                    Watch Demo
                                </button>
                            </div>
                        </div>

                        {/* Right - Dashboard Preview */}
                        <div className="relative">
                            <div className="bg-gradient-to-br from-green-100 to-blue-50 rounded-3xl p-8 shadow-2xl">
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    {/* Mock Dashboard */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 bg-blue-100 rounded"></div>
                                            <div className="h-2 bg-green-100 rounded w-4/5"></div>
                                            <div className="h-2 bg-purple-100 rounded w-3/5"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tailored for Every Role */}
            <section id="roles" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Tailored for Every Role</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Experience a centralized management system with role-based access and powerful collaboration tools tailored for excellence.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* For Students */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                                <GraduationCap className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">For Students</h3>
                            <p className="text-slate-600 mb-6">
                                Record and track your assignments, track your progress, and collaborate with peers.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                    Interactive Quizzes
                                </li>
                                <li className="flex items-center text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                    Progress Analytics
                                </li>
                            </ul>
                        </div>

                        {/* For Teachers */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">For Teachers</h3>
                            <p className="text-slate-600 mb-6">
                                Create engaging content, evaluate student performance, and provide feedback faster.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                    AI Lesson Builder
                                </li>
                                <li className="flex items-center text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                    Batch Grading
                                </li>
                            </ul>
                        </div>

                        {/* For Institutions */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">For Institutions</h3>
                            <p className="text-slate-600 mb-6">
                                Comprehensive reporting, analytics, and administrative tools for organizational success.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                    Admin Controls
                                </li>
                                <li className="flex items-center text-sm text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                    Data Export
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple 3-Step Process */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple 3-Step Process</h2>
                        <p className="text-lg text-slate-600">
                            Zero complexity for instant onboarding. Start learning in less than a minute.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Join the Platform</h3>
                            <p className="text-slate-600">
                                Sign up with just your email, personalized profile setup for customization.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <BookOpen className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Learn & Teach</h3>
                            <p className="text-slate-600">
                                Access or create classrooms, interactive quizzes and collaborative discussions.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Target className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Track Growth</h3>
                            <p className="text-slate-600">
                                Monitor performance with analytics, real-time AI-powered Insights and progress reports.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visualizing Success in Real-Time */}
            <section id="analytics" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Left Content */}
                            <div className="space-y-6">
                                <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                                    AI-Powered Insights
                                </div>
                                <h2 className="text-4xl font-bold text-slate-900">
                                    Visualizing Success in Real-Time
                                </h2>
                                <p className="text-lg text-slate-600">
                                    Our platform doesn't just store data; it translates stats, track curriculum completion, and accelerate institutional outcomes.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-700">
                                            <strong>94% Improvement in Student Engagement</strong>
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-700">
                                            <strong>Real-time Auto-Grading Powered by AI</strong>
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {/* Right - Analytics Chart */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                        Classrooms Completed
                                    </span>
                                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                        Last 7 Weeks
                                    </span>
                                </div>

                                {/* Bar Chart */}
                                <div className="flex items-end justify-between h-64 border-b border-l border-slate-200 pl-4 pb-4">
                                    <div className="flex flex-col items-center justify-end flex-1">
                                        <div className="w-full max-w-[60px] bg-blue-200 rounded-t-lg transition-all" style={{ height: '40%' }}></div>
                                        <span className="text-xs text-slate-500 mt-2">Week 1</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-end flex-1">
                                        <div className="w-full max-w-[60px] bg-blue-300 rounded-t-lg transition-all" style={{ height: '55%' }}></div>
                                        <span className="text-xs text-slate-500 mt-2">Week 2</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-end flex-1">
                                        <div className="w-full max-w-[60px] bg-blue-400 rounded-t-lg transition-all" style={{ height: '65%' }}></div>
                                        <span className="text-xs text-slate-500 mt-2">Week 3</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-end flex-1">
                                        <div className="w-full max-w-[60px] bg-blue-500 rounded-t-lg transition-all" style={{ height: '85%' }}></div>
                                        <span className="text-xs text-slate-500 mt-2">Week 4</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-end flex-1">
                                        <div className="w-full max-w-[60px] bg-blue-600 rounded-t-lg transition-all" style={{ height: '100%' }}></div>
                                        <span className="text-xs text-slate-500 mt-2">Week 5</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-6 pt-6">
                                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                                        <div className="text-3xl font-bold text-slate-900">94%</div>
                                        <div className="text-sm text-slate-600 mt-1">Avg. Quiz Score</div>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                                        <div className="text-3xl font-bold text-slate-900">13k</div>
                                        <div className="text-sm text-slate-600 mt-1">Active Users</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <BookOpen className="w-6 h-6 text-blue-400" />
                                <span className="text-xl font-bold text-white">SmartLMS</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                Empowering the next generation of learners and educators.
                            </p>
                        </div>

                        {/* Platform */}
                        <div>
                            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wide">Platform</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Enterprise</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Developers</a></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wide">Resources</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Community</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Partners</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wide">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-slate-400">
                            © 2024 SmartLMS. All rights reserved.
                        </p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
