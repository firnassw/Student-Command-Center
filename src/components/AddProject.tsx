import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  name: string;
}

const statusOptions = [
  { label: 'Belum mulai', value: 'not_started' },
  { label: 'Sedang dikerjakan', value: 'in_progress' },
  { label: 'Selesai', value: 'completed' },
];

export default function AddProject() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('in_progress');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');
      
      if (!error && data) {
        setCourses(data);
        if (data.length > 0) setCourseId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const selectedCourse = courses.find(c => c.id === courseId);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Judul proyek tidak boleh kosong');
      return;
    }
    if (!courseId) {
      setError('Pilih mata kuliah terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: title.trim(),
          course_id: courseId,
          status: status
        });

      if (insertError) throw insertError;
      
      navigate(-1);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan proyek');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-[#F1F5F9] min-h-screen w-full flex flex-col font-sans text-[#000000]"
    >
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
            <h1 className="text-[19px] font-heading font-bold text-neutral-900 tracking-tight">Tambah Proyek</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="text-[13px] font-heading font-bold text-neutral-900 px-3 py-1.5 rounded-full hover:bg-neutral-100 active:scale-95 transition-all tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN'}
          </button>
        </div>
      </header>

      {/* Scrollable Form Body */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-8 pb-32 space-y-8">

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-[16px] text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Field: Nama Proyek */}
        <div className="space-y-2">
          <label htmlFor="project-name" className="block text-[12px] font-semibold tracking-wider text-neutral-500 uppercase font-sans">
            Judul Proyek
          </label>
          <div className="relative">
            <input 
              type="text" 
              id="project-name" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-14 px-4 bg-white border border-neutral-200 focus:border-neutral-900 rounded-[16px] text-[15px] font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-400 font-sans shadow-sm focus:ring-1 focus:ring-neutral-900"
              placeholder="Masukkan judul proyek"
            />
          </div>
        </div>

        {/* Field: Mata Kuliah */}
        <div className="space-y-2 relative">
          <label className="block text-[12px] font-semibold tracking-wider text-neutral-500 uppercase font-sans">
            Mata Kuliah
          </label>
          <button 
            type="button" 
            onClick={() => setShowCourseDropdown(!showCourseDropdown)}
            className="w-full h-14 px-4 bg-white border border-neutral-200 hover:border-neutral-300 rounded-[16px] flex items-center justify-between active:scale-[0.99] transition-all text-left shadow-sm group"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
              </div>
              <div className="truncate">
                <span className="text-[14px] font-semibold text-neutral-900 font-sans block leading-tight truncate">
                  {selectedCourse ? selectedCourse.name : 'Pilih Mata Kuliah'}
                </span>
                <span className="text-[11px] text-neutral-500 font-sans block truncate">Mata kuliah semester ini</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-neutral-600 group-hover:text-neutral-900 shrink-0 ml-2">
              <span className="text-[12px] font-medium">Ubah</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </div>
          </button>
          
          {showCourseDropdown && (
            <div className="absolute top-[100%] left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-[16px] shadow-lg z-20 max-h-60 overflow-y-auto">
              {courses.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">Belum ada mata kuliah</div>
              ) : (
                courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => { setCourseId(course.id); setShowCourseDropdown(false); }}
                    className={`w-full text-left px-4 py-3 text-[14px] font-medium transition-colors hover:bg-neutral-50 ${course.id === courseId ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-700'}`}
                  >
                    {course.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Field: Status Proyek */}
        <div className="space-y-2">
          <label className="block text-[12px] font-semibold tracking-wider text-neutral-500 uppercase font-sans">
            Status Proyek
          </label>
          <div className="grid grid-cols-3 p-1.5 bg-neutral-200/50 rounded-[16px] gap-1 border border-neutral-200/60">
            {statusOptions.map(opt => (
              <button 
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`py-2.5 px-2 rounded-[12px] text-[13px] active:scale-95 transition-all text-center flex items-center justify-center space-x-1.5 leading-snug ${
                  status === opt.value 
                    ? 'bg-neutral-900 text-white font-semibold shadow-md' 
                    : 'font-medium text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {status === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#EED4BA] shrink-0"></span>}
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Helper Text with subtle info icon */}
        <div className="pt-2 flex items-start space-x-2.5 px-1">
          <span className="material-symbols-outlined text-[18px] text-neutral-400 shrink-0 mt-0.5">info</span>
          <p className="text-[13px] text-neutral-500 leading-relaxed font-sans">
            Progress dihitung otomatis dari task proyek yang selesai.
          </p>
        </div>

        {/* Preview Context Card */}
        <div className="p-4 bg-[#F7EACA]/40 rounded-[18px] border border-[#D9C8AA]/30 mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-[12px] bg-neutral-900 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[19px]">folder</span>
            </div>
            <div>
              <div className="text-[13px] font-heading font-bold text-neutral-900 leading-tight">Card Otomatis Dibuat</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">Dapat menambahkan checklist task setelah disimpan</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-neutral-500 text-[20px] shrink-0 ml-2">check_circle</span>
        </div>

      </main>

      {/* Bottom Action Bar (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-neutral-200 p-5 pt-4 pb-safe z-30">
        <div className="max-w-md mx-auto">
          {error && <p className="text-red-500 text-xs font-semibold text-center mb-2">{error}</p>}
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full h-[52px] bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-600 text-white font-heading font-semibold text-[14px] rounded-full flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98] transition-all tracking-wide"
          >
            {isSubmitting ? (
              <span>MENYIMPAN...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[19px] font-bold">check</span>
                <span>SIMPAN PROYEK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
