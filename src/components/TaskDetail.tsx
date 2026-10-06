import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { calculateUrgency, getUrgencyStyles } from '../utils/urgencyCalculator';

// types
interface Course {
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  course_id: string;
  user_id: string;
  courses?: Course | Course[];
  course?: Course;
}

interface WorkPlan {
  id: string;
  task_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchDetail = async () => {
      setLoading(true);
      
      try {
        // Fetch Task
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*, courses(name)')
          .eq('id', id)
          .single();

        if (taskError) throw taskError;
        
        // Handle array relationship issue from Postgrest
        const courseData = Array.isArray(taskData.courses) ? taskData.courses[0] : taskData.courses;
        setTask({
          ...taskData,
          course: courseData ? { name: courseData.name } : undefined
        });

        // Fetch Work Plans
        const { data: planData, error: planError } = await supabase
          .from('work_plans')
          .select('*')
          .eq('task_id', id)
          .order('start_time', { ascending: true });

        if (planError && planError.code !== '42P01') {
          // ignore relation work_plans does not exist temporarily if table missing
          console.error("Error fetching work plans:", planError);
        } else if (planData) {
          setWorkPlans(planData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetail();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      setTask(prev => prev ? { ...prev, status: newStatus as any } : null);
    } catch (err: any) {
      alert("Gagal memperbarui status: " + err.message);
    }
  };

  const formatDeadline = (isoString: string) => {
    const d = new Date(isoString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} - ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
  };

  const calculateTotalDuration = () => {
    if (workPlans.length === 0) return "0 jam";
    let totalMinutes = 0;
    workPlans.forEach(plan => {
      const start = new Date(plan.start_time).getTime();
      const end = new Date(plan.end_time).getTime();
      totalMinutes += (end - start) / (1000 * 60);
    });
    const hours = totalMinutes / 60;
    return `Est. ${hours % 1 === 0 ? hours : hours.toFixed(1)} jam total`;
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Prioritas Tinggi';
      case 'medium': return 'Prioritas Sedang';
      case 'low': return 'Prioritas Rendah';
      default: return 'Prioritas Normal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-400';
      case 'in_progress': return 'bg-yellow-400 animate-pulse';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F4F4F5] min-h-screen w-full flex flex-col items-center justify-center font-sans">
        <span className="material-symbols-outlined text-4xl animate-spin text-neutral-400 mb-2">refresh</span>
        <span className="text-neutral-500 font-medium">Memuat Detail Tugas...</span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-[#F4F4F5] min-h-screen w-full flex flex-col p-6 font-sans">
        <button onClick={() => navigate(-1)} className="self-start mb-6 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-neutral-50">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          Error: {error || 'Tugas tidak ditemukan'}
        </div>
      </div>
    );
  }

  const urgencyInfo = calculateUrgency(task.deadline);
  const styles = getUrgencyStyles(urgencyInfo.type);

  return (
    <div className="bg-[#F4F4F5] min-h-screen w-full flex flex-col font-sans pb-24">
      {/* Header */}
      <header className="w-full bg-white z-10 sticky top-0 border-b border-[#E4E4E7]/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center w-full">
          <button onClick={() => navigate(-1)} aria-label="Kembali" className="w-10 h-10 rounded-full flex items-center justify-center text-base-dark hover:bg-neutral-100 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-xl text-base-ink">
            Detail Tugas
          </h1>
          <button aria-label="Opsi" className="w-10 h-10 rounded-full flex items-center justify-center text-base-dark hover:bg-neutral-100 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[24px]">more_vert</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Hero Card */}
        <section className={`p-6 rounded-[24px] ${styles.cardBg} border ${styles.cardBorder} shadow-sm relative overflow-hidden`}>
          <div className="flex gap-2 items-center mb-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${styles.pillBg} ${styles.textColor} text-[10px] font-bold tracking-widest uppercase shadow-sm`}>
              <span className={`w-1.5 h-1.5 rounded-full ${styles.dotBg} animate-pulse`}></span>
              {urgencyInfo.text}
            </div>
            {task.status === 'completed' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                Selesai
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 text-[#141414] text-[10px] font-bold tracking-widest uppercase shadow-sm">
                {urgencyInfo.type === 'urgent' ? 'Tenggat Dekat' : 'Tenggat Aman'}
              </div>
            )}
          </div>

          <h2 className={`font-headline font-bold text-[24px] leading-tight mb-2 text-[#141414]`}>
            {task.title}
          </h2>
          
          <div className="flex items-center gap-2 mb-4 text-[#4B5563] text-sm font-semibold">
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span>{task.course?.name || 'Umum'}</span>
          </div>

          <div className="w-full h-[1px] bg-black/10 my-4 rounded-full"></div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#4B5563]">
              <span className="material-symbols-outlined text-[18px]">flag</span>
              <span>{getPriorityLabel(task.priority)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#141414]">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>{formatDeadline(task.deadline)}</span>
            </div>
          </div>
        </section>

        {/* Status Pengerjaan */}
        <section className="bg-white p-5 rounded-[24px] border border-[#E4E4E7]/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
              STATUS PENGERJAAN
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(task.status)}`}></span>
              <span className="font-semibold text-sm capitalize">
                {task.status === 'todo' ? 'Belum Dimulai' : task.status === 'in_progress' ? 'Sedang Dikerjakan' : 'Selesai'}
              </span>
            </div>
          </div>
          <div className="relative">
            <select
              value={task.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 pl-4 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm"
            >
              <option value="todo">Belum Dimulai</option>
              <option value="in_progress">Sedang Dikerjakan</option>
              <option value="completed">Selesai</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-gray-500">
              expand_more
            </span>
          </div>
        </section>

        {/* Rencana Kerja */}
        <section>
          <div className="flex justify-between items-end mb-4 px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-lg text-base-ink">Rencana Kerja</h3>
              <span className="bg-neutral-200 text-neutral-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {workPlans.length} Slot
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-500">{calculateTotalDuration()}</span>
          </div>

          {workPlans.length === 0 ? (
            <div className="bg-white p-6 rounded-[24px] border border-dashed border-[#E4E4E7] text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">assignment_add</span>
              <p className="text-neutral-500 text-sm font-medium">Belum ada rencana kerja.<br/>Tambahkan sekarang agar tugas lebih ringan!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workPlans.map((plan, index) => {
                const start = new Date(plan.start_time);
                const end = new Date(plan.end_time);
                const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
                
                return (
                  <div key={plan.id} className="bg-white p-4 rounded-[20px] border border-gray-200 shadow-sm flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-bold text-neutral-600 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-neutral-500">
                          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][start.getDay()]}, {start.getHours().toString().padStart(2, '0')}:{start.getMinutes().toString().padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          DIRENCANAKAN
                        </span>
                      </div>
                      <h4 className="font-bold text-[#141414] text-sm mb-1">{plan.title}</h4>
                      <div className="flex items-center gap-1 text-xs font-medium text-neutral-500">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        <span>{durationMins} Menit</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F4F4F5] via-[#F4F4F5] to-transparent z-20 pointer-events-none">
        <div className="max-w-2xl mx-auto flex flex-col gap-3 pointer-events-auto">
          <button className="w-full bg-[#141414] text-white font-bold text-sm py-4 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:bg-black active:scale-95 transition-all flex justify-center items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            TAMBAH RENCANA KERJA
          </button>
          <button className="w-full bg-white text-[#141414] font-bold text-sm py-4 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex justify-center items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            EDIT TUGAS
          </button>
        </div>
      </div>
    </div>
  );
}
