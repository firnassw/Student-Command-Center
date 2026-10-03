import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCourseTheme } from '../utils/courseTheme';
import MeetingDetail from './MeetingDetail';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface CourseDetailProps {
  courseId: string;
  onBack: () => void;
}

export default function CourseDetail({ courseId, onBack }: CourseDetailProps) {
  const [course, setCourse] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch Meetings with relational count
        const { data: meetingsData, error: meetingsError } = await supabase
          .from('meetings')
          .select('*, notes(count), materials(count)')
          .eq('course_id', courseId)
          .order('meeting_number', { ascending: false });

        if (meetingsError) throw meetingsError;
        setMeetings(meetingsData || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FFFFFF] flex flex-col items-center justify-center p-6">
        <p className="text-error font-medium text-center mb-4">{error || 'Course not found'}</p>
        <button onClick={onBack} className="px-6 py-2 bg-surface-container rounded-full text-on-surface font-label-medium">Kembali</button>
      </div>
    );
  }

  const theme = getCourseTheme(course.name);

  if (selectedMeetingId) {
    return <MeetingDetail meetingId={selectedMeetingId} onBack={() => setSelectedMeetingId(null)} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFFFF] flex flex-col antialiased animate-in slide-in-from-right sm:fade-in duration-300 overflow-y-auto overflow-x-hidden">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky bg-[#FFFFFF]/90 backdrop-blur-md z-40 border-b border-[#EBEAE6]">
        <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full max-w-2xl mx-auto">
          <button 
            onClick={onBack} 
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low -ml-2"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-h1-mobile text-[#191B1F] font-extrabold flex-1 text-center pr-8">Mata Kuliah</h1>
        </div>
      </header>

      <main className="flex-grow w-full max-w-2xl mx-auto px-4 pt-6 pb-32 flex flex-col gap-8">
        {/* Course Header Card */}
        <section className={`rounded-[24px] p-6 shadow-sm flex flex-col gap-4 ${theme.bgColor}`}>
          <div className="w-12 h-12 rounded-xl bg-ink-on-dark text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{theme.icon}</span>
          </div>
          <div>
            <h2 className="font-h1 text-[24px] font-bold text-on-background mb-1">{course.name}</h2>
            <p className="font-metadata text-[13px] text-on-surface-variant">
              3 SKS · Pak Budi · {course.room || 'Lab 2'}
            </p>
          </div>
        </section>

        {/* Meetings Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-h2 text-[18px] font-bold text-on-background">Pertemuan</h3>
            <span className="bg-surface-container-high text-on-surface px-2.5 py-0.5 rounded-full font-metadata text-[12px] font-bold">
              {meetings.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {meetings.length === 0 ? (
              <div className="bg-surface-container-lowest border border-dashed border-muted-divider rounded-xl p-6 text-center text-on-surface-variant font-metadata">
                Belum ada pertemuan untuk mata kuliah ini.
              </div>
            ) : (
              meetings.map((meeting) => {
                const notesCount = meeting.notes?.[0]?.count || 0;
                const materialsCount = meeting.materials?.[0]?.count || 0;
                const meetingDate = new Date(meeting.date);
                
                return (
                  <div 
                    key={meeting.id} 
                    onClick={() => setSelectedMeetingId(meeting.id)}
                    className="flex items-start gap-4 p-4 rounded-[20px] bg-surface-container-lowest hover:bg-surface-container-low hover:opacity-90 transition-all cursor-pointer border border-muted-divider shadow-sm"
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-full ${theme.bgColor} flex items-center justify-center text-ink-on-dark font-display-numeric font-bold text-[18px]`}>
                      {meeting.meeting_number}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-h2 text-[16px] font-bold text-on-background truncate max-w-[200px] sm:max-w-[300px]">
                          {meeting.topic || `Pertemuan ${meeting.meeting_number}`}
                        </h4>
                        <span className="font-metadata text-[11px] font-semibold text-on-surface-variant whitespace-nowrap ml-2 mt-1 uppercase tracking-wider">
                          {format(meetingDate, 'EEEE, d MMM', { locale: localeId })}
                        </span>
                      </div>
                      
                      {notesCount === 0 && materialsCount === 0 ? (
                        <div className="flex items-center gap-3 text-outline font-metadata text-[13px] mt-2">
                          <span className="italic">Belum ada catatan</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-on-surface-variant font-metadata text-[13px] mt-2">
                          {notesCount > 0 && (
                            <span className="flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[16px]">description</span> 
                              1 catatan
                            </span>
                          )}
                          
                          {notesCount > 0 && materialsCount > 0 && (
                            <span className="w-1 h-1 rounded-full bg-muted-divider"></span>
                          )}
                          
                          {materialsCount > 0 && (
                            <span className="flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[16px]">folder_open</span> 
                              {materialsCount} materi
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
