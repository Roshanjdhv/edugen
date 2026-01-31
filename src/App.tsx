import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/student/Dashboard';
import StudentClassrooms from './pages/student/Classrooms';
import TeacherDashboard from './pages/teacher/Dashboard';
import CreateClassroom from './pages/teacher/CreateClassroom';
import ClassroomDetails from './pages/teacher/ClassroomDetails';
import AdminDashboard from './pages/admin/Dashboard';

// const AdminDashboard = () => <div>Admin Dashboard Setup</div>; // Removed placeholder

import { useAuth } from './contexts/AuthContext';

function HomeRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/student" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-based root redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/classrooms" element={<StudentClassrooms />} />
                {/* <Route path="/student/classrooms/:id" element={<StudentClassroomView />} /> */}
              </Route>

              {/* Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/classrooms/create" element={<CreateClassroom />} />
                <Route path="/teacher/classrooms/:id" element={<ClassroomDetails />} />
                <Route path="/teacher/announcements" element={<div>Manage Announcements</div>} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<div>Manage Users</div>} />
              </Route>
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
