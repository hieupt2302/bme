import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Exercise {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  exercise_type: string;
  difficulty: string;
  duration_seconds: number;
  created_at: string;
  created_by: string | null;
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy: { label: 'Dễ', color: 'tertiary' },
  medium: { label: 'Trung bình', color: 'secondary' },
  hard: { label: 'Khó', color: 'error' },
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
  return m ? m[1] : null;
}

export default function ExerciseLibraryPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', video_url: '', exercise_type: 'hand_rehab',
    difficulty: 'medium', duration_seconds: 60,
  });

  useEffect(() => { fetchExercises(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? exercises.filter(e => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)) : exercises);
  }, [search, exercises]);

  async function fetchExercises() {
    const { data } = await supabase.from('exercises').select('*').order('created_at', { ascending: false });
    setExercises(data ?? []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ title: '', description: '', video_url: '', exercise_type: 'hand_rehab', difficulty: 'medium', duration_seconds: 60 });
    setShowModal(true);
  }

  function openEdit(ex: Exercise) {
    setEditing(ex);
    setForm({
      title: ex.title, description: ex.description ?? '', video_url: ex.video_url ?? '',
      exercise_type: ex.exercise_type, difficulty: ex.difficulty, duration_seconds: ex.duration_seconds,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editing) {
      await supabase.from('exercises').update({ ...form }).eq('id', editing.id);
    } else {
      await supabase.from('exercises').insert({ ...form, created_by: user?.id });
    }
    setShowModal(false);
    fetchExercises();
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa bài tập này?')) return;
    await supabase.from('exercises').delete().eq('id', id);
    fetchExercises();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Thư Viện Bài Tập</h1>
          <p className="text-on-surface-variant">{exercises.length} bài tập đã tạo</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
          <span className="material-symbols-outlined text-sm">add</span>
          Tạo bài tập mới
        </button>
      </header>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-sm">search</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bài tập..."
          className="w-full bg-surface-container-low border-0 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary transition-all text-on-surface placeholder:text-outline" />
      </div>

      {/* Exercise Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-4">fitness_center</span>
          <p className="text-on-surface-variant">Chưa có bài tập nào. Hãy tạo bài tập đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(ex => {
            const diff = DIFFICULTY_MAP[ex.difficulty] || DIFFICULTY_MAP.medium;
            const ytId = ex.video_url ? getYouTubeId(ex.video_url) : null;
            return (
              <div key={ex.id} className="bg-surface-container rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 flex flex-col">
                {/* Video Thumbnail */}
                {ytId ? (
                  <div className="relative aspect-video bg-surface-container-highest">
                    <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={ex.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <a href={ex.video_url!} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">videocam_off</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-on-surface text-lg leading-tight">{ex.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${diff.color}/10 text-${diff.color} border border-${diff.color}/20`}>
                      {diff.label}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 flex-1">{ex.description || 'Chưa có mô tả'}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">timer</span>
                        {ex.duration_seconds}s
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">category</span>
                        {ex.exercise_type}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(ex)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDelete(ex.id)} className="p-1.5 hover:bg-error/10 rounded-lg text-error transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-high rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-outline-variant/20" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-on-surface mb-6">{editing ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tên bài tập *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder:text-outline"
                  placeholder="VD: Bài tập gập ngón tay" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder:text-outline"
                  placeholder="Mô tả chi tiết bài tập..." />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Link Video (YouTube)</label>
                <input type="url" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder:text-outline"
                  placeholder="https://www.youtube.com/watch?v=..." />
                {/* YouTube Preview */}
                {form.video_url && getYouTubeId(form.video_url) && (
                  <div className="mt-2 rounded-lg overflow-hidden aspect-video">
                    <iframe src={`https://www.youtube.com/embed/${getYouTubeId(form.video_url)}`}
                      className="w-full h-full" allowFullScreen title="Video preview" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Độ khó</label>
                  <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary">
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Loại</label>
                  <select value={form.exercise_type} onChange={e => setForm({ ...form, exercise_type: e.target.value })}
                    className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary">
                    <option value="hand_rehab">Phục hồi bàn tay</option>
                    <option value="finger_flex">Gập ngón tay</option>
                    <option value="grip_strength">Lực nắm</option>
                    <option value="coordination">Phối hợp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Thời lượng (s)</label>
                  <input type="number" value={form.duration_seconds} onChange={e => setForm({ ...form, duration_seconds: parseInt(e.target.value) || 60 })}
                    className="w-full bg-surface-container-low border-0 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary" min={10} max={300} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-all">Hủy</button>
              <button onClick={handleSave} disabled={!form.title.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                {editing ? 'Cập nhật' : 'Tạo bài tập'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
