import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Project {
  id: string;
  name?: string;
  title?: string;
  course?: {
    name: string;
  };
}

const pastelColors = ['bg-[#DFEDED]', 'bg-[#EED4BA]', 'bg-[#E0EEDD]', 'bg-[#F7EACA]'];

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchData(projectId);
    }
  }, [projectId]);

  const fetchData = async (id: string) => {
    setIsLoading(true);
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*, courses(name)')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      
      // Remap the joined courses object to course
      if (projectData) {
        setProject({
          ...projectData,
          course: projectData.courses ? (Array.isArray(projectData.courses) ? projectData.courses[0] : projectData.courses) : null
        } as any);
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      if (tasksData) {
        setTasks(tasksData);
      }
    } catch (err: any) {
      console.error('Error fetching project data:', err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    const isCompleted = task.status === 'completed';
    const newStatus = isCompleted ? 'todo' : 'completed';

    // Optimistic UI update
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    ));

    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) {
        // Revert on failure
        setTasks(prevTasks => prevTasks.map(t => 
          t.id === task.id ? { ...t, status: task.status } : t
        ));
        console.error('Error updating task:', error);
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const projectName = project?.name || project?.title || 'Memuat...';
  const courseName = project?.course?.name || 'Mata Kuliah Tidak Diketahui';

  return (
    <div className="bg-[#f3f4f6] min-h-screen w-full flex flex-col font-sans text-[#141414]">
      
      {/* Header App Bar */}
      <header className="h-16 px-5 flex items-center justify-center bg-white shrink-0 shadow-sm sticky top-0 z-20">
        <div className="w-full max-w-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/projects')}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#141414] hover:bg-black/5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-heading font-bold text-xl tracking-tight">Proyek</h1>
          </div>
          <button className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-[#141414] hover:bg-black/5 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[24px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto overflow-y-auto px-5 pt-4 pb-28">
        
        {/* Large Sand Accent Project Card */}
        <section className="bg-[#FDF1CE] rounded-[24px] p-5 mb-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-[16px] bg-[#141414] flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
            </div>
            <div className="text-right">
              <span className="font-heading font-extrabold text-2xl text-[#141414] tracking-tight leading-none block">
                {progressPercentage}%
              </span>
              <span className="text-[11px] font-medium text-[#141414]/70 tracking-wide">
                selesai ({completedTasks}/{totalTasks})
              </span>
            </div>
          </div>

          <div className="mb-5">
            <h2 className="font-heading font-bold text-xl tracking-tight leading-snug">{projectName}</h2>
            <div className="flex items-center space-x-1.5 mt-1 text-[#141414]/75 text-xs font-medium">
              <span className="material-symbols-outlined text-[15px]">menu_book</span>
              <span>{courseName}</span>
            </div>
          </div>

          <div className="w-full">
            <div className="w-full h-2 bg-[#D9C8AA]/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1C1C1E] rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px] text-[#141414]/60 font-medium">
              <span>{completedTasks} task selesai</span>
              <span>{totalTasks - completedTasks} tersisa</span>
            </div>
          </div>
        </section>

        {/* Task Proyek Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-heading font-bold text-base tracking-tight">Task Proyek</h3>
              <span className="px-2 py-0.5 rounded-full bg-black/5 text-[#141414]/80 text-xs font-heading font-semibold">
                {totalTasks}
              </span>
            </div>
            <span className="text-[11px] text-[#737373] font-normal">Otomatis memperbarui progres</span>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <div className="text-center text-sm text-gray-500 py-4">Memuat tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">Belum ada task di proyek ini.</div>
            ) : (
              tasks.map((task, index) => {
                const isCompleted = task.status === 'completed';
                const badgeColor = pastelColors[index % pastelColors.length];

                return (
                  <div 
                    key={task.id}
                    onClick={() => toggleTaskCompletion(task)}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all cursor-pointer select-none ${
                      isCompleted 
                        ? 'bg-neutral-50/80 border-neutral-200/70' 
                        : 'bg-white border-neutral-200 shadow-sm hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full ${badgeColor} flex items-center justify-center shrink-0`}>
                        <span className="font-heading text-xs font-bold text-[#141414]">{index + 1}</span>
                      </div>
                      <span className={`text-sm truncate ${isCompleted ? 'font-normal text-[#737373] line-through' : 'font-medium text-[#141414]'}`}>
                        {task.title}
                      </span>
                    </div>
                    
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-lg bg-[#141414] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg border-2 border-neutral-300 flex items-center justify-center shrink-0 bg-transparent">
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Bottom Sticky Action Button Area */}
      <div className="fixed bottom-0 left-0 right-0 w-full p-5 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 z-20 pb-safe">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => navigate(`/projects/${projectId}/tasks/add`)}
            className="w-full h-14 py-3.5 px-6 rounded-full bg-[#141414] text-white font-heading font-bold text-sm tracking-wide flex items-center justify-center space-x-2 shadow-lg hover:bg-black active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>TAMBAH TASK PROYEK</span>
          </button>
        </div>
      </div>

    </div>
  );
}
