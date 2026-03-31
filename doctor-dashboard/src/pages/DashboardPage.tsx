import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SessionRow {
  id: string;
  patient_id: string;
  total_score: number;
  total_catches: number;
  avg_angle_deg: number;
  avg_tremor: number;
  max_tremor: number;
  clinical_conclusion: string;
  created_at: string;
  profiles?: { full_name: string; id: string };
}

export default function DashboardPage() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [weeklySessions, setWeeklySessions] = useState(0);
  const [abnormalCount, setAbnormalCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<SessionRow[]>([]);
  const [alerts, setAlerts] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const week7 = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [pRes, sAllRes, recentRes, alertRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('sessions').select('created_at, clinical_conclusion'),
      supabase.from('sessions').select('*, profiles!sessions_patient_id_fkey(full_name, id)').order('created_at', { ascending: false }).limit(10),
      supabase.from('sessions').select('*, profiles!sessions_patient_id_fkey(full_name, id)').neq('clinical_conclusion', 'TAY HOẠT ĐỘNG ỔN ĐỊNH').gte('created_at', week7).order('created_at', { ascending: false }).limit(10),
    ]);

    setTotalPatients(pRes.count ?? 0);

    const allSessions = sAllRes.data ?? [];
    setTodaySessions(allSessions.filter(s => s.created_at >= todayStart).length);
    setWeeklySessions(allSessions.filter(s => s.created_at >= weekStart).length);
    setAbnormalCount(allSessions.filter(s => s.created_at >= week7 && s.clinical_conclusion !== 'TAY HOẠT ĐỘNG ỔN ĐỊNH').length);

    setRecentSessions((recentRes.data as SessionRow[]) ?? []);
    setAlerts((alertRes.data as SessionRow[]) ?? []);
    setLoading(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return { time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), sub: 'Vừa xong' };
    if (diffH < 24) return { time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), sub: 'Hôm nay' };
    if (diffH < 48) return { time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), sub: 'Hôm qua' };
    return { time: d.toLocaleDateString('vi-VN'), sub: '' };
  }

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
  }

  function isNormal(conclusion: string) {
    return conclusion === 'TAY HOẠT ĐỘNG ỔN ĐỊNH';
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Vừa xong';
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Tổng bệnh nhân', value: totalPatients, icon: 'person', color: 'primary', badge: `${totalPatients}` },
    { label: 'Phiên tập hôm nay', value: todaySessions, icon: 'exercise', color: 'tertiary', badge: 'Ổn định' },
    { label: 'Cần chú ý', value: abnormalCount, icon: 'warning', color: 'error', badge: abnormalCount > 0 ? 'Cấp bách' : 'OK' },
    { label: 'Phiên tập tuần này', value: weeklySessions, icon: 'analytics', color: 'secondary', badge: 'Theo kế hoạch' },
  ];

  return (
    <>
      {/* Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Bảng Điều Khiển Tổng Quan</h1>
          <p className="text-on-surface-variant">Cập nhật dữ liệu lâm sàng thời gian thực.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container p-6 rounded-xl relative overflow-hidden transition-transform hover:scale-[1.02] duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 bg-${s.color}/10 rounded-lg`}>
                <span className={`material-symbols-outlined text-${s.color}`}>{s.icon}</span>
              </div>
              <span className={`text-xs font-bold text-${s.color} px-2 py-1 bg-${s.color}/5 rounded-full`}>{s.badge}</span>
            </div>
            <p className="text-on-surface-variant text-sm font-medium mb-1">{s.label}</p>
            <h3 className="text-4xl font-black text-on-surface tracking-tight">{String(s.value).padStart(2, '0')}</h3>
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-${s.color} to-transparent opacity-50`} />
          </div>
        ))}
      </section>

      {/* Grid: Table + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Recent Sessions Table */}
        <div className="xl:col-span-3">
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl">
            <div className="px-6 py-5 flex justify-between items-center bg-surface-container-high">
              <h2 className="text-lg font-bold text-on-surface">Phiên tập gần đây</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-highest/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Thời gian</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bệnh nhân</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">Điểm số</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Góc gập TB</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Độ rung TB</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Đánh giá</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentSessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">Chưa có phiên tập nào.</td>
                    </tr>
                  )}
                  {recentSessions.map((s) => {
                    const t = formatTime(s.created_at);
                    const normal = isNormal(s.clinical_conclusion);
                    const pName = (s.profiles as unknown as { full_name: string })?.full_name ?? 'N/A';
                    const pId = (s.profiles as unknown as { id: string })?.id ?? '';
                    return (
                      <tr key={s.id} className="hover:bg-surface-bright transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{t.time}</div>
                          {t.sub && <div className="text-[10px] text-on-surface-variant">{t.sub}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/patients/${pId}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold border border-white/5">
                              {getInitials(pName)}
                            </div>
                            <span className="text-sm font-semibold">{pName}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-mono font-bold ${normal ? 'text-tertiary' : 'text-error'}`}>
                            {s.total_score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">{s.avg_angle_deg?.toFixed(0)}°</td>
                        <td className="px-6 py-4 text-sm font-mono">{s.avg_tremor?.toFixed(1)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            normal
                              ? 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                              : 'bg-error/10 text-error border border-error/20'
                          }`}>
                            {normal ? 'Bình thường' : 'BẤT THƯỜNG'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/sessions/${s.id}`} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors inline-block">
                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="xl:col-span-1">
          <div className="bg-surface-container rounded-xl overflow-hidden flex flex-col shadow-xl" style={{ maxHeight: 600 }}>
            <div className="px-6 py-5 bg-error-container/20 border-b border-error/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined">notifications_active</span>
                <h2 className="font-bold text-sm uppercase tracking-wider">Cảnh báo (7 ngày)</h2>
              </div>
              {alerts.length > 0 && (
                <span className="bg-error text-on-error px-1.5 py-0.5 rounded text-[10px] font-black">{alerts.length}</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {alerts.length === 0 && (
                <div className="text-center py-8 text-on-surface-variant text-sm">Không có cảnh báo nào.</div>
              )}
              {alerts.map((a) => {
                const pName = (a.profiles as unknown as { full_name: string })?.full_name ?? 'N/A';
                return (
                  <div key={a.id} className="bg-surface-container-high p-4 rounded-lg border-l-4 border-error hover:bg-surface-container-highest transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-on-surface">{pName}</h4>
                      <span className="text-[10px] font-medium text-on-surface-variant">{timeAgo(a.created_at)}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{a.clinical_conclusion}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-error bg-error/5 px-2 py-0.5 rounded">Bất thường</span>
                      <Link to={`/sessions/${a.id}`} className="text-[10px] font-bold text-primary hover:underline">Chi tiết</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 flex justify-between items-center text-on-surface-variant text-[10px] font-medium tracking-widest uppercase">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span>Server: Trực tuyến</span>
          </div>
        </div>
        <div>Dự án BME © 2024</div>
      </footer>
    </>
  );
}
