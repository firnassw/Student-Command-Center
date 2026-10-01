import React, { useState, useEffect } from 'react';
import { useSchedules } from '../hooks/useSupabaseData';

export default function AddSchedule({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) {
  const { addSchedule } = useSchedules();

  const [courseTitle, setCourseTitle] = useState('');
  const [room, setRoom] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // 1: Sen, 2: Sel, etc. (ISO 8601)
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:40');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) setErrorMessage(null);
  }, [dayOfWeek, startTime, endTime]);

  const days = [
    { id: 1, label: 'Sen' },
    { id: 2, label: 'Sel' },
    { id: 3, label: 'Rab' },
    { id: 4, label: 'Kam' },
    { id: 5, label: 'Jum' },
    { id: 6, label: 'Sab' },
    { id: 7, label: 'Min' },
  ];

  const handleSave = async () => {
    if (!courseTitle || !startTime || !endTime) return;
    
    setIsSubmitting(true);
    try {
      await addSchedule({
        course_name: courseTitle.trim(),
        room: room.trim(),
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat menyimpan jadwal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface-container-lowest text-on-surface font-body antialiased flex flex-col pb-safe overflow-y-auto w-full h-full">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest flex items-center justify-between h-16 px-6 max-w-xl mx-auto border-b border-surface-container-low">
        <button 
          onClick={onClose}
          aria-label="Go back" 
          className="flex items-center justify-center w-10 h-10 -ml-2 text-primary hover:opacity-80 transition-opacity duration-200 rounded-full active:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="font-h1-mobile text-h1-mobile text-primary font-bold flex-1 text-center pr-8">Tambah Jadwal</h1>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-xl mx-auto pt-24 px-6 pb-32 flex flex-col gap-8">
        {/* Contextual Card */}
        <section className="bg-surface-container-low rounded-[24px] p-4 flex gap-3 items-start">
          <div className="w-12 h-12 rounded-lg bg-ink-on-dark flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>event_repeat</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-label-medium text-label-medium text-on-surface">Jadwal kuliah berulang</span>
            <p className="font-metadata text-metadata text-on-surface-variant">Atur hari dan jam kelas untuk mengaktifkan jadwal serta pengingat absensi</p>
          </div>
        </section>

        {/* Form Container */}
        <form className="flex flex-col gap-6 w-full" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          
          {/* Mata Kuliah Field */}
          <div className="flex flex-col gap-2">
            <label className="font-label-medium text-label-medium text-on-surface-variant pl-1">Mata kuliah</label>
            <div className="relative flex items-center w-full min-h-[64px] border border-muted-divider rounded-[16px] bg-surface-container-lowest px-4 py-2 hover:border-outline transition-colors">
              <input 
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Contoh: Pemrograman Web"
                className="w-full h-full min-h-[48px] bg-transparent border-0 focus:ring-0 p-0 font-body text-body text-on-surface focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-medium text-label-medium text-on-surface-variant pl-1">Ruangan</label>
            <div className="relative flex items-center w-full min-h-[64px] border border-muted-divider rounded-[16px] bg-surface-container-lowest p-3 hover:border-outline transition-colors focus-within:border-primary">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 mr-3">
                <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
              </div>
              <input 
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Contoh: Lab 2"
                className="w-full bg-transparent border-0 focus:ring-0 p-0 font-body text-body text-on-surface flex-1 focus:outline-none"
              />
            </div>
          </div>

          {/* Hari Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-label-medium text-label-medium text-on-surface-variant pl-1">Hari</label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {days.map(d => (
                <button 
                  key={d.id}
                  onClick={() => setDayOfWeek(d.id)}
                  className={`shrink-0 w-12 h-12 rounded-full font-label-medium text-label-medium transition-colors ${dayOfWeek === d.id ? 'bg-[#0D0D0D] text-white shadow-sm font-bold' : 'border border-muted-divider bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'}`}
                  type="button"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Fields Row */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-label-medium text-label-medium text-on-surface-variant pl-1">Jam mulai</label>
              <div className="relative flex items-center w-full h-[56px] border border-muted-divider rounded-[16px] bg-surface-container-lowest px-3 hover:border-outline transition-colors focus-within:border-primary">
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 font-body text-body text-on-surface focus:outline-none appearance-none" 
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-label-medium text-label-medium text-on-surface-variant pl-1">Jam selesai</label>
              <div className="relative flex items-center w-full h-[56px] border border-muted-divider rounded-[16px] bg-surface-container-lowest px-3 hover:border-outline transition-colors focus-within:border-primary">
                <input 
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 font-body text-body text-on-surface focus:outline-none appearance-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="flex items-start gap-2 mt-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5">notifications_active</span>
            <p className="font-metadata text-metadata text-on-surface-variant leading-relaxed">Pengingat absensi dikirim 15 menit sebelum dan saat kelas dimulai.</p>
          </div>
        </form>
      </main>

      {/* Bottom Fixed Actions */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest to-transparent pt-6 pb-6 px-6 z-40">
        <div className="max-w-xl mx-auto flex flex-col gap-2 items-center">
          {errorMessage && (
            <div className="w-full bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-body shadow-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
              <p className="flex-1">{errorMessage}</p>
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !courseTitle.trim()}
            className="w-full h-14 bg-[#0D0D0D] text-white rounded-full font-h2 text-h2 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN JADWAL'}
          </button>
          <p className="font-metadata text-metadata text-on-surface-variant text-center opacity-80 mt-1">Waktu jadwal mengikuti zona waktu Asia/Jakarta.</p>
        </div>
      </div>
    </div>
  );
}
