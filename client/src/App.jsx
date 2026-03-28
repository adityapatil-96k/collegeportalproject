import { Navigate, Route, Routes } from 'react-router-dom';
import PropTypes from 'prop-types';
import './index.css';
import { StudentDashboard } from './screens/StudentDashboard/StudentDashboard';
import { ResourceList } from './screens/StudentDashboard/ResourceList';
import { AuthPage } from './screens/Auth/AuthPage';
import { TeacherDashboard } from './screens/TeacherDashboard/TeacherDashboard';
import { getStoredUser } from './services/api';

function RequireRole({ role, children }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }
  return children;
}

RequireRole.propTypes = {
  role: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function App() {
  const user = getStoredUser();
  const defaultRoute = user?.role === 'teacher' ? '/teacher' : user?.role === 'student' ? '/student' : '/auth';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/student"
        element={
          <RequireRole role="student">
            <StudentDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/student/resources/:type"
        element={
          <RequireRole role="student">
            <ResourceList />
          </RequireRole>
        }
      />
      <Route
        path="/teacher"
        element={
          <RequireRole role="teacher">
            <TeacherDashboard />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default App;
