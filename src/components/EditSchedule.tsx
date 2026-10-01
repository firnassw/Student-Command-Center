import React, { useState, useEffect } from 'react';
import { useSchedules, Schedule } from '../hooks/useSupabaseData';

export default function EditSchedule({ schedule, color, icon, onClose, onSuccess }: { schedule: Schedule, color: string, icon: string, onClose: () => void, onSuccess?: () => void }) {
  const { updateSchedule, deleteSchedule } = useSchedules();

  const [room, setRoom] = useState(schedule.course?.room || '');
  const [dayOfWeek, setDayOfWeek] = useState<number>(schedule.day_of_week);
  const [startTime, setStartTime] = useState(schedule.start_time.substring(0, 5));
  const [endTime, setEndTime] = useState(schedule.end_time.substring(0, 5));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) setErrorMessage(null);
  }, [dayOfWeek, startTime, endTime, room]);

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
    if (!startTime || !endTime) return;
    
    setIsSubmitting(true);
    try {
      await updateSchedule(schedule.id, schedule.course_id, {
        room: room.trim(),
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat memperbarui jadwal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Yakin ingin menghapus jadwal ini?')) {
      setIsDeleting(true);
      try {
        await deleteSchedule(schedule.id);
        onSuccess?.();
        onClose();
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error.message || 'Terjadi kesalahan saat menghapus jadwal');
      } finally {
        setIsDeleting(false);
      }
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
        <h1 className="font-h1-mobile text-h1-mobile text-primary font-bold flex-1 text-center pr-8">Edit Jadwal</h1>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-xl mx-auto pt-24 px-6 pb-40 flex flex-col gap-8">
        {/* Contextual Card - Readonly */}
        <section className={`${color || 'bg-surface-container-low'} rounded-[24px] p-4 flex gap-3 items-start border border-muted-divider/50`}>
          <div className="w-12 h-12 rounded-lg bg-ink-on-dark flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{icon || 'menu_book'}</span>
          </div>
          <div className="flex flex-col gap-1 w-full pr-2">
            <span className="font-label-medium text-label-medium text-on-surface-variant">Mata Kuliah</span>
            <h2 className="font-h2 text-h2 text-primary">{schedule.course?.name || 'Unknown Course'}</h2>
          </div>
        </section>

        {/* Form Container */}
        <form className="flex flex-col gap-6 w-full" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          
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
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayOfWeek(d.id)}
                  className={`min-w-[48px] h-[48px] rounded-full flex flex-col items-center justify-center font-label-medium text-label-medium transition-all shrink-0 ${
                    dayOfWeek === d.id 
                      ? 'bg-[#0D0D0D] text-white shadow-sm font-bold' 
                      : 'bg-surface-container-lowest border border-muted-divider text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jam Selection Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-medium text-label-medium text-on-surface-variant pl-1">Jam mulai</label>
              <div className="relative flex items-center w-full min-h-[64px] border border-muted-divider rounded-[16px] bg-surface-container-lowest px-4 py-2 hover:border-outline transition-colors focus-within:border-primary">
                <input 
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 font-body text-body text-on-surface text-center focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-medium text-label-medium text-on-surface-variant pl-1">Jam selesai</label>
              <div className="relative flex items-center w-full min-h-[64px] border border-muted-divider rounded-[16px] bg-surface-container-lowest px-4 py-2 hover:border-outline transition-colors focus-within:border-primary">
                <input 
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 font-body text-body text-on-surface text-center focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

        </form>
      </main>

      {/* Bottom Fixed Actions */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest to-transparent pt-6 pb-6 px-6 z-40">
        <div className="max-w-xl mx-auto flex flex-col gap-3 items-center">
          {errorMessage && (
            <div className="w-full bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-body shadow-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
              <p className="flex-1">{errorMessage}</p>
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSubmitting || isDeleting}
            className="w-full h-14 bg-[#0D0D0D] text-white rounded-full font-h2 text-h2 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
          </button>
          <button 
            onClick={handleDelete}
            disabled={isSubmitting || isDeleting}
            className="w-full h-14 bg-white border border-red-200 text-red-600 rounded-full font-h2 text-h2 hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'MENGHAPUS...' : 'HAPUS JADWAL'}
          </button>
        </div>
      </div>
    </div>
  );
}
