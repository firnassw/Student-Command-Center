import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getCourseTheme } from '../utils/courseTheme';
import AddMaterial from './AddMaterial';
import QuickNote from './QuickNote';

interface MeetingDetailProps {
  meetingId: string;
  onBack: () => void;
}

export default function MeetingDetail({ meetingId, onBack }: MeetingDetailProps) {
  const [meeting, setMeeting] = useState<any>(null);
  const [note, setNote] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  const fetchMeetingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meetingResponse, noteResponse, materialsResponse] = await Promise.all([
        supabase
          .from('meetings')
          .select('*, courses(name)')
          .eq('id', meetingId)
          .single(),
        supabase
          .from('notes')
          .select('*')
          .eq('meeting_id', meetingId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('materials')
          .select('*')
          .eq('meeting_id', meetingId)
      ]);

      if (meetingResponse.error) throw meetingResponse.error;
      if (noteResponse.error) throw noteResponse.error;
      if (materialsResponse.error) throw materialsResponse.error;

      setMeeting(meetingResponse.data);
      setNote(noteResponse.data && noteResponse.data.length > 0 ? noteResponse.data[0] : null);
      setMaterials(materialsResponse.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (meetingId) {
      fetchMeetingData();
    }
  }, [meetingId]);

  const refreshMaterials = () => {
    fetchMeetingData(); // Refresh data setelah material ditambahkan
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#FFFFFF] flex flex-col items-center justify-center p-6">
        <p className="text-error font-medium text-center mb-4">{error || 'Pertemuan tidak ditemukan'}</p>
        <button onClick={onBack} className="px-6 py-2 bg-surface-container rounded-full text-on-surface font-label-medium">Kembali</button>
      </div>
    );
  }

  const meetingDate = new Date(meeting.date);

  const handleMaterialClick = async (material: any) => {
    if (material.external_url) {
      window.open(material.external_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (material.storage_path) {
      const { data } = supabase.storage.from('course_materials').getPublicUrl(material.storage_path);
      if (data && data.publicUrl) {
        window.open(data.publicUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const theme = meeting ? getCourseTheme(meeting.courses?.name) : null;

  if (isAddingMaterial && meeting) {
    return (
      <AddMaterial 
        meetingId={meetingId}
        courseName={meeting.courses?.name || 'Mata Kuliah'}
        meetingNumber={meeting.meeting_number}
        onBack={() => {
          setIsAddingMaterial(false);
          refreshMaterials();
        }}
      />
    );
  }

  if (isEditingNote && meeting) {
    return (
      <QuickNote 
        course_id={meeting.course_id}
        course_name={meeting.courses?.name || 'Mata Kuliah'}
        date={new Date(meeting.date)}
        onClose={() => setIsEditingNote(false)}
        onSuccess={() => {
          setIsEditingNote(false);
          refreshMaterials(); 
        }}
      />
    );
  }

  return (
    <div className={`fixed inset-0 z-[100] ${theme?.bgColor || 'bg-[#FFFFFF]'} flex flex-col antialiased animate-in slide-in-from-right sm:fade-in duration-300 overflow-y-auto overflow-x-hidden`}>
      
      {/* Header */}
      <header className={`w-full top-0 sticky ${theme?.bgColor || 'bg-[#FFFFFF]'}/90 backdrop-blur-md z-40`}>
        <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-2xl mx-auto">
          <button onClick={onBack} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-black" aria-label="Kembali">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex items-center">
            <button className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-black" aria-label="Edit Pertemuan">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-2xl mx-auto px-5 pt-2 pb-32 flex flex-col">
        
        {/* Meeting Title & Date Box Section */}
        <section className="flex items-start gap-4 mb-6">
          <div className="w-[72px] h-[76px] rounded-[16px] bg-ink-on-dark flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
            <span className="font-display-numeric font-extrabold text-[28px] leading-tight tracking-tight text-white">{format(meetingDate, 'dd')}</span>
            <span className="font-body font-bold text-[11px] tracking-widest text-white/80 uppercase mt-0.5">{format(meetingDate, 'MMM', { locale: localeId })}</span>
          </div>

          <div className="flex flex-col justify-center pt-0.5">
            <h1 className="font-h1 text-[24px] font-extrabold leading-tight tracking-tight text-black mb-1 line-clamp-2">
              {meeting.topic || `Pertemuan ${meeting.meeting_number}`}
            </h1>
            <p className="text-[13px] leading-relaxed font-medium text-on-surface-variant">
              {meeting.courses?.name || 'Mata Kuliah Tidak Diketahui'}
            </p>
            <p className="text-[12px] text-outline font-normal">
              {format(meetingDate, 'EEEE, d MMMM yyyy', { locale: localeId })}
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-5 flex-1">
          {/* Notes Card Section */}
          <section className="bg-surface-container-lowest rounded-[24px] p-5 shadow-sm border border-black/[0.04] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[20px]">description</span>
                <h2 className="font-h2 text-[16px] font-bold tracking-tight text-black">Catatan</h2>
              </div>
              {note && <span className="text-[11px] font-bold text-outline bg-surface-container px-2.5 py-0.5 rounded-full uppercase tracking-wider">Tersimpan</span>}
            </div>

            <div className="mb-5 min-h-[60px]">
              {note ? (
                <>
                  <h3 className="font-h2 text-[17px] font-bold text-on-surface leading-snug mb-2">
                    {meeting.topic || `Catatan Pertemuan ${meeting.meeting_number}`}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                    {note.content}
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <p className="text-[13px] text-outline italic">Belum ada catatan untuk pertemuan ini.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-muted-divider flex items-center justify-start">
              <button 
                onClick={() => setIsEditingNote(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-muted-divider text-[12px] font-bold text-on-surface bg-surface-container-lowest hover:bg-surface-container-low active:scale-95 transition-all shadow-sm tracking-wider"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>{note ? 'EDIT CATATAN' : 'BUAT CATATAN'}</span>
              </button>
            </div>
          </section>

          {/* Materials Section */}
          <section className="flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-h2 text-[17px] font-bold tracking-tight text-black">
                Materi ({materials.length})
              </h2>
              <button 
                onClick={() => setIsAddingMaterial(true)}
                className="inline-flex items-center gap-1 text-[13px] font-bold text-on-surface-variant hover:text-black active:opacity-75 uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tambah</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {materials.length === 0 ? (
                <div className="bg-surface-container-lowest/50 border border-dashed border-black/10 rounded-[20px] p-6 text-center text-outline font-metadata text-[13px] italic">
                  Belum ada materi terlampir.
                </div>
              ) : (
                materials.map((material) => (
                  <article 
                    key={material.id} 
                    onClick={() => handleMaterialClick(material)}
                    className="bg-surface-container-lowest rounded-[20px] p-4 flex items-center justify-between border border-black/[0.04] shadow-sm hover:shadow-md hover:border-black/10 active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-[14px] bg-ink-on-dark flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined text-[24px]">
                          {material.external_url ? 'link' : material.type === 'pdf' ? 'picture_as_pdf' : 'description'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-h2 font-bold text-[15px] text-black leading-snug truncate">
                          {material.name}
                        </span>
                        <span className="text-[12px] font-medium text-outline mt-0.5 truncate max-w-[210px]">
                          {material.external_url ? material.external_url : `Berkas ${material.type?.toUpperCase() || 'File'}`}
                        </span>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-outline group-hover:text-black transition-colors shrink-0" aria-label="Buka">
                      <span className="material-symbols-outlined text-[20px]">
                        {material.external_url ? 'open_in_new' : 'arrow_forward'}
                      </span>
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
