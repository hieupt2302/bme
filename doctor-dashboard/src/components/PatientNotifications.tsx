import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notif { id: string; type: string; title: string; content: string|null; video_url: string|null; is_read: boolean; created_at: string; }

export default function PatientNotifications({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'message', title: '', content: '', video_url: '' });

  useEffect(() => { fetch(); }, [patientId]);

  async function fetch() {
    const { data } = await supabase.from('notifications').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    setNotifs(data ?? []);
  }

  async function send() {
    if (!form.title.trim()) return;
    await supabase.from('notifications').insert({
      patient_id: patientId, doctor_id: user!.id, type: form.type,
      title: form.title, content: form.content || null, video_url: form.video_url || null,
    });
    setForm({ type: 'message', title: '', content: '', video_url: '' });
    setShowForm(false);
    fetch();
  }

  const icons: Record<string,string> = { video: 'play_circle', reminder: 'alarm', message: 'mail', exercise: 'fitness_center' };
  const labels: Record<string,string> = { video: 'Video', reminder: 'Nhắc nhở', message: 'Tin nhắn', exercise: 'Bài tập' };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-on-surface">Thông báo đã gửi</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-all">
          <span className="material-symbols-outlined text-sm">send</span>Gửi thông báo
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-container-high p-5 rounded-xl mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Loại</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary">
                <option value="message">Tin nhắn</option>
                <option value="video">Video hướng dẫn</option>
                <option value="reminder">Nhắc nhở</option>
                <option value="exercise">Bài tập</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Tiêu đề *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary" placeholder="Tiêu đề..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Nội dung</label>
            <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={2} className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary" placeholder="Nội dung..." />
          </div>
          {form.type === 'video' && (
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Link Video (YouTube)</label>
              <input value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary" placeholder="https://youtube.com/..." />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold">Hủy</button>
            <button onClick={send} disabled={!form.title.trim()} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold disabled:opacity-50">Gửi</button>
          </div>
        </div>
      )}

      {notifs.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant">Chưa gửi thông báo nào.</p>
      ) : (
        <div className="space-y-3">
          {notifs.map(n => (
            <div key={n.id} className="bg-surface-container-high p-4 rounded-xl flex gap-4">
              <div className={`p-2 rounded-lg bg-primary/10 h-fit`}><span className="material-symbols-outlined text-primary">{icons[n.type]||'mail'}</span></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-surface-container rounded text-on-surface-variant">{labels[n.type]||n.type}</span>
                  <span className={`text-[10px] ${n.is_read ? 'text-tertiary' : 'text-secondary'}`}>{n.is_read ? '✓ Đã đọc' : '• Chưa đọc'}</span>
                </div>
                <h4 className="font-bold text-on-surface text-sm">{n.title}</h4>
                {n.content && <p className="text-sm text-on-surface-variant mt-1">{n.content}</p>}
                {n.video_url && <a href={n.video_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs mt-1 inline-flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-xs">play_circle</span>Xem video</a>}
                <p className="text-xs text-outline mt-2">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
