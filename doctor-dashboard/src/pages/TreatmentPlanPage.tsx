import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  notes: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  profiles?: { full_name: string };
  treatment_exercises?: { id: string; exercise_id: string; order_index: number; sets_per_day: number; exercises?: { title: string; difficulty: string } }[];
}

interface Patient {
  id: string;
  full_name: string;
}

interface Exercise {
  id: string;
  title: string;
  difficulty: string;
  duration_seconds: number;
}

interface PlanExerciseForm {
  exercise_id: string;
  sets_per_day: number;
  notes: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  active: { label: 'Đang hoạt động', color: 'tertiary', icon: 'play_circle' },
  paused: { label: 'Tạm dừng', color: 'secondary', icon: 'pause_circle' },
  completed: { label: 'Hoàn thành', color: 'on-surface-variant', icon: 'check_circle' },
};

export default function TreatmentPlanPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');

  // Form
  const [form, setForm] = useState({ patient_id: '', title: '', notes: '', start_date: new Date().toISOString().split('T')[0], end_date: '' });
  const [planExercises, setPlanExercises] = useState<PlanExerciseForm[]>([]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [plansRes, patientsRes, exRes] = await Promise.all([
      supabase.from('treatment_plans').select('*, profiles!treatment_plans_patient_id_fkey(full_name), treatment_exercises(id, exercise_id, order_index, sets_per_day, exercises(title, difficulty))').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('role', 'patient').order('full_name'),
      supabase.from('exercises').select('id, title, difficulty, duration_seconds').order('title'),
    ]);
    setPlans((plansRes.data as Plan[]) ?? []);
    setPatients(patientsRes.data ?? []);
    setExercises(exRes.data ?? []);
    setLoading(false);
  }

  function openCreate() {
    setForm({ patient_id: '', title: '', notes: '', start_date: new Date().toISOString().split('T')[0], end_date: '' });
    setPlanExercises([]);
    setShowModal(true);
  }

  function addExercise() {
    if (exercises.length === 0) return;
    setPlanExercises([...planExercises, { exercise_id: exercises[0].id, sets_per_day: 3, notes: '' }]);
  }

  function removeExercise(idx: number) {
    setPlanExercises(planExercises.filter((_, i) => i !== idx));
  }

  function updateExercise(idx: number, field: string, value: string | number) {
    const updated = [...planExercises];
    (updated[idx] as unknown as Record<string, string | number>)[field] = value;
    setPlanExercises(updated);
  }

  async function handleCreate() {
    if (!form.patient_id || !form.title.trim()) return;
    const { data: plan, error } = await supabase.from('treatment_plans').insert({
      patient_id: form.patient_id, doctor_id: user!.id, title: form.title, notes: form.notes || null,
      start_date: form.start_date, end_date: form.end_date || null,
    }).select().single();

    if (error || !plan) { console.error(error); return; }

    if (planExercises.length > 0) {
      const rows = planExercises.map((pe, i) => ({
        plan_id: plan.id, exercise_id: pe.exercise_id, order_index: i, sets_per_day: pe.sets_per_day, notes: pe.notes || null,
      }));
      await supabase.from('treatment_exercises').insert(rows);
    }

    // Send notification to patient
    await supabase.from('notifications').insert({
      patient_id: form.patient_id, doctor_id: user!.id, type: 'exercise',
      title: 'Phác đồ điều trị mới', content: `Bác sĩ đã tạo phác đồ "${form.title}" cho bạn. Hãy kiểm tra bài tập hôm nay!`,
    });

    setShowModal(false);
    fetchAll();
  }

  async function updateStatus(planId: string, newStatus: string) {
    await supabase.from('treatment_plans').update({ status: newStatus }).eq('id', planId);
    fetchAll();
  }

  const filteredPlans = statusFilter === 'all' ? plans : plans.filter(p => p.status === statusFilter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Phác Đồ Điều Trị</h1>
          <p className="text-on-surface-variant">{plans.length} phác đồ đã tạo</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
          <span className="material-symbols-outlined text-sm">add</span>
          Tạo phác đồ mới
        </button>
      </header>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'paused', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === f ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/10'}`}>
            {f === 'all' ? 'Tất cả' : STATUS_MAP[f]?.label}
          </button>
        ))}
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-4">assignment</span>
          <p className="text-on-surface-variant">Chưa có phác đồ nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map(plan => {
            const st = STATUS_MAP[plan.status] || STATUS_MAP.active;
            const patientName = (plan.profiles as unknown as { full_name: string })?.full_name ?? 'N/A';
            const exList = plan.treatment_exercises ?? [];
            return (
              <div key={plan.id} className="bg-surface-container rounded-xl p-6 shadow-lg transition-all hover:shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`material-symbols-outlined text-${st.color}`}>{st.icon}</span>
                      <h3 className="text-lg font-bold text-on-surface">{plan.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${st.color}/10 text-${st.color} border border-${st.color}/20`}>{st.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                      <Link to={`/patients/${plan.patient_id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">person</span>
                        {patientName}
                      </Link>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {plan.start_date} {plan.end_date ? `→ ${plan.end_date}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">fitness_center</span>
                        {exList.length} bài tập
                      </span>
                    </div>
                    {plan.notes && <p className="text-sm text-on-surface-variant mt-2 line-clamp-1">{plan.notes}</p>}

                    {/* Exercise chips */}
                    {exList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {exList.map(te => (
                          <span key={te.id} className="px-2 py-1 bg-surface-container-high rounded text-xs text-on-surface font-medium">
                            {(te.exercises as unknown as { title: string })?.title ?? '?'} × {te.sets_per_day}/ngày
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {plan.status === 'active' && (
                      <>
                        <button onClick={() => updateStatus(plan.id, 'paused')} className="px-3 py-1.5 rounded-lg border border-outline-variant text-secondary text-xs font-bold hover:bg-secondary/10 transition-all">Tạm dừng</button>
                        <button onClick={() => updateStatus(plan.id, 'completed')} className="px-3 py-1.5 rounded-lg border border-outline-variant text-tertiary text-xs font-bold hover:bg-tertiary/10 transition-all">Hoàn thành</button>
                      </>
                    )}
                    {plan.status === 'paused' && (
                      <button onClick={() => updateStatus(plan.id, 'active')} className="px-3 py-1.5 rounded-lg border border-outline-variant text-tertiary text-xs font-bold hover:bg-tertiary/10 transition-all">Tiếp tục</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-high rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-on-surface mb-6">Tạo phác đồ mới</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Bệnh nhân *</label>
                <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary">
                  <option value="">— Chọn bệnh nhân —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tên phác đồ *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder:text-outline"
                  placeholder="VD: Phục hồi sau đột quỵ - Giai đoạn 1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Ngày bắt đầu</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Ngày kết thúc</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Ghi chú</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder:text-outline"
                  placeholder="Ghi chú về phác đồ..." />
              </div>

              {/* Exercise Assignments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Bài tập trong phác đồ</label>
                  <button onClick={addExercise} className="flex items-center gap-1 text-primary text-xs font-bold hover:underline">
                    <span className="material-symbols-outlined text-xs">add</span> Thêm bài tập
                  </button>
                </div>

                {planExercises.length === 0 && (
                  <p className="text-sm text-on-surface-variant py-4 text-center bg-surface-container-low rounded-lg">Chưa có bài tập. Nhấn "Thêm bài tập" để bắt đầu.</p>
                )}

                <div className="space-y-3">
                  {planExercises.map((pe, i) => (
                    <div key={i} className="flex items-center gap-3 bg-surface-container-low p-3 rounded-lg">
                      <span className="text-xs font-bold text-on-surface-variant w-5 text-center">{i + 1}</span>
                      <select value={pe.exercise_id} onChange={e => updateExercise(i, 'exercise_id', e.target.value)}
                        className="flex-1 bg-surface-container border-0 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary">
                        {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.title} ({ex.difficulty})</option>)}
                      </select>
                      <div className="flex items-center gap-1">
                        <input type="number" value={pe.sets_per_day} onChange={e => updateExercise(i, 'sets_per_day', parseInt(e.target.value) || 1)}
                          className="w-14 bg-surface-container border-0 rounded-lg px-2 py-2 text-sm text-on-surface text-center focus:ring-1 focus:ring-primary" min={1} max={10} />
                        <span className="text-xs text-on-surface-variant">/ngày</span>
                      </div>
                      <button onClick={() => removeExercise(i)} className="p-1 text-error hover:bg-error/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-all">Hủy</button>
              <button onClick={handleCreate} disabled={!form.patient_id || !form.title.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                Tạo phác đồ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
