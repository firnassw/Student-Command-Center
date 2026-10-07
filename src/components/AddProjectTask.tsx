import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  name?: string;
  title?: string;
  course_id?: string;
}

export default function AddProjectTask() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [projectProgress, setProjectProgress] = useState(0);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProjectContext(projectId);
    }
  }, [projectId]);

  const fetchProjectContext = async (id: string) => {
    try {
      // Fetch project details
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, name, title, course_id,
          tasks(status)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setProject(data as any);
        
        // Calculate progress just to show it
        const tasks = data.tasks as any[] || [];
        if (tasks.length > 0) {
          const completedCount = tasks.filter(t => t.status === 'completed').length;
          setProjectProgress(Math.round((completedCount / tasks.length) * 100));
        }
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Judul task tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('project_tasks')
        .insert({
          title: title.trim(),
          status: isCompleted ? 'completed' : 'todo',
          project_id: projectId
        });

      if (insertError) throw insertError;
      
      navigate(-1);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan task proyek');
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectName = project?.name || project?.title || 'Memuat...';

  return (
    <div className="bg-[#F1F5F9] min-h-screen w-full flex flex-col font-sans text-neutral-900">
      
      {/* Header / App Bar */}
      <header className="h-16 px-5 flex items-center justify-center border-b border-neutral-200 bg-white z-10 sticky top-0 shadow-sm">
        <div className="w-full max-w-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-neutral-900" 
              aria-label="Kembali"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="text-[19px] font-heading font-bold text-neutral-900 tracking-tight">Tambah Task Proyek</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSubmitting || isLoading}
            className="text-[13px] font-heading font-bold text-neutral-900 px-3 py-1.5 rounded-full hover:bg-neutral-100 active:scale-95 transition-all tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN'}
          </button>
        </div>
      </header>

      {/* Scrollable Form Body */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-6 pb-32 space-y-6">

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-[16px] text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Kartu Konteks Proyek */}
        <div className="bg-[#FDF1CE] rounded-[24px] p-5 relative overflow-hidden">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-[10px] bg-neutral-900 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[16px]">folder</span>
            </div>
            <span className="text-[11px] font-semibold tracking-widest text-neutral-600 uppercase font-sans">Konteks Proyek</span>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="font-heading font-bold text-[18px] text-neutral-900 leading-snug pr-4">
              {projectName}
            </h2>
            <div className="bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-md flex items-center space-x-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900"></span>
              <span className="text-[11px] font-semibold text-neutral-900">{projectProgress}% selesai</span>
            </div>
          </div>
        </div>

        <div className="space-y-5 pt-2">
          {/* Field: Nama Task */}
          <div className="space-y-2">
            <label htmlFor="task-name" className="block text-[12px] font-semibold tracking-wider text-neutral-500 uppercase font-sans ml-1">
              Nama Task
            </label>
            <input 
              type="text" 
              id="task-name" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-14 px-4 bg-white border border-neutral-200 focus:border-neutral-900 rounded-[16px] text-[15px] font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-400 font-sans shadow-sm focus:ring-1 focus:ring-neutral-900"
              placeholder="Contoh: Membuat Wireframe"
            />
          </div>

          {/* Field: Deskripsi */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline px-1">
              <label htmlFor="task-desc" className="block text-[12px] font-semibold tracking-wider text-neutral-500 uppercase font-sans">
                Deskripsi
              </label>
              <span className="text-[11px] font-medium text-neutral-400">(Opsional)</span>
            </div>
            <textarea 
              id="task-desc" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-28 p-4 bg-white border border-neutral-200 focus:border-neutral-900 rounded-[16px] text-[15px] font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-400 font-sans shadow-sm focus:ring-1 focus:ring-neutral-900 resize-none"
              placeholder="Tambahkan catatan atau detail pengerjaan"
            ></textarea>
          </div>

          {/* Field: Tandai Selesai */}
          <button 
            type="button" 
            onClick={() => setIsCompleted(!isCompleted)}
            className={`w-full p-4 border rounded-[20px] flex items-center space-x-4 active:scale-[0.99] transition-all text-left group ${
              isCompleted 
                ? 'bg-neutral-50 border-neutral-300' 
                : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
            }`}
          >
            <div className={`w-6 h-6 rounded-md border-[2px] flex items-center justify-center shrink-0 transition-colors ${
              isCompleted 
                ? 'bg-neutral-900 border-neutral-900 text-white' 
                : 'border-neutral-300 text-transparent group-hover:border-neutral-400'
            }`}>
              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
            <div>
              <span className="text-[15px] font-semibold text-neutral-900 font-sans block leading-tight">Tandai selesai</span>
              <span className="text-[12px] text-neutral-500 font-sans mt-0.5 block">Langsung dihitung ke progres total proyek</span>
            </div>
          </button>
        </div>

        {/* Helper Text */}
        <div className="pt-2 flex items-start space-x-2.5 px-1">
          <span className="material-symbols-outlined text-[18px] text-neutral-400 shrink-0 mt-0.5">info</span>
          <p className="text-[13px] text-neutral-500 leading-relaxed font-sans">
            Persentase progres proyek dihitung secara otomatis berdasarkan jumlah task yang ditandai selesai.
          </p>
        </div>

      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-neutral-200 p-5 pt-4 pb-safe z-30">
        <div className="max-w-md mx-auto">
          {error && <p className="text-red-500 text-xs font-semibold text-center mb-2">{error}</p>}
          <button 
            onClick={handleSave}
            disabled={isSubmitting || isLoading}
            className="w-full h-[52px] bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-600 text-white font-heading font-semibold text-[14px] rounded-full flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98] transition-all tracking-wide"
          >
            {isSubmitting ? (
              <span>MENYIMPAN...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>TAMBAH TASK</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
