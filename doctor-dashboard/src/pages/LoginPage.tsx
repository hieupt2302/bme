import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, profile, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && profile && ['doctor', 'admin'].includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Vui lòng nhập đầy đủ thông tin.'); return; }
    setSubmitting(true);
    const err = await signIn(email, password);
    if (err) {
      setError('Email hoặc mật khẩu không đúng.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen overflow-hidden relative">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #46484f 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />
      </div>

      {/* Login card */}
      <main className="relative z-10 w-full max-w-[480px] px-6">
        <div className="glass-panel p-10 rounded-xl clinical-glow border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
              <span className="material-symbols-outlined text-4xl text-primary">clinical_notes</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase mb-2">BME Dashboard</h1>
            <p className="text-on-surface-variant font-medium tracking-wide text-sm text-center">
              Hệ thống theo dõi phục hồi chức năng
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="email">
                Tài khoản / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bacsi@bme.dashboard.vn"
                  className="w-full bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline py-4 pl-12 pr-4 rounded-lg transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">lock</span>
                </div>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline py-4 pl-12 pr-12 rounded-lg transition-all duration-200"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-br from-primary to-primary-dim text-on-primary font-black py-4 rounded-lg tracking-[0.1em] text-sm shadow-[0_8px_20px_rgba(129,236,255,0.2)] hover:shadow-[0_12px_30px_rgba(129,236,255,0.3)] active:scale-[0.98] transition-all duration-200 uppercase disabled:opacity-50"
              >
                {submitting ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
              Bản quyền © 2024 Trung tâm Kỹ thuật Y sinh.
            </p>
          </footer>
        </div>

        {/* Status line */}
        <div className="mt-8 flex justify-between items-center opacity-40">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_#b5ffc2]" />
            <span className="text-[10px] font-mono tracking-tighter text-on-surface-variant">SECURE_TUNNEL: ACTIVE</span>
          </div>
          <div className="text-[10px] font-mono tracking-tighter text-on-surface-variant">v2.4.0-STABLE</div>
        </div>
      </main>
    </div>
  );
}
