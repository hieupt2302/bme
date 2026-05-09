import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface Plan { id: string; title: string; status: string; start_date: string; end_date: string|null; notes: string|null; treatment_exercises: { id: string; sets_per_day: number; exercises: { title: string; video_url: string|null; difficulty: string } }[]; }

export default function PatientTreatment({ patientId }: { patientId: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => { fetch(); }, [patientId]);

  async function fetch() {
    const { data } = await supabase.from('treatment_plans').select('*, treatment_exercises(id, sets_per_day, exercises(title, video_url, difficulty))').eq('patient_id', patientId).order('created_at', { ascending: false });
    setPlans((data as Plan[]) ?? []);
  }

  const stMap: Record<string,{label:string;color:string}> = { active:{label:'Đang hoạt động',color:'tertiary'}, paused:{label:'Tạm dừng',color:'secondary'}, completed:{label:'Hoàn thành',color:'on-surface-variant'} };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-on-surface">Phác đồ điều trị</h3>
        <Link to="/treatment-plans" className="text-primary text-sm font-bold hover:underline">Quản lý phác đồ →</Link>
      </div>
      {plans.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-2">assignment</span>
          <p className="text-on-surface-variant">Chưa có phác đồ. <Link to="/treatment-plans" className="text-primary hover:underline">Tạo phác đồ mới</Link></p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(p => {
            const st = stMap[p.status] || stMap.active;
            return (
              <div key={p.id} className="bg-surface-container-high p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-bold text-on-surface">{p.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${st.color}/10 text-${st.color}`}>{st.label}</span>
                </div>
                <div className="flex gap-4 text-xs text-on-surface-variant mb-3">
                  <span>📅 {p.start_date}{p.end_date ? ` → ${p.end_date}` : ''}</span>
                  <span>💪 {p.treatment_exercises.length} bài tập</span>
                </div>
                {p.notes && <p className="text-sm text-on-surface-variant mb-3">{p.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  {p.treatment_exercises.map(te => (
                    <div key={te.id} className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg">
                      <span className="text-sm font-medium text-on-surface">{(te.exercises as unknown as {title:string}).title}</span>
                      <span className="text-xs text-on-surface-variant">×{te.sets_per_day}/ngày</span>
                      {(te.exercises as unknown as {video_url:string|null}).video_url && (
                        <a href={(te.exercises as unknown as {video_url:string}).video_url} target="_blank" rel="noopener noreferrer" className="text-primary"><span className="material-symbols-outlined text-sm">play_circle</span></a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
