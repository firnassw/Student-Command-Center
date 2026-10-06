import React, { useMemo } from 'react';
import { useSchedules, useTasks } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { toZonedTime, format } from 'date-fns-tz';
import LogoutModal from './LogoutModal';
import QuickNote from './QuickNote';
import { getCourseTheme } from '../utils/courseTheme';
import { calculateUrgency, getUrgencyStyles } from '../utils/urgencyCalculator';
import { usePushSubscription } from '../hooks/usePushSubscription';

// Helper to format date in Jakarta timezone
const getJakartaDateInfo = () => {
  const timeZone = 'Asia/Jakarta';
  const nowDate = toZonedTime(new Date(), timeZone);
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const parts = formatter.formatToParts(nowDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  return `${getPart('weekday')}, ${getPart('day')} ${getPart('month')}`;
};



const formatTimeJakarta = (timeStr: string) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5).replace(':', '.');
};

const getDaysUntilDeadline = (dateStr: string) => {
  const deadline = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diffHours = Math.ceil((deadline - now) / (1000 * 60 * 60));
  
  if (diffHours < 24 && diffHours > 0) return `${diffHours} jam lagi`;
  if (diffHours <= 0) return 'Terlewat';
  return `${Math.ceil(diffHours / 24)} hari lagi`;
};

const getDeadlineDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit' });
  const month = date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', month: 'short' }).toUpperCase();
  return { day, month };
};

import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { schedules, loading: schedulesLoading, fetchSchedules } = useSchedules();
  const { tasks, loading: tasksLoading } = useTasks();
  const [userName, setUserName] = React.useState('Pelajar');
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [activeNote, setActiveNote] = React.useState<any>(null);
  const { subscribeToPush, isSubscribing, isSubscribed, error } = usePushSubscription();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.name) {
        setUserName(session.user.user_metadata.name);
      } else if (session?.user?.email) {
        setUserName(session.user.email.split('@')[0]);
      }
    });
  }, []);

  const todaySchedules = useMemo(() => {
    const today = toZonedTime(new Date(), 'Asia/Jakarta').getDay();
    const todayDayOfWeek = today === 0 ? 7 : today;
    return schedules.filter(s => s.day_of_week === todayDayOfWeek);
  }, [schedules]);

  const nearestTask = tasks.length > 0 ? tasks[0] : null;

  const firstName = userName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="bg-[#FFFFFF] text-primary font-body antialiased min-h-screen w-full flex flex-col">
      {/* Global Header (Full Width) */}
      <header className="w-full top-0 sticky bg-[#FFFFFF] z-40 border-b border-[#EBEAE6]">
        <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full">
          <div className="flex flex-col gap-[2px]">
            <p className="font-metadata text-metadata text-on-surface-variant leading-none">{getJakartaDateInfo()}</p>
            <h1 className="font-h1-mobile text-h1-mobile text-[#191B1F] font-extrabold leading-none">Halo, {firstName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              aria-label="Logout" 
              className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <span className="material-symbols-outlined text-[24px]" data-icon="logout">logout</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-[#F8E9C8] flex items-center justify-center font-h1-mobile font-bold text-ink-on-dark shrink-0 cursor-default">
              {initial}
            </div>
          </div>
        </div>
      </header>

      {/* Push Notification Banner */}
      {!isSubscribed && (
        <div className="w-full max-w-2xl mx-auto px-4 mt-4 mb-2">
          <div className="bg-[#191B1F] rounded-[16px] p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#FFFFFF] text-[20px]">notifications_active</span>
              </div>
              <div className="flex flex-col">
                <span className="font-h2 text-[14px] font-bold text-[#FFFFFF]">Pengingat Absen Aktif</span>
                <span className="text-[12px] text-white/70">Terima notifikasi 15 menit sebelum kelas</span>
              </div>
            </div>
            <button 
              onClick={subscribeToPush}
              disabled={isSubscribing}
              className="bg-[#FFFFFF] text-[#191B1F] px-4 py-2 rounded-full font-bold text-[12px] hover:bg-[#F3F3F3] active:scale-95 transition-all whitespace-nowrap ml-2 disabled:opacity-50"
            >
              {isSubscribing ? 'MEMPROSES...' : 'AKTIFKAN'}
            </button>
          </div>
          {error && <p className="text-error text-[11px] mt-2 font-medium px-2">{error}</p>}
        </div>
      )}

      {/* Main Content (Centered, Max Width) */}
      <main className="flex-grow w-full max-w-2xl mx-auto px-4 pt-6 pb-28 md:pb-32 flex flex-col gap-8">
        
        {/* Jadwal Hari Ini */}
        <section>
          <h2 className="font-h2 text-h2 text-primary mb-4">Jadwal Hari Ini</h2>
          <div className="flex flex-col gap-4">
            {schedulesLoading ? (
              <p className="text-on-surface-variant text-sm py-4">Memuat jadwal...</p>
            ) : todaySchedules.length === 0 ? (
              <div className="bg-surface-container-low rounded-[24px] p-6 text-center border border-dashed border-muted-divider w-full">
                <p className="text-on-surface-variant font-label-medium">No classes today</p>
              </div>
            ) : (
              todaySchedules.map((schedule) => {
                const theme = getCourseTheme(schedule.course?.name);
                return (
                <div key={schedule.id} className="flex gap-4 items-stretch w-full">
                  {/* Time Column */}
                  <div className="flex flex-col items-end w-12 shrink-0 py-1">
                    <span className="font-label-medium text-label-medium text-primary">{formatTimeJakarta(schedule.start_time)}</span>
                    <div className="flex-grow w-px bg-muted-divider my-2 mr-1"></div>
                    <span className="font-metadata text-metadata text-on-surface-variant">{formatTimeJakarta(schedule.end_time)}</span>
                  </div>

                  {/* Content Card */}
                  <div className={`${theme.bgColor} rounded-[24px] p-4 flex-grow relative overflow-hidden w-full`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-ink-on-dark text-on-primary w-12 h-12 flex items-center justify-center rounded-[16px] shrink-0">
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{theme.icon}</span>
                      </div>
                      <div className="pt-1">
                        <h3 className="font-h2 text-h2 text-primary">{schedule.course?.name || 'Unknown Course'}</h3>
                        <p className="font-metadata text-metadata text-status-safe-fg mt-1">Ruang Kelas</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.open('https://spada.upnyk.ac.id/login/index.php', '_blank', 'noopener,noreferrer')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-muted-divider bg-white/50 backdrop-blur-sm font-metadata text-metadata text-primary hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]" data-icon="open_in_new">open_in_new</span>
                        ABSEN
                      </button>
                      <button 
                        onClick={() => setActiveNote(schedule)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-muted-divider bg-white/50 backdrop-blur-sm font-metadata text-metadata text-primary hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]" data-icon="edit_note">edit_note</span>
                        CATAT
                      </button>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        </section>

        {/* Deadline Terdekat */}
        <section>
          <h2 className="font-h2 text-h2 text-primary mb-4">Deadline Terdekat</h2>
          
          {tasksLoading ? (
            <p className="text-on-surface-variant text-sm py-4">Memuat tugas...</p>
          ) : !nearestTask ? (
            <div className="bg-surface-container-low rounded-[24px] p-6 text-center border border-dashed border-muted-divider w-full">
              <p className="text-on-surface-variant font-label-medium">No upcoming deadlines</p>
            </div>
          ) : (
            (() => {
              const urgencyInfo = calculateUrgency(nearestTask.deadline);
              const styles = getUrgencyStyles(urgencyInfo.type);
              
              return (
                <div className={`${styles.cardBg} rounded-[24px] p-4 flex gap-3 items-start w-full cursor-pointer hover:-translate-y-1 transition-transform`} onClick={() => navigate('/tasks')}>
                  <div className="bg-ink-on-dark rounded-[16px] w-16 h-16 flex flex-col items-center justify-center text-on-primary shrink-0">
                    <span className="font-display-numeric text-display-numeric leading-none -mb-1">{getDeadlineDate(nearestTask.deadline).day}</span>
                    <span className="font-metadata text-[10px] tracking-wider uppercase opacity-80 mt-1">{getDeadlineDate(nearestTask.deadline).month}</span>
                  </div>
                  
                  <div className="flex-grow pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${styles.dotBg}`}></div>
                      <span className={`font-metadata text-metadata ${styles.textColor} font-bold tracking-wide uppercase`}>
                        {urgencyInfo.text}
                      </span>
                    </div>
                    <h3 className="font-h2 text-h2 text-primary mb-1">{nearestTask.title}</h3>
                    <p className="font-metadata text-metadata text-on-surface-variant mb-2">{nearestTask.course?.name || 'Umum'}</p>
                    
                    <button className="flex items-center justify-center w-full py-2 rounded-full border border-black/10 bg-white/40 font-label-medium text-label-medium text-primary hover:bg-white/70 transition-colors">
                      LIHAT TUGAS
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </section>

      </main>

      {/* Global Bottom Navbar (Full Width) */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#FFFFFF] border-t border-[#EBEAE6] z-50 pb-safe">
        <div className="flex justify-around items-center px-4 py-2 max-w-4xl mx-auto w-full">
          {/* Item 1 (Active) */}
          <button 
            className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center justify-center bg-[#0D0D0D] text-[#FFFFFF] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            </div>
            <span className="font-metadata text-[10px] text-[#0D0D0D] font-bold">Beranda</span>
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

          {/* Item 4 (Inactive) */}
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform">
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>class</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Kelas</span>
          </button>

          {/* Item 5 (Inactive) */}
          <button className="flex flex-col items-center justify-center w-16 group active:scale-90 transition-transform">
            <div className="flex items-center justify-center text-[#848484] rounded-[16px] w-12 h-8 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>folder_open</span>
            </div>
            <span className="font-metadata text-[10px] text-[#848484]">Proyek</span>
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <LogoutModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} />

      {activeNote && (
        <QuickNote
          course_id={activeNote.course_id}
          course_name={activeNote.course?.name || 'Unknown Course'}
          date={new Date()}
          onClose={() => setActiveNote(null)}
          onSuccess={() => fetchSchedules()}
        />
      )}
    </div>
  );
}
