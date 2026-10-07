import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCourseTheme } from '../utils/courseTheme';

interface AddMaterialProps {
  meetingId: string;
  courseName: string;
  meetingNumber: number;
  onBack: () => void;
}

export default function AddMaterial({ meetingId, courseName, meetingNumber, onBack }: AddMaterialProps) {
  const [materialType, setMaterialType] = useState<'link' | 'file'>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = getCourseTheme(courseName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'ppt' || ext === 'pptx') return 'ppt';
    if (ext === 'doc' || ext === 'docx') return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
    return 'document'; // Fallback
  };

  const handleSave = async () => {
    setErrorMessage('');
    
    if (!title.trim()) {
      setErrorMessage('Judul materi tidak boleh kosong!');
      return;
    }

    if (materialType === 'link' && !url.trim()) {
      setErrorMessage('URL tidak boleh kosong!');
      return;
    }

    if (materialType === 'file' && !file) {
      setErrorMessage('Anda belum memilih file!');
      return;
    }

    setIsSaving(true);
    try {
      if (materialType === 'link') {
        const { error: insertError } = await supabase
          .from('materials')
          .insert({
            meeting_id: meetingId,
            name: title,
            type: 'link',
            external_url: url,
            storage_path: null
          });

        if (insertError) throw insertError;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Anda harus login terlebih dahulu.');

        const safeFilename = `${Date.now()}_${file!.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const storagePath = `materials/${user.id}/${meetingId}/${safeFilename}`;
        
        const { error: uploadError } = await supabase.storage
          .from('course_materials')
          .upload(storagePath, file!, { upsert: true });

        if (uploadError) throw new Error(`Gagal mengunggah file: ${uploadError.message}`);

        const extractedType = getFileType(file!.name);

        const { error: insertError } = await supabase
          .from('materials')
          .insert({
            meeting_id: meetingId,
            name: title,
            type: extractedType,
            storage_path: storagePath,
            external_url: null
          });

        if (insertError) throw insertError;
      }

      onBack();
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] ${theme.bgColor} flex flex-col antialiased animate-in slide-in-from-bottom sm:fade-in duration-300 overflow-y-auto overflow-x-hidden`}>
      
      {/* Header */}
      <header className={`w-full top-0 sticky ${theme.bgColor}/90 backdrop-blur-md z-40`}>
        <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full max-w-2xl mx-auto">
          <button onClick={onBack} className="text-on-surface hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-black/10 -ml-2" disabled={isSaving}>
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <h1 className="font-h1-mobile text-on-background font-extrabold flex-1 text-center pr-8">Tambah Materi</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-2xl mx-auto px-5 pt-4 pb-32 flex flex-col gap-6">
        
        {/* Context Card */}
        <section className="bg-surface-container-lowest/50 rounded-[20px] p-4 flex items-center gap-4 w-full border border-black/[0.04]">
          <div className="w-12 h-12 bg-ink-on-dark rounded-[12px] flex flex-col items-center justify-center text-on-primary shrink-0 shadow-sm">
            <span className="font-display-numeric text-[20px] font-bold leading-none">{meetingNumber}</span>
          </div>
          <div className="flex flex-col justify-center pt-0.5">
            <span className="font-metadata text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Konteks Kelas</span>
            <h2 className="font-h2 text-[15px] font-bold text-on-background leading-snug">{courseName}</h2>
          </div>
        </section>

        {/* Form Container */}
        <div className="bg-surface-container-lowest rounded-[24px] p-5 shadow-sm border border-black/[0.04] flex flex-col gap-6">
          
          {/* Toggle Switch */}
          <div className="flex bg-surface-container-low p-1 rounded-[16px]">
            <button 
              onClick={() => setMaterialType('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-label-medium text-[13px] transition-all ${materialType === 'link' ? 'bg-ink-on-dark text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">link</span>
              Tautan (URL)
            </button>
            <button 
              onClick={() => setMaterialType('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-label-medium text-[13px] transition-all ${materialType === 'file' ? 'bg-ink-on-dark text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Unggah File
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-2">
              <label className="font-label-medium text-[13px] text-on-background uppercase tracking-wider ml-1">Judul Materi</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul materi..."
                className="w-full bg-surface-container-lowest border border-muted-divider rounded-[16px] px-4 py-3.5 text-[14px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {materialType === 'link' ? (
              <div className="flex flex-col gap-2">
                <label className="font-label-medium text-[13px] text-on-background uppercase tracking-wider ml-1">Tautan (URL)</label>
                <input 
                  type="url" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-container-lowest border border-muted-divider rounded-[16px] px-4 py-3.5 text-[14px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <div className="mt-2 bg-status-safe-bg border border-status-safe-border rounded-[12px] p-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-safe-fg text-[18px] mt-0.5">info</span>
                  <p className="text-[12px] text-status-safe-fg font-medium leading-relaxed">
                    Tautan eksternal yang dibagikan akan dibuka di tab baru saat ditekan oleh rekan kelas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="font-label-medium text-[13px] text-on-background uppercase tracking-wider ml-1">File Berkas</label>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full border border-dashed rounded-[16px] p-6 flex flex-col items-center justify-center cursor-pointer gap-2 transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'bg-surface-container border-outline-variant hover:border-primary hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                    {file ? 'description' : 'cloud_upload'}
                  </span>
                  <div className="text-center">
                    <p className="font-label-medium text-[14px] text-on-surface mb-0.5">
                      {file ? file.name : 'Pilih file untuk diunggah'}
                    </p>
                    <p className="font-metadata text-[12px] text-outline">
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, PPT, DOC, JPG (Maks. 10MB)'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Area */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-${theme.bgColor} via-${theme.bgColor}/90 to-transparent z-50`}>
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          
          {/* Inline Error Message */}
          {errorMessage && (
            <div className="bg-error/10 border border-error/20 rounded-[12px] p-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
              <p className="text-[13px] text-error font-medium leading-relaxed">
                {errorMessage}
              </p>
            </div>
          )}
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-ink-on-dark text-on-primary py-4 rounded-[16px] font-label-medium text-[15px] hover:bg-black active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">save</span>
                SIMPAN MATERI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
