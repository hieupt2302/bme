import { useAuth } from '../contexts/AuthContext';

export function TopNav() {
  const { profile, signOut } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex justify-between items-center px-6 py-3 text-slate-200">
      <div className="flex items-center gap-4">
        <span className="text-xl font-black tracking-tight text-cyan-400 uppercase">BME Dashboard</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400">account_circle</span>
          <span className="font-medium text-sm">{profile?.full_name || 'Bác sĩ'}</span>
        </div>
        <button
          onClick={signOut}
          className="text-cyan-400 hover:text-cyan-300 transition-colors active:scale-95 duration-200 font-bold text-sm"
        >
          Đăng xuất
        </button>
      </div>
    </nav>
  );
}
