import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import PatientNotifications from '../components/PatientNotifications';
import PatientRecordings from '../components/PatientRecordings';
import PatientTreatment from '../components/PatientTreatment';

interface Profile { id: string; full_name: string; email: string; role: string; diagnosis_note: string | null; created_at: string; }
interface SRow { id: string; total_score: number; total_catches: number; avg_angle_deg: number; avg_tremor: number; max_tremor: number; clinical_conclusion: string; created_at: string; }

type Tab = 'overview' | 'treatment' | 'notifications' | 'recordings';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Tổng quan', icon: 'analytics' },
  { key: 'treatment', label: 'Phác đồ', icon: 'assignment' },
  { key: 'notifications', label: 'Thông báo', icon: 'notifications' },
  { key: 'recordings', label: 'Video tập', icon: 'videocam' },
];

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<SRow[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [chartRange, setChartRange] = useState<'7d'|'30d'|'all'>('all');

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(pid: string) {
    const [p, s] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', pid).single(),
      supabase.from('sessions').select('*').eq('patient_id', pid).order('created_at', { ascending: true }),
    ]);
    setProfile(p.data); setNote(p.data?.diagnosis_note || '');
    setSessions(s.data ?? []); setLoading(false);
  }

  async function saveNote() { if (!id) return; setSaving(true); await supabase.from('profiles').update({ diagnosis_note: note }).eq('id', id); setSaving(false); }

  function exportCSV() {
    if (!sessions.length) return;
    const h = ['Thời gian','Điểm','Số lần bắt','Góc gập TB','Độ rung TB','Độ rung max','Kết luận'];
    const rows = sessions.map(s => [new Date(s.created_at).toLocaleString('vi-VN'),s.total_score,s.total_catches,s.avg_angle_deg?.toFixed(1),s.avg_tremor?.toFixed(2),s.max_tremor?.toFixed(2),s.clinical_conclusion]);
    const csv = [h.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${profile?.full_name||'patient'}_sessions.csv`; a.click();
  }

  const isNorm = (c: string) => c === 'TAY HOẠT ĐỘNG ỔN ĐỊNH';
  const initials = (n: string) => n.split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>;
  if (!profile) return <div className="text-center py-20 text-on-surface-variant">Không tìm thấy bệnh nhân.</div>;

  const tot = sessions.length;
  const avgS = tot ? sessions.reduce((a,s)=>a+s.total_score,0)/tot : 0;
  const avgA = tot ? sessions.reduce((a,s)=>a+(s.avg_angle_deg||0),0)/tot : 0;
  const abnorm = sessions.filter(s=>!isNorm(s.clinical_conclusion)).length;

  // Filter chart data by range
  const now = Date.now();
  const rangeMs = chartRange === '7d' ? 7*86400000 : chartRange === '30d' ? 30*86400000 : Infinity;
  const filteredSessions = sessions.filter(s => now - new Date(s.created_at).getTime() < rangeMs);
  const chart = filteredSessions.map(s=>({ date: new Date(s.created_at).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}), angle: +(s.avg_angle_deg||0).toFixed(1), tremor: +(s.avg_tremor||0).toFixed(2) }));

  return (<>
    <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-4 uppercase tracking-wider">
      <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
      <span className="material-symbols-outlined text-[10px]">chevron_right</span>
      <Link to="/patients" className="hover:text-primary transition-colors">Bệnh nhân</Link>
      <span className="material-symbols-outlined text-[10px]">chevron_right</span>
      <span className="text-primary">{profile.full_name}</span>
    </nav>

    {/* Profile card */}
    <div className="bg-surface-container rounded-xl p-6 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl font-black border border-primary/30 text-primary">{initials(profile.full_name)}</div>
        <div>
          <h2 className="text-2xl font-bold text-on-surface">{profile.full_name}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{profile.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">Bệnh nhân</span>
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ghi chú chẩn đoán</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary" placeholder="Nhập ghi chú..."/>
        <button onClick={saveNote} disabled={saving} className="px-4 py-2 rounded-lg border border-outline-variant text-primary font-semibold text-sm hover:bg-surface-container-high transition-all active:scale-95 disabled:opacity-50">{saving?'Đang lưu...':'Lưu ghi chú'}</button>
      </div>
    </div>

    {/* Tab navigation */}
    <div className="flex gap-1 bg-surface-container rounded-xl p-1 mb-6">
      {TABS.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center ${tab === t.key ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined text-sm">{t.icon}</span>{t.label}
        </button>
      ))}
    </div>

    {/* Tab content */}
    {tab === 'overview' && (<>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{l:'Tổng phiên tập',v:tot,i:'event_note',c:'primary'},{l:'Điểm trung bình',v:avgS.toFixed(0),i:'analytics',c:'secondary'},{l:'Góc gập TB',v:`${avgA.toFixed(0)}°`,i:'straighten',c:'tertiary'},{l:'Phiên bất thường',v:abnorm,i:'warning',c:'error'}].map(s=>(
          <div key={s.l} className="bg-surface-container p-5 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">{s.l}</span>
              <div className={`p-2 bg-${s.c}/10 rounded-lg`}><span className={`material-symbols-outlined text-${s.c}`}>{s.i}</span></div>
            </div>
            <h3 className="text-3xl font-black text-on-surface tracking-tight">{s.v}</h3>
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-${s.c} to-transparent opacity-50`}/>
          </div>
        ))}
      </section>

      {/* Chart with range filter */}
      {chart.length > 1 && (
        <div className="bg-surface-container p-6 rounded-2xl shadow-xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-on-surface">Tiến trình phục hồi</h3>
            <div className="flex gap-1">
              {(['7d','30d','all'] as const).map(r => (
                <button key={r} onClick={() => setChartRange(r)} className={`px-3 py-1 rounded text-xs font-bold ${chartRange===r ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {r==='7d'?'7 ngày':r==='30d'?'30 ngày':'Tất cả'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23262e"/>
              <XAxis dataKey="date" tick={{fill:'#aaaab3',fontSize:11}}/>
              <YAxis yAxisId="left" tick={{fill:'#aaaab3',fontSize:11}}/>
              <YAxis yAxisId="right" orientation="right" tick={{fill:'#aaaab3',fontSize:11}}/>
              <Tooltip contentStyle={{backgroundColor:'#171921',border:'1px solid #46484f',borderRadius:8}}/>
              <Legend/>
              <ReferenceLine yAxisId="left" y={95} stroke="#f44" strokeDasharray="5 5" label={{value:'Ngưỡng góc',fill:'#f44',fontSize:10}}/>
              <ReferenceLine yAxisId="right" y={12} stroke="#ff9800" strokeDasharray="5 5" label={{value:'Ngưỡng rung',fill:'#ff9800',fontSize:10}}/>
              <Line yAxisId="left" type="monotone" dataKey="angle" name="Góc gập (°)" stroke="#81ecff" strokeWidth={2} dot={{r:3}}/>
              <Line yAxisId="right" type="monotone" dataKey="tremor" name="Độ rung" stroke="#10d5ff" strokeWidth={2} dot={{r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sessions table */}
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 flex justify-between items-center bg-surface-container-high">
          <h2 className="text-lg font-bold text-on-surface">Lịch sử phiên tập</h2>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-primary font-semibold text-sm hover:bg-surface-container-high transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm">download</span>Xuất CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-surface-container-highest/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Thời gian</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">Điểm</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">Bắt</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Góc gập</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Độ rung</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Đánh giá</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant"></th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {sessions.length===0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">Chưa có phiên tập nào.</td></tr>}
              {[...sessions].reverse().map(s=>{
                const n = isNorm(s.clinical_conclusion);
                return (<tr key={s.id} className="hover:bg-surface-bright transition-colors">
                  <td className="px-6 py-4 text-sm">{new Date(s.created_at).toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-4 text-center"><span className={`font-mono font-bold ${n?'text-tertiary':'text-error'}`}>{s.total_score}</span></td>
                  <td className="px-6 py-4 text-center text-sm font-mono">{s.total_catches}</td>
                  <td className="px-6 py-4 text-sm font-mono">{s.avg_angle_deg?.toFixed(0)}°</td>
                  <td className="px-6 py-4 text-sm font-mono">{s.avg_tremor?.toFixed(1)}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${n?'bg-tertiary/10 text-tertiary border border-tertiary/20':'bg-error/10 text-error border border-error/20'}`}>{n?'Bình thường':'BẤT THƯỜNG'}</span></td>
                  <td className="px-6 py-4 text-right"><Link to={`/sessions/${s.id}`} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors inline-block"><span className="material-symbols-outlined text-lg">open_in_new</span></Link></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>)}

    {tab === 'treatment' && <PatientTreatment patientId={id!} />}
    {tab === 'notifications' && <PatientNotifications patientId={id!} />}
    {tab === 'recordings' && <PatientRecordings patientId={id!} />}
  </>);
}
