import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseToJakartaISO } from '../lib/timeUtils';

export interface Course {
  id: string;
  name: string;
  room?: string;
  user_id: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  course?: {
    name: string;
    attendance_url?: string;
    room?: string;
  };
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    // RLS: We filter by user_id explicitly, though RLS policies handle it too
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCourses(data);
    }
    setLoading(false);
  };

  const addCourse = async (course: Omit<Course, 'id' | 'created_at' | 'user_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('courses')
      .insert([
        { ...course, user_id: user.id }
      ])
      .select()
      .single();

    if (!error && data) {
      setCourses([data, ...courses]);
      return data;
    }
    return null;
  };

  const deleteCourse = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete associated tasks first because schema uses 'on delete set null'
    await supabase
      .from('tasks')
      .delete()
      .eq('course_id', id)
      .eq('user_id', user.id);

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return { courses, loading, fetchCourses, addCourse, deleteCourse };
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    const { data, error } = await supabase
      .from('schedules')
      .select('*, courses!inner(name, attendance_url)')
      .eq('courses.user_id', user.id)
      .order('start_time', { ascending: true });

    if (!error && data) {
      const formatted = data.map((s: any) => ({
        ...s,
        course: s.courses ? { name: s.courses.name, attendance_url: s.courses.attendance_url } : undefined
      }));
      setSchedules(formatted);
    }
    setLoading(false);
  };

  const addSchedule = async (scheduleInput: { course_name: string, room: string, lecturer?: string, day_of_week: number, start_time: string, end_time: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // ensure time is HH:mm:ss
    const start_time = scheduleInput.start_time.length === 5 ? `${scheduleInput.start_time}:00` : scheduleInput.start_time;
    const end_time = scheduleInput.end_time.length === 5 ? `${scheduleInput.end_time}:00` : scheduleInput.end_time;

    // 0. Overlap Validation
    const { data: existingSchedules, error: fetchError } = await supabase
      .from('schedules')
      .select('start_time, end_time, courses!inner(name, user_id)')
      .eq('courses.user_id', user.id)
      .eq('day_of_week', scheduleInput.day_of_week);

    if (fetchError) {
      throw new Error(`Gagal memvalidasi jadwal: ${fetchError.message}`);
    }

    if (existingSchedules) {
      for (const sched of existingSchedules) {
        if (start_time < sched.end_time && end_time > sched.start_time) {
          throw new Error(`Gagal: Jadwal ini bentrok dengan mata kuliah ${(sched.courses as any)?.name || 'Lainnya'}!`);
        }
      }
    }

    // 1. Find or Create Course
    let courseId = '';
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', scheduleInput.course_name)
      .limit(1)
      .maybeSingle();

    if (existingCourse) {
      courseId = existingCourse.id;
      if (scheduleInput.room || scheduleInput.lecturer) {
        const updates: any = {};
        if (scheduleInput.room) updates.room = scheduleInput.room;
        if (scheduleInput.lecturer) updates.lecturer = scheduleInput.lecturer;
        
        const { error: updateError } = await supabase.from('courses').update(updates).eq('id', courseId);
        if (updateError) throw new Error(`Gagal update ruangan/dosen: ${updateError.message}`);
      }
    } else {
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert([{ name: scheduleInput.course_name, room: scheduleInput.room, lecturer: scheduleInput.lecturer, user_id: user.id }])
        .select()
        .single();
      
      if (insertError || !newCourse) {
        throw new Error(`Gagal membuat kelas baru: ${insertError?.message || 'Unknown error'}`);
      }
      courseId = newCourse.id;
    }

    // 2. Insert Schedule
    const { data, error } = await supabase
      .from('schedules')
      .insert([
        { 
          course_id: courseId, 
          day_of_week: scheduleInput.day_of_week,
          start_time, 
          end_time
        }
      ])
      .select('*, courses(name, attendance_url, room)')
      .single();

    if (error || !data) {
      throw new Error(`Gagal menyimpan jadwal: ${error?.message || 'Unknown error'}`);
    }

    const formatted = {
      ...data,
      course: data.courses ? { name: data.courses.name, attendance_url: data.courses.attendance_url, room: data.courses.room } : undefined
    };
    setSchedules([...schedules, formatted].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
    return formatted;
  };

  const deleteSchedule = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Gagal menghapus jadwal: ${error.message}`);
    } else {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const updateSchedule = async (id: string, courseId: string, scheduleInput: { room: string, day_of_week: number, start_time: string, end_time: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const start_time = scheduleInput.start_time.length === 5 ? `${scheduleInput.start_time}:00` : scheduleInput.start_time;
    const end_time = scheduleInput.end_time.length === 5 ? `${scheduleInput.end_time}:00` : scheduleInput.end_time;

    // 0. Overlap Validation
    const { data: existingSchedules, error: fetchError } = await supabase
      .from('schedules')
      .select('id, start_time, end_time, courses!inner(name, user_id)')
      .eq('courses.user_id', user.id)
      .eq('day_of_week', scheduleInput.day_of_week)
      .neq('id', id);

    if (fetchError) {
      throw new Error(`Gagal memvalidasi jadwal: ${fetchError.message}`);
    }

    if (existingSchedules) {
      for (const sched of existingSchedules) {
        if (start_time < sched.end_time && end_time > sched.start_time) {
          throw new Error(`Gagal: Jadwal ini bentrok dengan mata kuliah ${(sched.courses as any)?.name || 'Lainnya'}!`);
        }
      }
    }

    // 1. Update Course Room
    if (scheduleInput.room !== undefined) {
      const { error: updateError } = await supabase.from('courses').update({ room: scheduleInput.room }).eq('id', courseId);
      if (updateError) throw new Error(`Gagal update ruangan: ${updateError.message}`);
    }

    // 2. Update Schedule
    const { data, error } = await supabase
      .from('schedules')
      .update({ 
        day_of_week: scheduleInput.day_of_week,
        start_time, 
        end_time
      })
      .eq('id', id)
      .select('*, courses(name, attendance_url, room)')
      .single();

    if (error || !data) {
      throw new Error(`Gagal memperbarui jadwal: ${error?.message || 'Unknown error'}`);
    }

    const formatted = {
      ...data,
      course: data.courses ? { name: data.courses.name, attendance_url: data.courses.attendance_url, room: data.courses.room } : undefined
    };
    
    setSchedules(prev => prev.map(s => s.id === id ? formatted : s).sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
    return formatted;
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return { schedules, loading, fetchSchedules, addSchedule, deleteSchedule, updateSchedule };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  course_id: string;
  user_id: string;
  created_at: string;
  course?: {
    name: string;
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    // Fetch nearest deadline (limit 1)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, courses(name)')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('deadline', { ascending: true })
      .limit(1);

    if (!error && data) {
      // Map joined data
      const formattedTasks = data.map(t => ({
        ...t,
        course: t.courses ? { name: t.courses.name } : undefined
      }));
      setTasks(formattedTasks);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { tasks, loading, fetchTasks };
}
