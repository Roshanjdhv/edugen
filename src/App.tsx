import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/student/Dashboard';
import StudentProgress from './pages/student/Progress';
import StudentClassrooms from './pages/student/Classrooms';
import TeacherDashboard from './pages/teacher/Dashboard';
import CreateClassroom from './pages/teacher/CreateClassroom';
import ClassroomDetails from './pages/teacher/ClassroomDetails';
import AdminDashboard from './pages/admin/Dashboard';
import StudentClassroomView from './pages/student/ClassroomView';
import TakeQuiz from './pages/student/TakeQuiz';
import LandingPage from './pages/LandingPage';
import StudentAnalytics from './pages/teacher/StudentAnalytics';



// const AdminDashboard = () => <div>Admin Dashboard Setup</div>; // Removed placeholder

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Landing page - always shown at root */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/classrooms" element={<StudentClassrooms />} />
                <Route path="/student/progress" element={<StudentProgress />} />
                <Route path="/student/classrooms/:id" element={<StudentClassroomView />} />
                <Route path="/student/quizzes/:id" element={<TakeQuiz />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/classrooms/create" element={<CreateClassroom />} />
                <Route path="/teacher/classrooms/:id" element={<ClassroomDetails />} />
                <Route path="/teacher/analytics" element={<StudentAnalytics />} />
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
