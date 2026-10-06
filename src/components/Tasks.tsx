import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../hooks/useSupabaseData';
import { calculateUrgency, getUrgencyStyles, UrgencyInfo } from '../utils/urgencyCalculator';

import AddTask from './AddTask';
import { useNavigate } from 'react-router-dom';

type ExtendedTask = Task & {
  urgencyInfo: UrgencyInfo;
};

type FilterTab = 'semua' | 'belum' | 'selesai';

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('semua');
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User tidak ditemukan.');
      }

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*, courses(name)')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const formattedTasks: ExtendedTask[] = data.map((t: any) => {
          const courseData = Array.isArray(t.courses) ? t.courses[0] : t.courses;
          return {
            ...t,
            course: courseData ? { name: courseData.name } : undefined,
            urgencyInfo: calculateUrgency(t.deadline)
          };
        });
        setTasks(formattedTasks);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat tugas.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const isCompleted = task.status === 'completed';
      if (activeTab === 'belum') return !isCompleted;
      if (activeTab === 'selesai') return isCompleted;
      return true; // 'semua'
    });
  }, [tasks, activeTab]);

  // Helper to format date cleanly
  const formatDeadline = (isoString: string) => {
    const d = new Date(isoString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
  };

  return (
    <div className="bg-[#F4F4F5] min-h-screen w-full flex flex-col font-sans">
      <div className="w-full flex-1 flex flex-col">
        {/* Sticky Top Bar (Header + Filters) */}
        <div className="w-full bg-white z-10 sticky top-0 border-b border-[#E4E4E7]/50">
          {/* Header Section */}
          <header className="max-w-2xl mx-auto px-6 pt-4 pb-4 flex justify-between items-center w-full">
            <h1 className="font-headline font-bold text-[32px] leading-tight text-base-ink tracking-tight">
              Tugas
            </h1>
            <button aria-label="Filter tugas" className="w-10 h-10 rounded-full flex items-center justify-center text-base-dark hover:bg-neutral-100 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </button>
          </header>

          {/* Filter Pills */}
          <section className="max-w-2xl mx-auto px-6 pb-4">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
              <button 
                onClick={() => setActiveTab('semua')}
                className={`px-5 py-2 rounded-full font-medium text-xs tracking-wide transition-all active:scale-95 flex items-center gap-1.5 ${
                  activeTab === 'semua' ? 'bg-[#141414] text-white shadow-sm' : 'bg-[#F4F4F5] text-neutral-600 hover:text-black'
                }`}
              >
                <span>Semua</span>
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  activeTab === 'semua' ? 'bg-white/20' : 'bg-black/10 text-black'
                }`}>
                  {tasks.length}
                </span>
              </button>
              
              <button 
                onClick={() => setActiveTab('belum')}
                className={`px-4 py-2 rounded-full font-medium text-xs tracking-wide transition-all active:scale-95 ${
                  activeTab === 'belum' ? 'bg-[#141414] text-white shadow-sm' : 'bg-[#F4F4F5] text-neutral-600 hover:text-black'
                }`}
              >
                Belum selesai
              </button>
              
              <button 
                onClick={() => setActiveTab('selesai')}
                className={`px-4 py-2 rounded-full font-medium text-xs tracking-wide transition-all active:scale-95 ${
                  activeTab === 'selesai' ? 'bg-[#141414] text-white shadow-sm' : 'bg-[#F4F4F5] text-neutral-600 hover:text-black'
                }`}
              >
                Selesai
              </button>
            </div>
          </section>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-6 pb-28 no-scrollbar space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <span className="text-neutral-500 text-sm font-medium animate-pulse">Memuat Tugas...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100">
            {error}
            <button onClick={fetchTasks} className="block mt-2 font-semibold mx-auto underline">Coba Lagi</button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">assignment_turned_in</span>
            <p className="text-neutral-500 font-medium text-sm">Tidak ada tugas.</p>
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const styles = getUrgencyStyles(task.urgencyInfo.type);
            
            return (
              <article 
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className={`group relative p-5 rounded-[24px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden ${styles.cardBg}`}
              >
                {/* Header status pill */}
                <div className="flex justify-between items-center mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 text-[#1b1b1b] text-[10px] font-bold tracking-widest uppercase`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dotBg}`}></span>
                    {task.urgencyInfo.text}
                  </div>
                  
                  {task.status === 'completed' && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">done_all</span>
                      Selesai
                    </span>
                  )}
                </div>

                {/* Task Title & Description */}
                <h2 className="font-headline font-bold text-[19px] text-[#111827] leading-snug tracking-tight mb-2 group-hover:text-black transition-colors line-clamp-2 pr-2">
                  {task.title}
                </h2>
                
                {task.description && (
                  <p className="text-[13px] text-gray-700/80 line-clamp-2 mb-4 pr-2 font-medium">
                    {task.description}
                  </p>
                )}

                {/* Divider */}
                <div className="w-full h-[1px] bg-black/5 mb-3 mt-1 rounded-full"></div>

                {/* Course Meta & Deadline Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#4B5563] text-xs font-semibold">
                  <div className="flex items-center gap-2 max-w-[70%] text-[#4B5563]">
                    <span className="material-symbols-outlined text-[16px] opacity-80">checklist</span>
                    <span className="truncate">{task.course?.name || 'Umum'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-[#4B5563]">
                    <span className="material-symbols-outlined text-[16px] opacity-80">event</span>
                    <span>{formatDeadline(task.deadline)}</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
        <div className="h-4"></div>
      </main>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-[96px] right-6 md:right-auto md:left-[calc(50%+280px)] z-30">
        <button 
          aria-label="Tambah Tugas" 
          className="w-14 h-14 rounded-full bg-[#141414] text-white flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:bg-black hover:-translate-y-1 active:scale-90 transition-all duration-200"
          onClick={() => setShowAddTask(true)}
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </div>

      {showAddTask && (
        <AddTask 
          onBack={() => setShowAddTask(false)} 
          onSuccess={() => {
            setShowAddTask(false);
            fetchTasks();
          }} 
        />
      )}

      {/* Global Bottom Navbar (Full Width) */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#FFFFFF] border-t border-[#EBEAE6] z-50 pb-safe">
        <div className="flex justify-around items-center px-4 py-2 max-w-4xl mx-auto w-full">
          {/* Item 1 (Inactive) */}
          <button 
            className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>home</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Beranda</span>
          </button>
          
          {/* Item 2 (Inactive) */}
          <button 
            className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform"
            onClick={() => navigate('/schedules')}
          >
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>calendar_month</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Jadwal</span>
          </button>

          {/* Item 3 (Active) */}
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform">
            <div className="flex items-center justify-center bg-[#0D0D0D] text-[#FFFFFF] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            </div>
            <span className="font-metadata text-[10px] text-[#0D0D0D] font-bold">Tugas</span>
          </button>

          {/* Item 4 (Inactive) - KELAS */}
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform">
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>class</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Kelas</span>
          </button>

          {/* Item 5 (Inactive) - PROYEK */}
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform">
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>folder_open</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Proyek</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
