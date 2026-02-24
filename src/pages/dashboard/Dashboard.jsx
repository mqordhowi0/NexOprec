import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { Plus, Settings, Users, ArrowRight, Loader2, Calendar, LayoutGrid, FileText, Zap, LogOut, Home } from 'lucide-react';

export default function Dashboard() {
  // Tambahkan fungsi logout dari useAuth
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEvents: 0, totalApplicants: 0 });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`*, submissions(count)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      
      const totalSub = data.reduce((acc, curr) => acc + (curr.submissions[0]?.count || 0), 0);
      setStats({ totalEvents: data.length, totalApplicants: totalSub });
    } catch (error) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ 
          user_id: user.id, 
          title: '', 
          form_schema: [],
          description: '',
          terms_conditions: '1. Mahasiswa Aktif\n2. Berkomitmen'
        }])
        .select()
        .single();

      if (error) throw error;
      navigate(`/dashboard/event/${data.id}`);
    } catch (error) {
      alert(error.message);
    }
  };

  // Fungsi untuk menangani proses Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Gagal logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP NAVIGATION BAR (Home & Logout) */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest px-2"
          >
            <Home size={16} /> Beranda Utama
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline-block border-r border-slate-200 pr-4">
              {user?.email}
            </span>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>

        {/* HEADER DASHBOARD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Dashboard Panitia</h1>
            <p className="text-slate-500 font-medium">Selamat datang kembali, kelola pendaftaran organisasimu di sini.</p>
          </div>
          <button onClick={createEvent} className="btn-primary gap-2 shadow-blue-500/20 py-3 px-6">
            <Plus size={20} /> Buat Oprec Baru
          </button>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <LayoutGrid size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalEvents}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Event Oprec</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalApplicants}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pendaftar</div>
            </div>
          </div>
          <div className="hidden lg:flex bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white items-center gap-5">
             <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <div className="text-sm font-bold opacity-90">NexOprec Pro</div>
              <div className="text-xs opacity-75 leading-relaxed">Status akun kamu aktif dan dapat membuat event tak terbatas.</div>
            </div>
          </div>
        </div>

        {/* MAIN LIST */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" /> Daftar Event Kamu
            </h2>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 size={40} className="text-blue-600 animate-spin" />
              <p className="text-slate-400 font-medium">Memuat data event...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-24 text-center px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
                <Plus size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Mulai Langkah Pertama</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8">Kamu belum memiliki event oprec apapun. Klik tombol di bawah untuk membuat yang pertama.</p>
              <button onClick={createEvent} className="btn-secondary mx-auto">Buat Event Sekarang</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((event) => (
                <div key={event.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {event.title || 'Event Tanpa Judul'}
                        </h3>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          {event.submissions[0]?.count || 0} Pendaftar
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Dibuat {new Date(event.created_at).toLocaleDateString('id-ID')}</span>
                        {event.end_date && <span className="text-red-400 flex items-center gap-1.5 font-bold"><ArrowRight size={14} /> Deadline {new Date(event.end_date).toLocaleDateString('id-ID')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/dashboard/event/${event.id}`} 
                        className="btn-secondary py-2 text-sm px-5 bg-white"
                      >
                        <Settings size={16} /> Kelola Event
                      </Link>
                      <Link 
                        to={`/form/${event.id}`} 
                        target="_blank" 
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Buka Form Publik"
                      >
                        <ArrowRight size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}