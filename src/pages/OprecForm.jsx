import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DynamicForm from '../components/DynamicForm';
import ChatbotWidget from '../components/ChatbotWidget';
import { Loader2, AlertCircle, FileText, CalendarDays, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function OprecForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State untuk memantau apakah pendaftar sudah mulai mengisi form
  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // Proteksi Browser: Munculkan peringatan jika pendaftar mencoba menutup tab saat form sudah diisi
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      // Mengambil data event. Pastikan kebijakan RLS di Supabase sudah 'public' agar bisa diakses anonim.
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (err) {
      setError('Tautan pendaftaran ini tidak valid atau masa pendaftaran telah berakhir.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi navigasi kembali ke Beranda dengan konfirmasi
  const handleGoHome = () => {
    if (isFormDirty) {
      const confirmLeave = window.confirm("Proses pendaftaran belum selesai. Keluar dan hapus draf?");
      if (!confirmLeave) return;
    }
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-blue-600 animate-spin" />
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Encrypting Secure Form...</p>
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center">
      <div className="card-modern max-w-md w-full py-12">
        <AlertCircle size={56} className="text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase">Akses Terbatas</h2>
        <p className="text-slate-500 leading-relaxed font-medium mb-8 px-4">{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary mx-auto">Kembali ke Beranda</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16 px-6 relative font-inter">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* TOMBOL NAVIGASI KE HOME */}
        <div className="flex justify-start">
          <button 
            onClick={handleGoHome}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-[0.2em] transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </button>
        </div>

        {/* KARTU UTAMA FORMULIR */}
        <div className="card-modern !p-0 overflow-hidden shadow-2xl shadow-slate-200/60 border-none ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* HEADER EVENT */}
          <div className="p-10 sm:p-14 border-b border-slate-100 bg-white relative overflow-hidden">
             <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
             
             <div className="relative z-10 text-center sm:text-left">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                  {event.title}
                </h1>
                
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start mb-6">
                   {event.end_date && (
                     <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-red-100 shadow-sm shadow-red-50">
                       <CalendarDays size={14} /> Deadline: {new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                     </div>
                   )}
                   <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-100">
                     <ShieldCheck size={14} /> NexOprec Verified
                   </div>
                </div>
                
                <p className="text-slate-500 leading-relaxed text-lg font-medium whitespace-pre-line">
                  {event.description}
                </p>
             </div>
          </div>

          {/* AREA SYARAT & KETENTUAN */}
          {event.terms_conditions && (
            <div className="p-10 sm:px-14 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 className="flex items-center gap-2 font-black text-slate-400 uppercase tracking-widest text-[11px] mb-4">
                <FileText size={16} className="text-blue-600" />
                Ketentuan Wajib Pendaftar
              </h3>
              <div className="text-slate-600 whitespace-pre-line text-sm leading-loose font-medium bg-white p-6 rounded-2xl border border-slate-200/60 shadow-inner">
                {event.terms_conditions}
              </div>
            </div>
          )}
          
          {/* AREA FORMULIR DINAMIS */}
          <div className="p-10 sm:p-14">
            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Lengkapi Formulir</h2>
            <p className="text-slate-400 text-sm font-medium mb-10">Data dikirim secara aman menggunakan enkripsi Cloud NexOprec.</p>
            
            {/* Mengirimkan callback setIsFormDirty ke DynamicForm */}
            <DynamicForm 
              schema={event.form_schema} 
              eventId={event.id} 
              onChange={() => setIsFormDirty(true)} 
            />
          </div>
        </div>

        {/* FOOTER BRANDING */}
        <div className="text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">NexOprec Secure Submission Engine © 2026</p>
        </div>

      </div>

      {/* CHATBOT AI */}
      <ChatbotWidget 
        eventId={event.id}
        schema={event.form_schema} 
        aiKnowledge={event.ai_knowledge} 
        terms={event.terms_conditions} 
      />
    </div>
  );
}