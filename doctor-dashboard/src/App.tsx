import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedLayout } from './components/ProtectedLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientListPage from './pages/PatientListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import TreatmentPlanPage from './pages/TreatmentPlanPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientListPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/exercises" element={<ExerciseLibraryPage />} />
            <Route path="/treatment-plans" element={<TreatmentPlanPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
