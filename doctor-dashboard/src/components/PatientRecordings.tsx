import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Recording { id: string; storage_path: string; public_url: string|null; duration_seconds: number|null; file_size_bytes: number|null; notes: string|null; doctor_feedback: string|null; created_at: string; }

export default function PatientRecordings({ patientId }: { patientId: string }) {
  const [recs, setRecs] = useState<Recording[]>([]);
  const [feedback, setFeedback] = useState<Record<string,string>>({});

  useEffect(() => { fetch(); }, [patientId]);

  async function fetch() {
    const { data } = await supabase.from('exercise_recordings').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    setRecs(data ?? []);
    const fb: Record<string,string> = {};
    (data ?? []).forEach(r => { fb[r.id] = r.doctor_feedback || ''; });
    setFeedback(fb);
  }

  async function saveFeedback(id: string) {
    await supabase.from('exercise_recordings').update({ doctor_feedback: feedback[id] }).eq('id', id);
  }

  function formatSize(b: number|null) {
    if (!b) return '?';
    if (b < 1024*1024) return (b/1024).toFixed(0) + ' KB';
    return (b/(1024*1024)).toFixed(1) + ' MB';
  }

  async function getVideoUrl(path: string) {
    const { data } = await supabase.storage.from('exercise-recordings').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  return (
    <div>
      <h3 className="font-bold text-on-surface mb-4">Video tập luyện của bệnh nhân</h3>
      {recs.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant">Bệnh nhân chưa ghi lại video tập luyện nào.</p>
      ) : (
        <div className="space-y-4">
          {recs.map(r => (
            <div key={r.id} className="bg-surface-container-high p-5 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => getVideoUrl(r.storage_path)} className="p-3 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-primary text-2xl">play_circle</span>
                  </button>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{new Date(r.created_at).toLocaleString('vi-VN')}</p>
                    <div className="flex gap-3 text-xs text-on-surface-variant mt-1">
                      {r.duration_seconds && <span>⏱ {r.duration_seconds}s</span>}
                      <span>📦 {formatSize(r.file_size_bytes)}</span>
                    </div>
                    {r.notes && <p className="text-xs text-on-surface-variant mt-1">📝 {r.notes}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Phản hồi của bác sĩ</label>
                <div className="flex gap-2">
                  <input value={feedback[r.id]||''} onChange={e => setFeedback({...feedback, [r.id]: e.target.value})}
                    className="flex-1 bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary" placeholder="Nhập phản hồi..." />
                  <button onClick={() => saveFeedback(r.id)} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20">Lưu</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
