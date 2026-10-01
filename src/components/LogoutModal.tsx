import React from 'react';
import { supabase } from '../lib/supabase';

export default function LogoutModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000000]/60 backdrop-blur-sm px-4">
      <div className="bg-[#FFFFFF] w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <img src="/assets/logout.jpg" alt="Logout Illustration" className="w-40 h-40 object-cover object-center mb-2 pointer-events-none" />
        <h2 className="font-h2 text-[22px] font-extrabold text-[#191B1F] tracking-tight mb-3">Keluar dari aplikasi?</h2>
        <p className="font-body text-[14px] text-on-surface-variant leading-relaxed mb-8 px-2">
          Anda selalu dapat masuk kembali kapan saja. Jika Anda hanya ingin berganti akun, Anda dapat masuk dengan <span className="underline decoration-muted-divider underline-offset-2">akun lain</span>.
        </p>
        <div className="flex gap-4 w-full justify-center">
          <button 
            onClick={onClose}
            className="py-2.5 px-8 rounded-full font-label-medium text-sm border border-muted-divider text-[#191B1F] hover:bg-surface-container-low transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="py-2.5 px-8 rounded-full font-label-medium text-sm bg-[#0D0D0D] text-white hover:bg-black transition-colors shadow-sm"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
