import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LogOut, LayoutDashboard, User, Zap } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className={`glass-nav ${scrolled ? 'py-3' : 'py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white group-hover:rotate-12 transition-transform duration-300">
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            NexOprec
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-900">{user.email.split('@')[0]}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Premium Panitia</span>
                </div>
                <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4">Masuk</Link>
              <Link to="/login" className="btn-primary py-2 text-sm shadow-blue-500/10">Mulai Gratis</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 font-medium text-slate-700 bg-slate-50 rounded-xl">
                <LayoutDashboard size={20} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-3 p-3 font-medium text-red-600 bg-red-50 rounded-xl">
                <LogOut size={20} /> Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-secondary w-full">Masuk</Link>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-primary w-full">Daftar Sekarang</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}