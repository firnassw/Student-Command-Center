import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getCourseTheme } from '../utils/courseTheme';
import AddMaterial from './AddMaterial';

interface QuickNoteProps {
  course_id: string; 
  course_name: string;
  date: Date;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickNote({ course_id, course_name, date, onClose, onSuccess }: QuickNoteProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [meetingNumber, setMeetingNumber] = useState<number>(1);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

  React.useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const { data: meetingData, error: rpcError } = await supabase.rpc('get_or_create_meeting', {
          p_course_id: course_id,
          p_date: formattedDate
        });
        if (rpcError) throw rpcError;
        if (meetingData && meetingData.id) {
          setMeetingId(meetingData.id);
          setMeetingNumber(meetingData.meeting_number || 1);
          setTitle(meetingData.topic || '');
          
          // Load existing note
          const { data: noteData } = await supabase.from('notes').select('content').eq('meeting_id', meetingData.id).order('created_at', { ascending: false }).limit(1);
          if (noteData && noteData.length > 0) setContent(noteData[0].content || '');

          // Load materials
          const { data: matData } = await supabase.from('materials').select('*').eq('meeting_id', meetingData.id);
          if (matData) setMaterials(matData);
        }
      } catch (err) {
        console.error('Error fetching meeting:', err);
      }
    };
    fetchMeeting();
  }, [course_id, date]);

  const refreshMaterials = async () => {
    if (!meetingId) return;
    const { data: matData } = await supabase.from('materials').select('*').eq('meeting_id', meetingId);
    if (matData) setMaterials(matData);
  };

  const handleSave = async () => {
    if (!meetingId) {
      setErrorMessage('Pertemuan belum diinisialisasi. Silakan tunggu sebentar.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setErrorMessage('Judul dan isi catatan tidak boleh kosong!');
      return;
    }
    
    setErrorMessage('');
    setIsSaving(true);
    try {
      // Simpan Judul Catatan (Update ke tabel meetings kolom topic)
      const { error: updateMeetingError } = await supabase
        .from('meetings')
        .update({ topic: title })
        .eq('id', meetingId);

      if (updateMeetingError) throw new Error(`Gagal menyimpan judul: ${updateMeetingError.message}`);

      // Simpan Konten (Upsert ke tabel notes)
      const { data: existingNotes } = await supabase
        .from('notes')
        .select('id')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingNotes && existingNotes.length > 0) {
        const { error: updateNoteError } = await supabase
          .from('notes')
          .update({ content: content })
          .eq('id', existingNotes[0].id);
        if (updateNoteError) throw new Error(`Gagal memperbarui isi catatan: ${updateNoteError.message}`);
      } else {
        const { error: insertNoteError } = await supabase
          .from('notes')
          .insert({
            meeting_id: meetingId,
            content: content
          });
        if (insertNoteError) throw new Error(`Gagal menyimpan isi catatan: ${insertNoteError.message}`);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAddingMaterial && meetingId) {
    return (
      <AddMaterial 
        meetingId={meetingId}
        courseName={course_name}
        meetingNumber={meetingNumber}
        onBack={() => {
          setIsAddingMaterial(false);
          refreshMaterials();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#FFFFFF] flex flex-col antialiased animate-in slide-in-from-right sm:fade-in duration-300 overflow-y-auto overflow-x-hidden">
      
      {/* Header */}
      <header className="w-full top-0 sticky bg-[#FFFFFF]/90 backdrop-blur-md z-40 border-b border-[#EBEAE6]">
        <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full max-w-2xl mx-auto">
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low -ml-2">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-h1-mobile text-[#191B1F] font-extrabold flex-1 text-center pr-8">Catatan Cepat</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-2xl mx-auto px-4 pt-6 pb-32 flex flex-col gap-6">
        
        {/* Context Header */}
        <section className={`${getCourseTheme(course_name).bgColor} rounded-[24px] p-5 flex items-center gap-4 w-full border border-muted-divider/30`}>
          <div className="w-16 h-16 bg-ink-on-dark rounded-[16px] flex flex-col items-center justify-center text-on-primary shrink-0 shadow-sm">
            <span className="font-display-numeric text-[24px] font-bold leading-none">{format(date, 'dd')}</span>
            <span className="font-label-medium text-[10px] uppercase tracking-wider text-inverse-primary mt-1 opacity-90">{format(date, 'MMM', { locale: localeId })}</span>
          </div>
          <div className="flex flex-col justify-center gap-1.5">
            <h2 className="font-h2 text-[18px] font-bold text-on-surface leading-snug">{course_name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-metadata text-[13px] text-on-surface-variant">
                {format(date, 'EEEE, d MMMM', { locale: localeId })}
              </p>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFFFFF]/50 border border-muted-divider gap-1">
                <span className="material-symbols-outlined text-[12px] text-status-safe-fg">check_circle</span>
                <span className="text-[9px] font-bold text-status-safe-fg uppercase tracking-wider">Otomatis</span>
              </div>
            </div>
          </div>
        </section>

        {/* Input Judul */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Judul Catatan</label>
          <input 
            className="w-full bg-[#FFFFFF] border border-muted-divider focus:border-primary focus:ring-1 focus:ring-primary rounded-[16px] px-4 py-3.5 font-body text-[15px] text-on-surface transition-all placeholder:text-outline-variant shadow-sm" 
            id="judul" 
            type="text" 
            placeholder="Masukkan judul catatan..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />
        </div>

        {/* Input Isi */}
        <div className="flex flex-col gap-2 flex-grow min-h-[250px]">
          <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Isi Catatan</label>
          <textarea 
            className="w-full flex-grow bg-[#FFFFFF] border border-muted-divider focus:border-primary focus:ring-1 focus:ring-primary rounded-[16px] px-4 py-3.5 font-body text-[15px] text-on-surface resize-none transition-all placeholder:text-outline-variant leading-relaxed shadow-sm min-h-[200px]" 
            id="isi" 
            placeholder="Ketik detail catatan, insight, atau tugas dari pertemuan ini..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSaving}
          ></textarea>
        </div>

        {/* Attachments */}
        <div className="flex flex-col gap-2">
          {materials.length > 0 && (
            <div className="flex items-center justify-between ml-1 mb-1">
              <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">Materi Terkait</label>
              <span className="bg-surface-container-high text-on-surface-variant text-[11px] font-bold px-2 py-0.5 rounded-full">{materials.length}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {materials.map((mat) => (
              <div key={mat.id} className="flex items-center justify-between p-3 rounded-[16px] border border-muted-divider bg-surface-container-lowest shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {mat.external_url ? 'link' : mat.type === 'pdf' ? 'picture_as_pdf' : 'description'}
                    </span>
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="font-body text-[14px] text-on-surface font-medium truncate">{mat.name}</span>
                    <span className="text-[11px] text-outline truncate">{mat.external_url ? 'Tautan Eksternal' : `Berkas ${mat.type?.toUpperCase()}`}</span>
                  </div>
                </div>
              </div>
            ))}

            <button 
              onClick={() => setIsAddingMaterial(true)}
              disabled={isSaving || !meetingId}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[16px] border-2 border-dashed border-muted-divider text-on-surface-variant hover:bg-surface-container-low hover:border-outline-variant transition-colors active:scale-[0.99] disabled:opacity-50 font-bold text-[13px] tracking-wider uppercase mt-1"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Tambah Materi
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#EBEAE6] z-50 px-4 py-4 pb-safe flex flex-col items-center shadow-[0px_-4px_16px_rgba(0,0,0,0.03)]">
        <div className="w-full max-w-2xl flex flex-col gap-2">
          {errorMessage && (
            <div className="bg-error-container text-on-error-container text-[13px] font-medium px-4 py-3 rounded-[12px] flex items-center gap-2 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {errorMessage}
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#191B1F] text-white font-bold text-[15px] h-[56px] rounded-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg hover:bg-black disabled:opacity-70 disabled:scale-100"
          >
            <span className={`material-symbols-outlined text-[20px] ${isSaving ? 'animate-spin' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {isSaving ? 'sync' : 'save'}
            </span>
            {isSaving ? 'MENYIMPAN...' : 'SIMPAN CATATAN'}
          </button>
        </div>
      </div>
    </div>
  );
}
