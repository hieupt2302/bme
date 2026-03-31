import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function ProtectedLayout() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile && !['doctor', 'admin'].includes(profile.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="glass-panel p-10 rounded-xl text-center max-w-md">
          <span className="material-symbols-outlined text-5xl text-error mb-4 block">block</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">Truy cập bị từ chối</h2>
          <p className="text-on-surface-variant text-sm">Chỉ bác sĩ mới có quyền truy cập dashboard này.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopNav />
      <Sidebar />
      <main className="ml-64 pt-20 p-8 min-h-screen bg-surface">
        <Outlet />
      </main>
    </>
  );
}
