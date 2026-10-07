import React, { useMemo, useState } from 'react';
import { useCourses } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { toZonedTime, format } from 'date-fns-tz';
import { startOfWeek, addDays, subDays } from 'date-fns';
import AddSchedule from './AddSchedule';
import EditSchedule from './EditSchedule';
import LogoutModal from './LogoutModal';
import QuickNote from './QuickNote';
import CourseDetail from './CourseDetail';
import { getCourseTheme } from '../utils/courseTheme';
import { useNavigate } from 'react-router-dom';

const timeZone = 'Asia/Jakarta';

// Helper to format time strings (HH:mm:ss) to HH.mm
const formatTimeJakarta = (timeStr: string) => {
  if (!timeStr) return '';
  // Since time is just HH:mm:ss, we can slice it directly
  return timeStr.substring(0, 5).replace(':', '.');
};

export default function Schedules() {
  const navigate = useNavigate();
  const { courses, loading, fetchCourses } = useCourses();
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(() => toZonedTime(new Date(), timeZone));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const filteredSchedules = useMemo(() => {
    const targetDayOfWeek = parseInt(format(selectedDate, 'i', { timeZone }), 10);
    const dayNamesFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const selectedDayName = dayNamesFull[targetDayOfWeek === 7 ? 0 : targetDayOfWeek]; // 'i' is 1-7, where 7 is Sunday.
    
    return courses.filter(c => c.room?.toLowerCase().includes(selectedDayName.toLowerCase()));
  }, [courses, selectedDate]);

  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  if (selectedCourseId) {
    return <CourseDetail courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
  }

  return (
    <div className="bg-[#FFFFFF] text-primary font-body antialiased min-h-screen w-full flex flex-col">
      {/* Global Header (Full Width) */}
      <header className="w-full top-0 sticky bg-[#FFFFFF] z-40 border-b border-[#EBEAE6]">
        <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full">
          <h1 className="font-h1-mobile text-h1-mobile text-[#191B1F] font-extrabold leading-none">Jadwal</h1>
          <div className="flex items-center gap-4">
            <button 
              aria-label="Settings" 
              className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none hidden md:block"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <span className="material-symbols-outlined" data-icon="logout">logout</span>
            </button>
          </div>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex px-4 md:px-8 py-3 gap-3 w-full max-w-2xl mx-auto">
          <button 
            onClick={() => {
              setViewMode('today');
              setSelectedDate(toZonedTime(new Date(), timeZone));
            }}
            className={`${viewMode === 'today' ? 'bg-[#0D0D0D] text-[#FFFFFF] font-bold shadow-sm' : 'bg-[#F3F3F3] text-[#848484] hover:bg-[#EBEAE6] transition-colors'} font-label-medium px-6 py-2 rounded-full`}
          >
            Hari ini
          </button>
          <button 
            onClick={() => setViewMode('weekly')}
            className={`${viewMode === 'weekly' ? 'bg-[#0D0D0D] text-[#FFFFFF] font-bold shadow-sm' : 'bg-[#F3F3F3] text-[#848484] hover:bg-[#EBEAE6] transition-colors'} font-label-medium px-6 py-2 rounded-full`}
          >
            Minggu ini
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-2xl mx-auto flex flex-col pb-28 md:pb-32">
        {viewMode === 'weekly' && (
          <>
            {/* Weekly Calendar Strip */}
            <div className="px-4 py-4 flex items-center justify-between overflow-x-auto no-scrollbar gap-2 border-b border-[#EBEAE6]">
              {weekDays.map((date, i) => {
                const isActive = format(date, 'yyyy-MM-dd', { timeZone }) === format(selectedDate, 'yyyy-MM-dd', { timeZone });
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDate(date)}
                    className="flex flex-col items-center justify-center min-w-[40px] relative cursor-pointer group"
                  >
                    <span className={`font-metadata text-metadata mb-1 transition-colors ${isActive ? 'text-primary font-bold' : 'text-on-surface-variant group-hover:text-primary'}`}>
                      {dayNames[i]}
                    </span>
                    {isActive && (
                      <div className="w-[4px] h-[4px] rounded-full bg-primary mt-1 absolute -bottom-1"></div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Date Navigator */}
            <div className="flex items-center justify-between px-4 py-4 mt-2">
              <button 
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <h2 className="font-label-medium text-label-medium text-primary uppercase tracking-wide">
                {format(selectedDate, 'EEEE, d MMMM', { timeZone }).replace('Monday', 'Senin').replace('Tuesday', 'Selasa').replace('Wednesday', 'Rabu').replace('Thursday', 'Kamis').replace('Friday', 'Jumat').replace('Saturday', 'Sabtu').replace('Sunday', 'Minggu').replace('January', 'Januari').replace('February', 'Februari').replace('March', 'Maret').replace('May', 'Mei').replace('June', 'Juni').replace('July', 'Juli').replace('August', 'Agustus').replace('October', 'Oktober').replace('December', 'Desember')}
              </h2>
              <button 
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col gap-4 px-4 mt-4">
          {loading ? (
            <p className="text-on-surface-variant text-sm py-4">Memuat jadwal...</p>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-surface-container-low rounded-[24px] p-6 text-center border border-dashed border-muted-divider w-full mt-4">
              <p className="text-on-surface-variant font-label-medium">
                {viewMode === 'weekly' ? 'Tidak ada jadwal di hari ini' : 'Tidak ada jadwal hari ini'}
              </p>
            </div>
          ) : (
            filteredSchedules.map((course) => {
              const theme = getCourseTheme(course.name);

              if (viewMode === 'weekly') {
                return (
                  <article 
                    key={course.id} 
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`${theme.bgColor} rounded-[24px] p-4 flex gap-4 items-start w-full cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    <div className="w-[40px] h-[40px] bg-ink-on-dark rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {theme.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-h2 text-h2 text-primary mb-1">{course.name || 'Unknown Course'}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center text-on-surface-variant font-metadata text-metadata gap-2">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {course.room?.split(' ')[1] || '-'}
                        </div>
                        <div className="flex items-center text-on-surface-variant font-metadata text-metadata gap-2">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {course.room?.replace(/^[A-Za-z]+\s+\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*/, '') || 'Ruang Kelas'}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingSchedule({ schedule: course, color: theme.bgColor, icon: theme.icon }); }}
                      className="flex items-center justify-center self-center mr-2 shrink-0 w-9 h-9 bg-surface-container-lowest rounded-full shadow-sm text-on-surface-variant hover:text-primary transition-colors active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </article>
                );
              }

              // Today Mode rendering
              return (
                <div key={course.id} className="flex gap-4 items-stretch w-full">
                  {/* Time Column */}
                  <div className="flex flex-col items-end w-12 shrink-0 py-1">
                    <span className="font-label-medium text-label-medium text-primary text-right">{course.room?.split(' ')[1] || '-'}</span>
                  </div>

                  {/* Content Card */}
                  <div 
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`${theme.bgColor} rounded-[24px] p-4 flex-grow relative overflow-hidden w-full cursor-pointer hover:opacity-90 transition-opacity shadow-sm`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-ink-on-dark text-on-primary w-12 h-12 flex items-center justify-center rounded-[16px] shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{theme.icon}</span>
                      </div>
                      <div className="pt-1">
                        <h3 className="font-h2 text-h2 text-primary leading-snug">{course.name || 'Unknown Course'}</h3>
                        <p className="font-metadata text-metadata text-status-safe-fg mt-1 text-xs truncate max-w-[150px]">{course.room?.replace(/^[A-Za-z]+\s+\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*/, '') || 'Ruang Kelas'}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.open('https://spada.upnyk.ac.id/login/index.php', '_blank', 'noopener,noreferrer'); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-muted-divider bg-white/60 backdrop-blur-sm font-metadata text-metadata font-semibold text-primary hover:bg-white active:scale-95 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]" data-icon="open_in_new">open_in_new</span>
                        ABSEN
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveNote({ course_id: course.id, course: { name: course.name } }); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-muted-divider bg-white/60 backdrop-blur-sm font-metadata text-metadata font-semibold text-primary hover:bg-white active:scale-95 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]" data-icon="edit_note">edit_note</span>
                        CATAT
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#0D0D0D] text-white rounded-full flex items-center justify-center shadow-lg z-40 hover:scale-105 active:scale-95 transition-transform"
        onClick={() => setShowAddModal(true)}
        aria-label="Tambah Jadwal"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {showAddModal && (
        <AddSchedule onClose={() => setShowAddModal(false)} onSuccess={() => fetchCourses()} />
      )}

      {editingSchedule && (
        <EditSchedule 
          schedule={editingSchedule.schedule} 
          color={editingSchedule.color}
          icon={editingSchedule.icon}
          onClose={() => setEditingSchedule(null)} 
          onSuccess={() => {
            setEditingSchedule(null);
            fetchCourses();
          }} 
        />
      )}

      {activeNote && (
        <QuickNote
          course_id={activeNote.course_id}
          course_name={activeNote.course?.name || 'Unknown Course'}
          date={selectedDate}
          onClose={() => setActiveNote(null)}
          onSuccess={() => fetchCourses()}
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
          
          {/* Item 2 (Active) */}
          <button 
            className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform"
            onClick={() => navigate('/schedules')}
          >
            <div className="flex items-center justify-center bg-[#0D0D0D] text-[#FFFFFF] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            </div>
            <span className="font-metadata text-[10px] text-[#0D0D0D] font-bold">Jadwal</span>
          </button>

          {/* Item 3 (Inactive) */}
          <button 
            className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform"
            onClick={() => navigate('/tasks')}
          >
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>assignment</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Tugas</span>
          </button>

          {/* Item 4 (Inactive) - KELAS */}
          <button 
            className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform"
            onClick={() => navigate('/courses')}
          >
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>class</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Kelas</span>
          </button>

          {/* Item 5 (Inactive) - PROYEK */}
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform" onClick={() => navigate('/projects')}>
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>folder_open</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Proyek</span>
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <LogoutModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} />
    </div>
  );
}
