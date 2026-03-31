import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface Session {
  id: string; total_score: number; total_catches: number;
  avg_angle_deg: number; avg_tremor: number; max_tremor: number;
  clinical_conclusion: string; created_at: string; patient_id: string;
  started_at: string;
}
interface Event { id: string; time_offset_s: number; cumulative_score: number; avg_flexion_angle_deg: number; tremor_value: number; }
interface Profile { full_name: string; id: string; }

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => { if (id) fetchData(id); }, [id]);

  async function fetchData(sessionId: string) {
    const { data: s } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    if (!s) { setLoading(false); return; }
    setSession(s);
    const [eRes, pRes] = await Promise.all([
      supabase.from('session_events').select('*').eq('session_id', sessionId).order('time_offset_s', { ascending: true }),
      supabase.from('profiles').select('full_name, id').eq('id', s.patient_id).single(),
    ]);
    setEvents(eRes.data ?? []);
    setProfile(pRes.data);
    setLoading(false);
  }

  function exportCSV() {
    if (!session || events.length === 0) return;
    const h = ['Thời điểm (s)', 'Điểm tích lũy', 'Góc gập TB', 'Độ rung'];
    const rows = events.map(e => [e.time_offset_s.toFixed(2), e.cumulative_score, e.avg_flexion_angle_deg?.toFixed(1), e.tremor_value?.toFixed(2)]);
    const csv = [h.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `session_${session.id.slice(0, 8)}.csv`; a.click();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!session) return <div className="text-center py-20 text-on-surface-variant">Không tìm thấy phiên tập.</div>;

  const normal = session.clinical_conclusion === 'TAY HOẠT ĐỘNG ỔN ĐỊNH';
  const angleData = events.map(e => ({ t: +e.time_offset_s.toFixed(1), angle: +(e.avg_flexion_angle_deg || 0).toFixed(1) }));
  const tremorData = events.map(e => ({ t: +e.time_offset_s.toFixed(1), tremor: +(e.tremor_value || 0).toFixed(2) }));
  const scoreData = events.map((e, i) => ({ catch: i + 1, score: e.cumulative_score }));
  const visibleEvents = showAllEvents ? events : events.slice(0, 10);

  return (
    <>
      <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-4 uppercase tracking-wider">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <Link to="/patients" className="hover:text-primary transition-colors">Bệnh nhân</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        {profile && <><Link to={`/patients/${profile.id}`} className="hover:text-primary transition-colors">{profile.full_name}</Link><span className="material-symbols-outlined text-[10px]">chevron_right</span></>}
        <span className="text-primary">Phiên {new Date(session.created_at).toLocaleDateString('vi-VN')}</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Chi tiết phiên trị liệu</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-outline-variant text-primary font-semibold hover:bg-surface-container-high transition-all active:scale-95">
          <span className="material-symbols-outlined">download</span> 📥 Xuất CSV phiên này
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng điểm', value: session.total_score, unit: '/ 100', icon: 'analytics', color: 'primary' },
          { label: 'Số lần bắt', value: session.total_catches, unit: '', icon: 'touch_app', color: 'on-surface' },
          { label: 'Góc gập TB', value: `${session.avg_angle_deg?.toFixed(0)}`, unit: '°', icon: 'straighten', color: 'tertiary' },
          { label: 'Độ rung TB', value: session.avg_tremor?.toFixed(1), unit: 'mm/s', icon: 'vibration', color: 'secondary' },
        ].map(c => (
          <div key={c.label} className="bg-surface-container p-5 rounded-xl flex flex-col gap-4 shadow-lg transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">{c.label}</span>
              <div className={`p-2 bg-${c.color}/10 rounded-lg`}><span className={`material-symbols-outlined text-${c.color} text-xl`}>{c.icon}</span></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black text-${c.color} tracking-tighter`}>{c.value}</span>
              {c.unit && <span className="text-on-surface-variant text-sm font-medium">{c.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Conclusion Banner */}
      <div className={`mb-8 w-full glass-panel ${normal ? 'bg-tertiary/20' : 'bg-error/20'} rounded-xl py-4 px-6 flex items-center justify-center border-l-4 ${normal ? 'border-tertiary' : 'border-error'}`}>
        <span className={`${normal ? 'text-tertiary' : 'text-error'} text-lg font-black tracking-widest uppercase`}>
          {normal ? '🟢 KẾT LUẬN: TAY HOẠT ĐỘNG ỔN ĐỊNH' : `🔴 ${session.clinical_conclusion}`}
        </span>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-container p-6 rounded-2xl shadow-xl">
          <h3 className="font-bold text-on-surface mb-1">Góc gập theo thời gian</h3>
          <p className="text-xs text-on-surface-variant mb-4">Giây: 0 – 60</p>
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={angleData}>
              <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#81ecff" stopOpacity={0.2} /><stop offset="100%" stopColor="#81ecff" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#23262e" />
              <XAxis dataKey="t" tick={{ fill: '#aaaab3', fontSize: 10 }} />
              <YAxis tick={{ fill: '#aaaab3', fontSize: 10 }} />
              <ReferenceLine y={95} stroke="#ff716c" strokeDasharray="4 2" label={{ value: 'REF: 95°', fill: '#ff716c', fontSize: 10, position: 'right' }} />
              <Tooltip contentStyle={{ backgroundColor: '#171921', border: '1px solid #46484f', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="angle" stroke="#81ecff" strokeWidth={2} fill="url(#ga)" dot={{ r: 3, fill: '#81ecff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-container p-6 rounded-2xl shadow-xl">
          <h3 className="font-bold text-on-surface mb-1">Độ rung theo thời gian</h3>
          <p className="text-xs text-on-surface-variant mb-4">Phân tích biên độ dao động</p>
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={tremorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23262e" />
              <XAxis dataKey="t" tick={{ fill: '#aaaab3', fontSize: 10 }} />
              <YAxis tick={{ fill: '#aaaab3', fontSize: 10 }} />
              <ReferenceLine y={25} stroke="#46484f" strokeDasharray="2 2" label={{ value: 'MAX', fill: '#aaaab3', fontSize: 10 }} />
              <ReferenceLine y={12} stroke="#46484f" strokeDasharray="2 2" label={{ value: 'MID', fill: '#aaaab3', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#171921', border: '1px solid #46484f', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="tremor" stroke="#10d5ff" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-container p-6 rounded-2xl shadow-xl lg:col-span-2">
          <h3 className="font-bold text-on-surface mb-1">Tiến trình điểm số</h3>
          <p className="text-xs text-on-surface-variant mb-4">Tích lũy theo hiệu suất vận động</p>
          <ResponsiveContainer width="100%" height={192}>
            <AreaChart data={scoreData}>
              <defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e3fd" stopOpacity={0.4} /><stop offset="100%" stopColor="#00e3fd" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#23262e" />
              <XAxis dataKey="catch" tick={{ fill: '#aaaab3', fontSize: 10 }} />
              <YAxis tick={{ fill: '#aaaab3', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#171921', border: '1px solid #46484f', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#81ecff" strokeWidth={4} fill="url(#gs)" strokeLinejoin="round" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-surface-container rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 flex items-center justify-between bg-surface-container-high">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">list_alt</span>
            <h3 className="font-bold text-on-surface">Bảng sự kiện thô</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-container-highest/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Thời điểm (s)</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Điểm tích lũy</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Góc gập TB (°)</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Độ rung</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Trạng thái</th>
            </tr></thead>
            <tbody className="divide-y divide-outline-variant/10">
              {visibleEvents.map(e => {
                const warn = (e.avg_flexion_angle_deg || 0) < 95 || (e.tremor_value || 0) > 12;
                return (
                  <tr key={e.id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-6 py-4 font-mono text-primary-fixed">{e.time_offset_s.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold">{e.cumulative_score}</td>
                    <td className={`px-6 py-4 ${(e.avg_flexion_angle_deg || 0) < 95 ? 'text-error' : 'text-tertiary'}`}>{e.avg_flexion_angle_deg?.toFixed(0)}°</td>
                    <td className={`px-6 py-4 ${(e.tremor_value || 0) > 12 ? 'text-error' : ''}`}>{e.tremor_value?.toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${warn ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'}`}>
                        {warn ? 'CẢNH BÁO' : 'ỔN ĐỊNH'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {events.length > 10 && !showAllEvents && (
          <div className="p-4 flex justify-center border-t border-outline-variant/10">
            <button onClick={() => setShowAllEvents(true)} className="text-xs font-bold text-primary uppercase hover:underline">
              Xem thêm {events.length - 10} sự kiện khác
            </button>
          </div>
        )}
      </div>
    </>
  );
}
