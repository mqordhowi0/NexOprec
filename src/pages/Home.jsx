import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, ArrowRight, Loader2, Sparkles, CheckCircle2, Shield, Zap } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  const fetchActiveEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, end_date')
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setActiveEvents(data || []);
    } catch (error) {
      console.error('Gagal memuat event:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-blue-600 text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={16} className="fill-blue-600" /> Platform Oprec Organisasi Modern
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.1]">
            Rekrutmen Anggota <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              Lebih Cerdas & Otomatis
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Kelola pendaftaran organisasi dengan form dinamis, syarat & ketentuan yang jelas, serta dukungan Asisten AI untuk menjawab pertanyaan pendaftar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={user ? "/dashboard" : "/login"} className="btn-primary text-lg px-10 py-4 w-full sm:w-auto shadow-xl shadow-blue-500/20">
              {user ? "Buka Dashboard" : "Mulai Sekarang — Gratis"}
            </Link>
            <a href="#active-oprec" className="btn-secondary text-lg px-10 py-4 w-full sm:w-auto">
              Lihat Oprec Aktif
            </a>
          </div>

          {/* Social Proof / Stats */}
          <div className="mt-20 pt-10 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">100%</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Automated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">AI</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Integrated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">Safe</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Cloud Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">Free</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">For Student</div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE OPREC SECTION */}
      <section id="active-oprec" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Oprec Berlangsung</h2>
              <p className="text-slate-500">Temukan organisasi impianmu dan mulai berproses bersama mereka sekarang juga.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={40} className="text-blue-600 animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">Menyiapkan daftar oprec...</p>
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 text-slate-300">
                <Calendar size={32} />
              </div>
              <p className="text-slate-500 font-medium">Belum ada pendaftaran yang dibuka untuk saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeEvents.map((event) => (
                <Link 
                  key={event.id} 
                  to={`/form/${event.id}`}
                  className="card-modern group relative flex flex-col h-full"
                >
                  <div className="mb-6 flex justify-between items-start">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    {event.end_date && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-red-50 text-red-600 rounded-md border border-red-100">
                        Deadline Near
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">
                    {event.description || 'Mari bergabung bersama kami untuk mengembangkan potensi dirimu di organisasi ini.'}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      {event.end_date ? `S/D ${new Date(event.end_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}` : 'Open Forever'}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-blue-600">
                      Daftar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES MINI */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex gap-5">
          <div className="shrink-0 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Formulir Dinamis</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Sesuaikan pertanyaan pendaftaran sesuai kebutuhan organisasimu dengan mudah.</p>
          </div>
        </div>
        <div className="flex gap-5">
          <div className="shrink-0 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Asisten AI</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Bantu calon pendaftar menjawab pertanyaan umum melalui chatbot AI yang cerdas.</p>
          </div>
        </div>
        <div className="flex gap-5">
          <div className="shrink-0 w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Penyimpanan Aman</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Semua berkas pendaftaran tersimpan aman di cloud storage terintegrasi.</p>
          </div>
        </div>
      </section>
    </div>
  );
}