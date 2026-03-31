import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  latestSession?: {
    total_score: number;
    clinical_conclusion: string;
    created_at: string;
  };
}

export default function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filtered, setFiltered] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'normal' | 'abnormal'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPatients(); }, []);
  useEffect(() => { applyFilter(); }, [search, filter, patients]);

  async function fetchPatients() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('created_at', { ascending: false });

    if (!profiles) { setLoading(false); return; }

    // Fetch latest session for each patient
    const enriched: Patient[] = await Promise.all(
      profiles.map(async (p) => {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('total_score, clinical_conclusion, created_at')
          .eq('patient_id', p.id)
          .order('created_at', { ascending: false })
          .limit(1);
        return { ...p, latestSession: sessions?.[0] ?? undefined };
      })
    );

    setPatients(enriched);
    setLoading(false);
  }

  function applyFilter() {
    let result = patients;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.full_name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
    }
    if (filter === 'normal') {
      result = result.filter(p => p.latestSession?.clinical_conclusion === 'TAY HOẠT ĐỘNG ỔN ĐỊNH');
    } else if (filter === 'abnormal') {
      result = result.filter(p => p.latestSession && p.latestSession.clinical_conclusion !== 'TAY HOẠT ĐỘNG ỔN ĐỊNH');
    }
    setFiltered(result);
  }

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
  }

  function isNormal(conclusion?: string) {
    return !conclusion || conclusion === 'TAY HOẠT ĐỘNG ỔN ĐỊNH';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Danh Sách Bệnh Nhân</h1>
          <p className="text-on-surface-variant">{patients.length} bệnh nhân đã đăng ký</p>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full bg-surface-container-low border-0 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary transition-all text-on-surface placeholder:text-outline"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'normal', 'abnormal'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/10'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'normal' ? 'Bình thường' : 'Cần chú ý'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bệnh nhân</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Phiên gần nhất</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">Điểm gần nhất</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Kết quả</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-4">person_search</span>
                    <p className="text-on-surface-variant">Không tìm thấy bệnh nhân nào</p>
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const normal = isNormal(p.latestSession?.clinical_conclusion);
                return (
                  <tr key={p.id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/patients/${p.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold border border-white/5">
                          {getInitials(p.full_name)}
                        </div>
                        <span className="text-sm font-semibold">{p.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{p.email || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {p.latestSession
                        ? new Date(p.latestSession.created_at).toLocaleDateString('vi-VN')
                        : <span className="text-on-surface-variant">Chưa có</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.latestSession
                        ? <span className={`text-sm font-mono font-bold ${normal ? 'text-tertiary' : 'text-error'}`}>{p.latestSession.total_score}</span>
                        : <span className="text-on-surface-variant">—</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      {p.latestSession ? (
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          normal
                            ? 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                            : 'bg-error/10 text-error border border-error/20'
                        }`}>
                          {normal ? 'Bình thường' : 'BẤT THƯỜNG'}
                        </span>
                      ) : <span className="text-on-surface-variant text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/patients/${p.id}`} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors inline-block">
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
    </>
  );
}
