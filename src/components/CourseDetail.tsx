import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import MeetingDetail from './MeetingDetail';

interface Course {
  id: string;
  name: string;
  code: string;
  lecturer: string;
  sks: number;
  color: string;
}

import { getCourseTheme } from '../utils/courseTheme';

export default function CourseDetail({ courseId, onBack }: { courseId?: string, onBack?: () => void }) {
  const params = useParams();
  const id = courseId || params.id;
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseAndMeetings();
  }, [id]);

  const fetchCourseAndMeetings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
        
      if (courseError) {
        setErrorMsg(courseError.message + ' | ID: ' + id);
        return;
      }
      setCourse(courseData);

      // Fetch meetings with related notes and materials
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          *,
          notes(id),
          materials(id)
        `)
        .eq('course_id', id)
        .order('meeting_number', { ascending: false });

      if (!meetingsError && meetingsData) {
        // Map the data to include counts
        const formattedMeetings = meetingsData.map(m => ({
          ...m,
          notesCount: m.notes ? m.notes.length : 0,
          materialsCount: m.materials ? m.materials.length : 0
        }));
        setMeetings(formattedMeetings);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="animate-pulse text-gray-500 font-medium">Memuat...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 mb-2">Mata kuliah tidak ditemukan. (ID: {id})</p>
        {errorMsg && <p className="text-red-500 text-sm mb-4">Error: {errorMsg}</p>}
        <button 
          onClick={() => onBack ? onBack() : navigate('/courses')}
          className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm mt-4"
        >
          KEMBALI
        </button>
      </div>
    );
  }

  if (selectedMeetingId) {
    return (
      <MeetingDetail 
        meetingId={selectedMeetingId} 
        onBack={() => {
          setSelectedMeetingId(null);
          fetchCourseAndMeetings(); // Refresh data in case they added a note/material
        }} 
      />
    );
  }

  const theme = getCourseTheme(course.name);

  return (
    <div className="bg-white min-h-screen w-full flex flex-col font-sans">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white flex items-center justify-between px-4 h-16 max-w-2xl mx-auto left-0 right-0">
        <button 
          onClick={() => onBack ? onBack() : navigate('/courses')}
          aria-label="Back" 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95 text-[#141414]"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-lg text-[#141414] truncate px-4 text-center w-full">Mata Kuliah</h1>
        <button 
          aria-label="More options" 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95 text-[#141414]"
        >
          <span className="material-symbols-outlined text-[24px]">more_vert</span>
        </button>
      </header>

      <main className="pt-20 px-6 max-w-2xl mx-auto space-y-8 w-full pb-10">
        {/* Course Header Card */}
        <section className={`rounded-[24px] p-6 shadow-sm flex flex-col gap-4 ${theme.bgColor}`}>
          <div className="w-12 h-12 rounded-[16px] bg-[#141414] text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {theme.icon}
            </span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-2xl text-[#141414] mb-1">{course.name}</h2>
            <p className="font-metadata text-sm text-[#141414]/70 font-semibold tracking-wide">
              {course.sks} SKS · {course.lecturer || 'Belum ada dosen'}
            </p>
          </div>
        </section>

        {/* Meetings Section */}
        <section className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="font-headline font-bold text-xl text-[#141414]">Pertemuan</h3>
              <span className="bg-gray-100 text-[#141414] px-2 py-0.5 rounded-full font-metadata font-bold text-xs">
                {meetings.length}
              </span>
            </div>
            
            <div className="space-y-4">
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic text-sm">Belum ada pertemuan untuk mata kuliah ini.</p>
                </div>
              ) : meetings.map((meeting, index) => {
                const meetingDate = meeting.date ? new Date(meeting.date) : new Date();
                const formattedDate = format(meetingDate, 'EEEE, d MMMM', { locale: localeId });
                // We'll just assume the most recent meeting is active (index === 0) for visual flair
                const isActive = index === 0;

                return (
                <div 
                  key={meeting.id}
                  onClick={() => setSelectedMeetingId(meeting.id)}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 shadow-sm hover:border-gray-300"
                >
                  <div className={`w-12 h-12 shrink-0 rounded-[16px] ${isActive ? theme.bgColor : 'bg-gray-100'} flex items-center justify-center text-[#141414] font-headline font-bold text-xl`}>
                    {meeting.meeting_number || (meetings.length - index)}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-headline font-bold text-[17px] text-[#141414] truncate">{meeting.topic || `Pertemuan ${meeting.meeting_number || (meetings.length - index)}`}</h4>
                      <span className="font-metadata font-semibold text-xs text-gray-400 whitespace-nowrap ml-2 mt-1">{formattedDate}</span>
                    </div>
                    
                    {meeting.notesCount > 0 || meeting.materialsCount > 0 ? (
                      <div className="flex items-center gap-3 text-gray-500 font-medium text-xs mt-2">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">description</span> 
                          {meeting.notesCount} catatan
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">folder_open</span> 
                          {meeting.materialsCount} materi
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-400 font-medium text-xs mt-2">
                        <span className="italic">Belum ada catatan</span>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
        </section>
      </main>
    </div>
  );
}
