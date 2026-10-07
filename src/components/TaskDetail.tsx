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

  // Add Work Plan States
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanStartTime, setNewPlanStartTime] = useState('');
  const [newPlanEndTime, setNewPlanEndTime] = useState('');
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

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

  const handleAddWorkPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newPlanTitle || !newPlanStartTime || !newPlanEndTime) return;
    
    setIsSubmittingPlan(true);
    try {
      const { data, error } = await supabase
        .from('work_plans')
        .insert([{
          task_id: id,
          title: newPlanTitle,
          start_time: new Date(newPlanStartTime).toISOString(),
          end_time: new Date(newPlanEndTime).toISOString(),
          status: 'planned'
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      setWorkPlans(prev => [...prev, data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      setIsAddPlanModalOpen(false);
      setNewPlanTitle('');
      setNewPlanStartTime('');
      setNewPlanEndTime('');
    } catch (err: any) {
      alert("Gagal menambahkan rencana kerja: " + err.message);
    } finally {
      setIsSubmittingPlan(false);
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
      case 'todo': return 'bg-[#71717A]';
      case 'in_progress': return 'bg-amber-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-[#71717A]';
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
        <section className={`p-5 rounded-[24px] ${styles.cardBg} border border-black/5 relative overflow-hidden`}>
          {/* Status Badge & Indicator */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 ${styles.textColor} text-[11px] font-headline font-bold tracking-wider uppercase backdrop-blur-sm`}>
              <span className={`w-1.5 h-1.5 rounded-full ${styles.dotBg} animate-pulse`}></span>
              {urgencyInfo.text}
            </span>
            {task.status === 'completed' ? (
              <span className={`px-2.5 py-1 rounded-full bg-white/50 text-[11px] font-semibold ${styles.textColor} opacity-90`}>
                Selesai
              </span>
            ) : (
              <span className={`px-2.5 py-1 rounded-full bg-white/50 text-[11px] font-semibold ${styles.textColor} opacity-90`}>
                {urgencyInfo.type === 'urgent' ? 'Tenggat Dekat' : 'Tenggat Aman'}
              </span>
            )}
          </div>

          {/* Large Bold Title */}
          <h2 className="font-headline font-extrabold text-[22px] leading-tight text-[#141414] mb-2.5">
            {task.title}
          </h2>

          {/* Course & Priority Metadata */}
          <div className="flex items-center flex-wrap gap-y-1.5 gap-x-2 text-[13px] text-[#141414]/80 mb-3.5 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-black/5 px-2.5 py-0.5 rounded-md text-[#141414] font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              {task.course?.name || 'Umum'}
            </span>
            <span>·</span>
            <span className={`${styles.textColor} font-semibold`}>{getPriorityLabel(task.priority)}</span>
          </div>

          {/* Deadline Detail Bar */}
          <div className="pt-3 border-t border-black/10 flex items-center gap-2 text-[12.5px] text-[#141414]/85 font-medium">
            <svg className={`w-4 h-4 ${styles.textColor} shrink-0`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Deadline: <strong className="font-bold text-[#141414]">{formatDeadline(task.deadline)}</strong></span>
          </div>
        </section>

        {/* Clean Status Selector */}
        <section className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-[20px] p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-[#71717A]">Status Pengerjaan</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(task.status)}`}></span>
              <span className="font-headline font-semibold text-[15px] text-[#141414]">
                {task.status === 'todo' ? 'Belum Dimulai' : task.status === 'in_progress' ? 'Sedang Dikerjakan' : 'Selesai'}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={task.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="appearance-none bg-white border border-[#E4E4E7] text-[#141414] text-[12px] font-medium py-1.5 pl-3 pr-8 rounded-full focus:outline-none hover:bg-gray-50 active:scale-95 transition-all shadow-sm cursor-pointer z-10 relative"
            >
              <option value="todo">Belum Dimulai</option>
              <option value="in_progress">Sedang Dikerjakan</option>
              <option value="completed">Selesai</option>
            </select>
            <svg className="w-3.5 h-3.5 text-[#71717A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </section>

        {/* Rencana Kerja */}
        <section className="flex flex-col space-y-3 pb-8">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-[17px] text-[#141414]">Rencana Kerja</h3>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#141414] text-[11px] font-semibold">
                {workPlans.length} Slot
              </span>
            </div>
            <span className="text-[12px] text-[#71717A] font-medium">{calculateTotalDuration()}</span>
          </div>

          {workPlans.length === 0 ? (
            <div className="bg-white p-6 rounded-[20px] border border-dashed border-[#E4E4E7] text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">assignment_add</span>
              <p className="text-[#71717A] text-sm font-medium">Belum ada rencana kerja.<br/>Tambahkan sekarang agar tugas lebih ringan!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workPlans.map((plan, index) => {
                const start = new Date(plan.start_time);
                const end = new Date(plan.end_time);
                const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
                const pastelBg = index % 2 === 0 ? 'bg-[#DFEDED]' : 'bg-[#F7EACA]';
                
                return (
                  <div key={plan.id} className="bg-white border border-[#E4E4E7] rounded-[20px] p-4 flex items-start gap-3.5 shadow-sm">
                    {/* Numbered Pastel Circle Badge */}
                    <div className={`w-8 h-8 rounded-full ${pastelBg} text-[#141414] font-headline font-bold text-[14px] flex items-center justify-center shrink-0 mt-0.5 border border-black/5`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-[#71717A]">
                          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][start.getDay()]}, {start.getHours().toString().padStart(2, '0')}.{start.getMinutes().toString().padStart(2, '0')} - {end.getHours().toString().padStart(2, '0')}.{end.getMinutes().toString().padStart(2, '0')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#71717A] text-[10px] font-headline font-bold tracking-wider uppercase">
                          {plan.status === 'completed' ? 'SELESAI' : 'DIRENCANAKAN'}
                        </span>
                      </div>
                      <p className="font-headline font-semibold text-[14.5px] text-[#141414] leading-snug">
                        {plan.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-[#71717A]">
                        <svg className="w-3 h-3 text-[#71717A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
                        </svg>
                        <span>Durasi: {durationMins} menit</span>
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
        <div className="max-w-2xl mx-auto flex flex-col gap-2.5 pointer-events-auto mt-auto">
          {/* Dark Full-width Primary Button */}
          <button 
            onClick={() => setIsAddPlanModalOpen(true)}
            className="w-full py-3.5 px-4 bg-[#141414] text-white rounded-full font-headline font-bold text-[13.5px] tracking-wide flex items-center justify-center gap-2 shadow-sm hover:bg-black active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>TAMBAH RENCANA KERJA</span>
          </button>

          {/* Secondary Outlined Button */}
          <button className="w-full py-3.5 px-4 bg-white border border-[#E4E4E7] text-[#141414] rounded-full font-headline font-bold text-[13.5px] tracking-wide flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all">
            <svg className="w-4 h-4 text-[#71717A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>EDIT TUGAS</span>
          </button>
        </div>
      </div>

      {/* Add Work Plan Modal */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-t-[24px] p-6 pb-12 shadow-xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl text-[#141414]">Tambah Rencana Kerja</h3>
              <button onClick={() => setIsAddPlanModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddWorkPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Aktivitas</label>
                <input 
                  type="text" 
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="Contoh: Mengerjakan bab 1" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Waktu Mulai</label>
                  <input 
                    type="datetime-local" 
                    value={newPlanStartTime}
                    onChange={(e) => setNewPlanStartTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Waktu Selesai</label>
                  <input 
                    type="datetime-local" 
                    value={newPlanEndTime}
                    onChange={(e) => setNewPlanEndTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmittingPlan}
                className="w-full py-4 bg-black text-white rounded-full font-bold text-sm hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                {isSubmittingPlan ? 'MENYIMPAN...' : 'SIMPAN RENCANA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
