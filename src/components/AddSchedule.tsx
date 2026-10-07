import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AddSchedule({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) {
  const [identity, setIdentity] = useState('');
  const [logs, setLogs] = useState('');
  const [status, setStatus] = useState('STANDBY');
  const [parsedCourses, setParsedCourses] = useState<any[]>([]);
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLogs(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleSync = () => {
    setStatus("PROCESSING...");
    try {
      // Regex ini mendeteksi blok data antar mata kuliah, mengabaikan newline berantakan.
      // Pola: (Kurikulum diabaikan) (Kode) (Nama MK) (Kelas) (SKS) (Jadwal + Dosen) (Kehadiran angka diabaikan)
      const regex = /(?:SI\d{2})\s+(\d{9})\s+([\s\S]+?)\s+(SI-[A-Z0-9]+)\s+(\d)\s+([\s\S]+?)\s+(?:\d+)(?=\s+SI\d{2}\s+\d{9}|\s*$)/g;

      const parsed = [];
      let match;

      while ((match = regex.exec(logs)) !== null) {
        const kode_mk = match[1].trim();
        // Gabungkan teks yang terpotong enter menjadi satu baris rapi
        const nama_mk = match[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        const kelas = match[3].trim();
        const sks = parseInt(match[4].trim(), 10);
        
        // Pisahkan Jadwal dan Dosen dari regex grup ke-5
        const jdRaw = match[5].trim();
        const jdLines = jdRaw.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        
        let dosen = "Unknown";
        let jadwal = jdRaw;

        // Dosen biasanya berada di baris teks paling bawah sebelum angka kehadiran
        if (jdLines.length > 1) {
          dosen = jdLines.pop() || "Unknown"; // Ambil baris terakhir sebagai nama dosen
          jadwal = jdLines.join(' ').replace(/\s+/g, ' ').trim(); // Sisanya adalah jadwal & ruang
        }

        parsed.push({
          kode_mk,
          nama_mk,
          kelas,
          sks,
          jadwal,
          dosen
        });
      }

      setParsedCourses(parsed);
      setStatus(`SYNCED: ${parsed.length} RECORDS READY`);
    } catch (error) {
      console.error("Parsing error:", error);
      setStatus("SYNC ERROR: Format gagal diproses");
    }
  };

  const handleDeploy = async () => {
    setStatus('DEPLOYING...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const mappedCourses = parsedCourses.map(course => ({
        user_id: user.id,
        code: course.kode_mk,
        name: `${course.nama_mk} (${course.kelas})`,
        credits: course.sks,
        room: course.jadwal,
        lecturer: course.dosen
      }));

      const { error } = await supabase.from('courses').insert(mappedCourses);
      if (error) throw error;

      setLogs('');
      setParsedCourses([]);
      setStatus('DEPLOY SUCCESS');
    } catch (error: any) {
      console.error(error);
      setStatus(`ERROR: ${error.message}`);
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
        
        {/* Header Text */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-full w-fit mb-2 border border-primary/10">
            <span className="material-symbols-outlined text-[16px]">database</span>
            <span className="font-label-medium text-[11px] font-bold tracking-widest uppercase">System Integrations</span>
          </div>
          <h2 className="font-h1-mobile text-[32px] text-primary font-extrabold tracking-tight leading-none">Datasources</h2>
          <p className="font-metadata text-metadata text-on-surface-variant max-w-[80%]">Import raw academic schedules directly from the BIMA infrastructure.</p>
        </div>

        {/* Form Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 p-6 flex flex-col gap-6 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]">
          
          {/* Identity & Paste */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex items-center flex-1 min-h-[56px] border border-muted-divider/60 rounded-[20px] bg-white/80 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">tag</span>
              <input 
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="Datasource Identity (e.g. 2024 Semester 1)"
                className="w-full bg-transparent border-0 focus:ring-0 p-0 font-body text-body text-primary font-medium flex-1 focus:outline-none placeholder:text-on-surface-variant/60 placeholder:font-normal"
              />
            </div>
            
            <button 
              onClick={handlePaste}
              className="h-[56px] px-6 bg-primary text-white font-label-medium text-label-medium rounded-[20px] flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all shrink-0 shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">content_paste</span>
              PASTE LOGS
            </button>
          </div>

          {/* Textarea - Terminal Style */}
          <div className="relative flex flex-col w-full rounded-[24px] bg-[#0A0A0A] p-2 shadow-inner overflow-hidden border border-[#2A2A2A]">
            <div className="flex items-center gap-2 px-3 pt-2 pb-3 border-b border-[#2A2A2A] mb-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>
              <span className="font-mono text-[10px] text-[#888888] ml-2 tracking-wider">raw_bima_dump.tsv</span>
            </div>
            <textarea 
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Waiting for clipboard data..."
              className="w-full h-[240px] bg-transparent border-0 focus:ring-0 px-3 font-mono text-[13px] text-[#4AF626] leading-relaxed placeholder:text-[#4AF626]/30 resize-none focus:outline-none"
              spellCheck="false"
            />
          </div>

          {/* Parsing Results Preview */}
          {parsedCourses.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-muted-divider/50">
              <span className="font-metadata text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#27C93F]">check_circle</span>
                Data Extracted ({parsedCourses.length})
              </span>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {parsedCourses.map((c, i) => (
                  <div key={i} className="min-w-[160px] max-w-[160px] bg-white border border-muted-divider/60 rounded-[16px] p-3 shadow-sm shrink-0">
                    <p className="font-h2 text-[13px] text-primary truncate leading-tight mb-1">{c.nama_mk}</p>
                    <p className="font-metadata text-[10px] text-on-surface-variant truncate"><span className="font-bold">Kelas:</span> {c.kelas} • {c.sks} SKS</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
            <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-full border border-muted-divider/60 shadow-inner">
              <div className={`w-2 h-2 rounded-full ${status.includes('ERROR') ? 'bg-red-500 animate-pulse' : status.includes('SYNCED') ? 'bg-[#27C93F]' : status.includes('DEPLOY') ? 'bg-blue-500 animate-pulse' : 'bg-neutral-400'}`}></div>
              <span className="font-mono text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">{status}</span>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={handleSync}
                className="flex-1 sm:flex-none h-[48px] px-6 bg-white hover:bg-neutral-50 border border-muted-divider/60 text-primary font-label-medium text-[13px] font-bold rounded-[16px] transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
                SYNC
              </button>
              <button 
                onClick={handleDeploy}
                className="flex-1 sm:flex-none h-[48px] px-8 bg-gradient-to-r from-primary to-black hover:opacity-90 text-white font-label-medium text-[13px] font-bold rounded-[16px] transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                disabled={parsedCourses.length === 0}
              >
                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                DEPLOY
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
