import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getCourseTheme } from '../utils/courseTheme';
import AddSchedule from './AddSchedule';

interface Course {
  id: string;
  name: string;
  code: string;
  lecturer: string;
  sks: number;
  color: string;
}

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const promptDeleteCourse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCourseToDelete(id);
  };

  const executeDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Delete associated tasks first
      await supabase.from('tasks').delete().eq('course_id', courseToDelete).eq('user_id', user.id);
      
      // Delete the course
      const { error } = await supabase.from('courses').delete().eq('id', courseToDelete).eq('user_id', user.id);
      if (error) throw error;
      
      fetchCourses();
    } catch (err: any) {
      alert('Gagal menghapus kelas: ' + err.message);
    } finally {
      setIsDeleting(false);
      setCourseToDelete(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-[#F4F4F5] min-h-screen w-full flex flex-col font-sans"
    >
      {/* App Bar */}
      <div className="w-full bg-white z-10 sticky top-0 border-b border-[#E4E4E7]/50">
        <header className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center w-full">
          <h1 className="font-headline font-bold text-[32px] leading-tight text-base-ink tracking-tight">
            Kelas
          </h1>
          <button 
            aria-label="Tambah jadwal" 
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-base-dark hover:bg-neutral-100 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </header>
      </div>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-6 pb-28 no-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="animate-pulse font-medium text-gray-500">Memuat data...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl text-neutral-300 mb-3">class</span>
            <p className="text-neutral-500 font-medium">Belum ada mata kuliah yang ditambahkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {courses.map((course, index) => {
              const theme = getCourseTheme(course.name);
              return (
              <motion.div 
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${theme.bgColor} p-5 rounded-[24px] shadow-sm flex flex-col gap-3 relative overflow-hidden cursor-pointer transition-colors hover:shadow-md`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-headline font-bold tracking-wider text-[#1b1b1b]/60 uppercase">
                      MATA KULIAH
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/40 text-[#141414] text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                        {course.sks} SKS
                      </span>
                      <button 
                        onClick={(e) => promptDeleteCourse(e, course.id)}
                        className="text-[#1b1b1b]/40 hover:text-red-500 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/50 backdrop-blur-sm"
                        aria-label="Hapus kelas"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-[#141414] leading-snug">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-[#1b1b1b]/70 font-medium">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span className="truncate">{course.lecturer || 'Belum ada dosen'}</span>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddSchedule 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            fetchCourses();
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {courseToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[28px]">delete_forever</span>
                </div>
                <h3 className="font-h1 text-xl text-[#141414] font-bold">Hapus Mata Kuliah?</h3>
                <p className="text-sm text-neutral-500 font-medium">Yakin ingin menghapus kelas ini? Semua tugas di dalamnya akan ikut terhapus secara permanen.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeDeleteCourse}
                  disabled={isDeleting}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'MENGHAPUS...' : 'YA, HAPUS PERMANEN'}
                </button>
                <button 
                  onClick={() => setCourseToDelete(null)}
                  disabled={isDeleting}
                  className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50"
                >
                  BATAL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#FFFFFF] border-t border-[#EBEAE6] z-50 pb-safe">
        <div className="flex justify-around items-center px-4 py-2 max-w-4xl mx-auto w-full">
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform" onClick={() => navigate('/')}>
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>home</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Beranda</span>
          </button>
          
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform" onClick={() => navigate('/schedules')}>
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>calendar_month</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Jadwal</span>
          </button>

          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform" onClick={() => navigate('/tasks')}>
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>assignment</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Tugas</span>
          </button>

          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform">
            <div className="flex items-center justify-center bg-[#0D0D0D] text-[#FFFFFF] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>class</span>
            </div>
            <span className="font-metadata text-[10px] text-[#0D0D0D] font-bold">Kelas</span>
          </button>

          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform" onClick={() => navigate('/projects')}>
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>folder_open</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Proyek</span>
          </button>
        </div>
      </nav>
    </motion.div>
  );
}
