import { Zap, Github, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 p-1 rounded-md text-white">
                <Zap size={18} fill="currentColor" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">NexOprec</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Solusi cerdas manajemen Open Recruitment Organisasi. Dilengkapi asisten AI untuk pengalaman pendaftaran yang lebih manusiawi dan terorganisir.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="/" className="hover:text-blue-600 transition-colors">Beranda</a></li>
              <li><a href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Panduan Panitia</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Hubungi Kami</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Github size={20} /></a>
              <a href="#" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all"><Instagram size={20} /></a>
              <a href="#" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all"><Twitter size={20} /></a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
          <p>© {currentYear} NexOprec Platform. Built for better organization.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}