import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  name: string;
  title?: string;
  course_id: string;
  progress?: number;
  course?: {
    name: string;
  };
  tasks?: {
    status: string;
  }[];
  status?: string;
}

const getProjectColor = (index: number) => {
  const colors = [
    { bg: 'bg-[#FDF1CE]', track: 'bg-[#EAD89B]' },
    { bg: 'bg-[#DEEEEA]', track: 'bg-[#BBD9D2]' },
    { bg: 'bg-[#E1EED3]', track: 'bg-[#BEDBB2]' },
    { bg: 'bg-[#F7EACA]', track: 'bg-[#D9C8AA]' },
    { bg: 'bg-[#DFEDED]', track: 'bg-[#C2DEDE]' },
    { bg: 'bg-[#E0EEDD]', track: 'bg-[#C4DEC0]' },
  ];
  return colors[index % colors.length];
};

const getProjectIcon = (index: number) => {
  const icons = [
    <svg className="w-5 h-5 stroke-[2] stroke-current fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>,
    <svg className="w-5 h-5 stroke-[2] stroke-current fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>,
    <svg className="w-5 h-5 stroke-[2] stroke-current fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ];
  return icons[index % icons.length];
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string | 'all'>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try fetching from projects table, joining with courses and tasks (to compute progress)
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          course:courses(name),
          tasks:project_tasks(status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback or handle error. It might be that the table doesn't exist yet or tasks relationship fails.
        console.error('Error fetching projects:', error);
        
        // Let's try without tasks if relationship fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('projects')
          .select(`
            *,
            course:courses(name)
          `)
          .eq('user_id', user.id);
          
        if (!fallbackError && fallbackData) {
           setProjects(fallbackData);
        }
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgress = (project: Project) => {
    if (project.progress !== undefined && project.progress !== null) {
      return project.progress;
    }
    if (project.tasks && project.tasks.length > 0) {
      const completed = project.tasks.filter(t => t.status === 'completed').length;
      return Math.round((completed / project.tasks.length) * 100);
    }
    return 0; // Default progress
  };

  const filteredProjects = projects.filter(project => {
    if (selectedStatus !== 'all' && project.status !== selectedStatus) return false;
    
    const courseName = Array.isArray(project.course) 
      ? project.course[0]?.name 
      : project.course?.name || 'Umum';
      
    if (selectedCourse !== 'all' && courseName !== selectedCourse) return false;
    return true;
  });

  const uniqueCourses = Array.from(new Set(projects.map(p => {
    return Array.isArray(p.course) ? p.course[0]?.name : p.course?.name;
  }).filter(Boolean) as string[]));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-[#F4F4F5] min-h-screen w-full flex flex-col font-sans"
    >
      {/* Top Header */}
      <div className="w-full bg-white z-10 sticky top-0 border-b border-[#E4E4E7]/50">
        <header className="max-w-2xl mx-auto px-6 pt-4 pb-4 flex justify-between items-center w-full">
          <div>
            <h1 className="font-headline font-bold text-[32px] leading-tight text-base-ink tracking-tight">
              Proyek
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {filteredProjects.length} proyek akademik semester ini
            </p>
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            aria-label="Filter" 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${selectedStatus !== 'all' || selectedCourse !== 'all' ? 'bg-[#141414] text-white shadow-sm' : 'text-base-dark hover:bg-neutral-100'}`}
          >
            <span className="material-symbols-outlined text-[24px]">tune</span>
          </button>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-4 pb-28 flex flex-col gap-4">
        {isLoading ? (
          <p className="text-neutral-500 text-sm text-center mt-10">Memuat proyek...</p>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">folder_open</span>
            <p className="text-neutral-500 font-medium text-sm">Tidak ada proyek.</p>
          </div>
        ) : (
          filteredProjects.map((project, index) => {
            const color = getProjectColor(index);
            const icon = getProjectIcon(index);
            const progress = getProgress(project);
            // In case the column is named 'name' instead of 'title'
            const projectName = project.title || project.name || 'Proyek Tanpa Nama';
            // Wait, for nested course query, it might return an array or object depending on relationship.
            const courseName = Array.isArray(project.course) 
                ? project.course[0]?.name 
                : project.course?.name || 'Umum';

            return (
              <motion.article 
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${color.bg} rounded-[24px] p-5 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow`}
              >
                {/* Top row: Icon Badge & Percentage */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-[14px] bg-[#1C1C1E] flex items-center justify-center text-white shadow-sm">
                    {icon}
                  </div>
                  <div className="text-right">
                    <span className="font-headline font-bold text-3xl text-[#1C1C1E] tracking-tight leading-none">{progress}%</span>
                    <span className="block text-[11px] font-medium text-neutral-600 mt-1">Selesai</span>
                  </div>
                </div>

                {/* Middle: Title and Course Metadata */}
                <div className="mt-5">
                  <h2 className="font-headline font-bold text-xl text-[#1C1C1E] leading-snug tracking-tight">
                    {projectName}
                  </h2>
                  <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-neutral-700 font-medium">
                    <svg className="w-3.5 h-3.5 stroke-[2] stroke-current fill-none text-neutral-600" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span className="truncate">{courseName}</span>
                  </div>
                </div>

                {/* Bottom: Progress Bar */}
                <div className="mt-5">
                  <div className={`w-full h-2 ${color.track} rounded-full overflow-hidden`}>
                    <div className="h-full bg-[#1C1C1E] rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </motion.article>
            );
          })
        )}
      </main>

      {/* Floating Action Button (FAB) */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/projects/add')}
        className="fixed bottom-[96px] right-6 md:right-auto md:left-[calc(50%+280px)] w-14 h-14 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shadow-lg shadow-black/20 z-30" 
        aria-label="Tambah Proyek"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </motion.button>

      {/* Filter Modal */}
      <AnimatePresence>
      {showFilterModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white w-full max-w-2xl mx-auto rounded-t-[24px] p-6 pb-10 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-headline font-bold text-xl text-[#141414]">Filter Proyek</h3>
               <button onClick={() => setShowFilterModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                 <span className="material-symbols-outlined text-[20px]">close</span>
               </button>
            </div>
            
            <div className="space-y-6">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedStatus('all')}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-colors border ${selectedStatus === 'all' ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white text-[#141414] border-gray-200 hover:bg-gray-50'}`}
                  >Semua</button>
                  <button 
                    onClick={() => setSelectedStatus('not_started')}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-colors border ${selectedStatus === 'not_started' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >Belum Mulai</button>
                  <button 
                    onClick={() => setSelectedStatus('in_progress')}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-colors border ${selectedStatus === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >Sedang Dikerjakan</button>
                  <button 
                    onClick={() => setSelectedStatus('completed')}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-colors border ${selectedStatus === 'completed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >Selesai</button>
                </div>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Mata Kuliah</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedCourse('all')}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-colors border ${selectedCourse === 'all' ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white text-[#141414] border-gray-200 hover:bg-gray-50'}`}
                  >Semua</button>
                  {uniqueCourses.map(course => (
                    <button 
                      key={course}
                      onClick={() => setSelectedCourse(course)}
                      className={`px-4 py-2 rounded-full font-bold text-xs transition-colors border ${selectedCourse === course ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >{course}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
               <button 
                 onClick={() => { setSelectedStatus('all'); setSelectedCourse('all'); }}
                 className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-full font-bold text-sm hover:bg-gray-200 transition-all"
               >RESET</button>
               <button 
                 onClick={() => setShowFilterModal(false)}
                 className="flex-[2] py-3.5 bg-[#141414] text-white rounded-full font-bold text-sm hover:bg-black transition-all shadow-md"
               >TERAPKAN FILTER</button>
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

          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform" onClick={() => navigate('/courses')}>
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>class</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Kelas</span>
          </button>

          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform">
            <div className="flex items-center justify-center bg-[#0D0D0D] text-[#FFFFFF] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
            </div>
            <span className="font-metadata text-[10px] text-[#0D0D0D] font-bold">Proyek</span>
          </button>
        </div>
      </nav>
    </motion.div>
  );
}
