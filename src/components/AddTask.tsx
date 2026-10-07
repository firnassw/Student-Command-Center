import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCourses } from '../hooks/useSupabaseData';

interface AddTaskProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AddTask({ onBack, onSuccess }: AddTaskProps) {
  const { courses } = useCourses();
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [priority, setPriority] = useState<'rendah' | 'sedang' | 'tinggi'>('sedang');
  const [status, setStatus] = useState('todo');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Judul tugas tidak boleh kosong.');
      return;
    }
    if (!dateStr || !timeStr) {
      setError('Deadline dan waktu harus diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User tidak ditemukan.');

      // PENGGABUNGAN WAKTU (KRUSIAL)
      const combinedDateTimeISO = new Date(`${dateStr}T${timeStr}:00`).toISOString();

      const priorityMap: Record<string, string> = {
        'rendah': 'low',
        'sedang': 'medium',
        'tinggi': 'high'
      };

      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          course_id: courseId || null, // null jika "Umum" atau "Tidak ada"
          deadline: combinedDateTimeISO,
          priority: priorityMap[priority],
          status: status
        });

      if (insertError) throw insertError;
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan tugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCourseName = courses.find(c => c.id === courseId)?.name || 'Umum / Tidak Ada';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/40 flex flex-col items-center antialiased sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full h-full flex flex-col max-w-2xl mx-auto bg-[#FBFBFB] sm:rounded-[32px] overflow-hidden shadow-2xl relative"
      >
        
        {/* App Bar */}
        <header className="w-full px-5 py-4 flex items-center justify-between bg-white border-b border-[#E4E4E7] z-20 sticky top-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <button 
              type="button" 
              onClick={onBack}
              aria-label="Kembali" 
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#191B1F] hover:bg-black/5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline font-bold text-xl text-[#191B1F] tracking-tight">Tambah Tugas</h1>
          </div>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-full font-headline font-bold text-[13px] tracking-wide text-[#191B1F] hover:bg-black/5 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'MENYIMPAN' : 'SIMPAN'}
          </button>
        </header>

        {/* Scrollable Form Body */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-32 bg-[#FBFBFB]">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 mb-4 animate-[fadeIn_0.2s_ease-in-out]">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={e => e.preventDefault()}>

            {/* Judul Tugas */}
            <div>
              <label className="block font-medium text-[11px] tracking-wider uppercase text-[#71717A] mb-1.5">
                Judul Tugas
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-[#D9D9D9] rounded-[16px] font-headline font-semibold text-[15px] text-[#000000] focus:outline-none focus:border-[#141414] transition-colors placeholder:text-gray-400 shadow-sm"
                  placeholder="Masukkan judul tugas..."
                />
              </div>
            </div>

            {/* Mata Kuliah */}
            <div>
              <label className="block font-medium text-[11px] tracking-wider uppercase text-[#71717A] mb-1.5">
                Mata Kuliah
              </label>
              <div className="relative w-full px-4 py-3 bg-white border border-[#D9D9D9] rounded-[16px] flex items-center justify-between shadow-sm hover:border-gray-400 transition-colors focus-within:border-[#141414]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#141414] flex items-center justify-center text-white shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-headline font-semibold text-sm text-[#000000] block leading-snug">{selectedCourseName}</span>
                    <span className="text-[11px] text-[#71717A] block leading-none mt-0.5">Tugas Akademik</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-medium text-[#71717A]">Ubah</span>
                  <svg className="w-4 h-4 text-[#71717A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                  </svg>
                </div>
                
                {/* Invisible Select overlay */}
                <select 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">Umum / Tidak Ada</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deadline & Waktu */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[11px] tracking-wider uppercase text-[#71717A] mb-1.5">
                  Deadline
                </label>
                <input 
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-[#D9D9D9] rounded-[16px] text-sm font-medium text-[#000000] focus:outline-none focus:border-[#141414] shadow-sm transition-colors"
                />
              </div>

              <div>
                <label className="block font-medium text-[11px] tracking-wider uppercase text-[#71717A] mb-1.5">
                  Waktu
                </label>
                <input 
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-[#D9D9D9] rounded-[16px] text-sm font-medium text-[#000000] focus:outline-none focus:border-[#141414] shadow-sm transition-colors"
                />
              </div>
            </div>

            {/* Prioritas */}
            <div>
              <label className="block font-medium text-[11px] tracking-wider uppercase text-[#71717A] mb-1.5">
                Prioritas
              </label>
              <div className="w-full p-1 bg-gray-100 rounded-[16px] flex items-center justify-between border border-[#D9D9D9]/50">
                <button 
                  type="button" 
                  onClick={() => setPriority('rendah')}
                  className={`flex-1 py-2 rounded-xl text-center text-xs transition-all flex items-center justify-center space-x-1 ${priority === 'rendah' ? 'font-headline font-bold text-white bg-[#141414] shadow-sm' : 'font-medium text-[#71717A] hover:text-[#000000]'}`}
                >
                  {priority === 'rendah' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1"></span>}
                  <span>Rendah</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPriority('sedang')}
                  className={`flex-1 py-2 rounded-xl text-center text-xs transition-all flex items-center justify-center space-x-1 ${priority === 'sedang' ? 'font-headline font-bold text-white bg-[#141414] shadow-sm' : 'font-medium text-[#71717A] hover:text-[#000000]'}`}
                >
                  {priority === 'sedang' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1"></span>}
                  <span>Sedang</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPriority('tinggi')}
                  className={`flex-1 py-2 rounded-xl text-center text-xs transition-all flex items-center justify-center space-x-1 ${priority === 'tinggi' ? 'font-headline font-bold text-white bg-[#141414] shadow-sm' : 'font-medium text-[#71717A] hover:text-[#000000]'}`}
                >
                  {priority === 'tinggi' && <span className="w-1.5 h-1.5 rounded-full bg-[#EED4BA] mr-1"></span>}
                  <span>Tinggi</span>
                </button>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block font-medium text-[11px] tracking-wider uppercase text-[#71717A] mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-[#D9D9D9] rounded-[16px] text-sm font-medium text-[#000000] focus:outline-none focus:border-[#141414] shadow-sm appearance-none cursor-pointer"
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-[#71717A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Helper Text */}
            <div className="pt-2 flex items-start space-x-2">
              <svg className="w-3.5 h-3.5 text-[#71717A]/80 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
              </svg>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Tugas ditambahkan secara manual sesuai instruksi dosen.
              </p>
            </div>

          </form>
        </main>

        {/* Sticky Bottom Primary Button Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-30 pointer-events-none">
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full h-14 rounded-full bg-[#141414] text-white font-headline font-bold text-sm tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-black active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100 pointer-events-auto"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Menyimpan...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">check</span>
                <span>SIMPAN TUGAS</span>
              </>
            )}
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
}
