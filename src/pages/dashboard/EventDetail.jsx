import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, Save, MessageSquare, Users, Loader2, AlertCircle, 
  ExternalLink, Share2, Plus, Trash2, CheckSquare, List, FileUp, Settings, Download, History, Zap
} from 'lucide-react';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // State Management
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'pengaturan');
  const [event, setEvent] = useState(null);
  const [originalEvent, setOriginalEvent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchSubmissions();
    fetchChatHistory();
  }, [eventId]);

  // Pantau perubahan untuk status isDirty
  useEffect(() => {
    if (event && originalEvent) {
      const hasChanged = JSON.stringify(event) !== JSON.stringify(originalEvent);
      setIsDirty(hasChanged);
    }
  }, [event, originalEvent]);

  // Proteksi tab ditutup
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      if (data.user_id !== user.id) {
        navigate('/dashboard');
        return;
      }
      setEvent(data);
      setOriginalEvent(data);
    } catch (error) {
      setError('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('event_id', eventId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const cleanedSchema = event.form_schema.map(field => {
        let cleanField = { ...field, id: field.id || `field_${Math.random().toString(36).substr(2, 9)}` };
        if (cleanField.type === 'select' && cleanField.options) {
          cleanField.options = cleanField.options.filter(opt => opt.trim() !== '');
        }
        return cleanField;
      });

      const updatedData = {
        title: event.title,
        description: event.description,
        form_schema: cleanedSchema,
        ai_knowledge: event.ai_knowledge,
        terms_conditions: event.terms_conditions,
        start_date: event.start_date || null,
        end_date: event.end_date || null
      };

      const { error: updateError } = await supabase
        .from('events')
        .update(updatedData)
        .eq('id', eventId);

      if (updateError) throw updateError;
      
      setOriginalEvent({ ...event, form_schema: cleanedSchema });
      setIsDirty(false);
      setSuccess('Seluruh perubahan berhasil diamankan ke Cloud.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus Oprec ini? Tindakan ini permanen.')) return;
    try {
      setSaving(true);
      await supabase.from('events').delete().eq('id', eventId);
      navigate('/dashboard');
    } catch (error) {
      setError('Gagal menghapus: ' + error.message);
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const columns = event.form_schema.map(field => ({
      id: field.id,
      label: field.label
    }));
    const fieldMap = {};
    event.form_schema.forEach(f => { fieldMap[f.id] = f.label; });
    const allKeys = new Set();
    submissions.forEach(sub => Object.keys(sub.answers).forEach(k => allKeys.add(k)));
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };
    const headers = ['Tanggal Daftar', ...columns.map(col => col.label)];
    const csvRows = [headers.map(escapeCSV).join(',')];
    submissions.forEach(sub => {
      const dateStr = new Date(sub.created_at).toLocaleString('id-ID');
      const row = [escapeCSV(dateStr)];
      
      columns.forEach(col => {
        // Ambil jawaban berdasarkan ID kolom, jika tidak ada isi kosong
        row.push(escapeCSV(sub.answers[col.id] || ''));
      });
      
      csvRows.push(row.join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Peserta_${event.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/form/${eventId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addField = (type) => {
    const newField = {
      id: `field_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      label: 'Pertanyaan Baru',
      required: true,
      options: type === 'select' ? ['Opsi 1'] : undefined,
      condition: null
    };
    setEvent({ ...event, form_schema: [...event.form_schema, newField] });
  };

  const updateField = (index, key, value) => {
    const updatedSchema = [...event.form_schema];
    updatedSchema[index] = { ...updatedSchema[index], [key]: value };
    setEvent({ ...event, form_schema: updatedSchema });
  };

  const updateCondition = (index, conditionKey, value) => {
    const updatedSchema = [...event.form_schema];
    const currentCondition = updatedSchema[index].condition || { field: '', value: '' };
    if (!value && conditionKey === 'field') {
      updatedSchema[index].condition = null;
    } else {
      updatedSchema[index].condition = { ...currentCondition, [conditionKey]: value };
    }
    setEvent({ ...event, form_schema: updatedSchema });
  };

  const removeField = (index) => {
    const updatedSchema = event.form_schema.filter((_, i) => i !== index);
    setEvent({ ...event, form_schema: updatedSchema });
  };

  const handleBack = async () => {
    if (isDirty) {
      const confirmLeave = window.confirm("Perubahan belum disimpan. Tetap keluar?");
      if (!confirmLeave) return;
      if (!event.title.trim() || event.title === 'Event Baru Tanpa Judul') {
        await supabase.from('events').delete().eq('id', eventId);
      }
    }
    navigate('/dashboard');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-blue-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Menyinkronkan Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div className="flex items-start gap-4 flex-1 w-full">
            <button onClick={handleBack} className="p-2.5 mt-1 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all shrink-0 shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 w-full max-w-xl">
              <input
                type="text"
                value={event.title}
                onChange={(e) => setEvent({...event, title: e.target.value})}
                className="text-2xl font-black text-slate-900 bg-transparent border-none outline-none w-full p-0 focus:ring-0"
                placeholder="Nama Oprec..."
              />
              <textarea
                value={event.description || ''}
                onChange={(e) => setEvent({...event, description: e.target.value})}
                className="w-full text-sm text-slate-500 bg-transparent border-none outline-none focus:ring-0 mt-1 resize-none p-0"
                placeholder="Deskripsi singkat kegiatan..."
                rows={1}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <button onClick={handleShareLink} className="btn-secondary py-2.5 px-4 text-xs font-bold uppercase tracking-wider">
              {copied ? <CheckSquare size={16} className="text-green-600" /> : <Share2 size={16} />}
              {copied ? 'Tersalin' : 'Share Link'}
            </button>
            <Link to={`/form/${eventId}`} target="_blank" className="btn-secondary py-2.5 px-4 text-xs font-bold uppercase tracking-wider">
              <ExternalLink size={16} /> Preview
            </Link>
            <button onClick={handleSave} disabled={saving || !isDirty} className={`btn-primary py-2.5 px-6 text-xs font-bold uppercase transition-all ${!isDirty ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              {isDirty ? 'Simpan Perubahan' : 'Sudah Tersimpan'}
            </button>
            <button onClick={handleDelete} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl transition-all shadow-sm">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 mt-10">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
            <AlertCircle size={24} className="shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-8 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
            <Zap size={24} className="shrink-0 fill-emerald-500" />
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}

        <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'pengaturan', icon: Settings, label: 'Konfigurasi' },
            { id: 'ai', icon: MessageSquare, label: 'Latih AI' },
            { id: 'chat', icon: History, label: 'Audit Log' },
            { id: 'pendaftar', icon: Users, label: 'Data Peserta' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-y-[-1px]' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
              {tab.id === 'pendaftar' && submissions.length > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'pendaftar' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {submissions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'pengaturan' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card-modern">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Settings size={20} /></div>
                <h3 className="font-extrabold text-slate-900">Timeline & Kebijakan</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mulai Pendaftaran</label>
                  <input type="date" value={event.start_date || ''} onChange={(e) => setEvent({...event, start_date: e.target.value})} className="input-modern" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penutupan (Deadline)</label>
                  <input type="date" value={event.end_date || ''} onChange={(e) => setEvent({...event, end_date: e.target.value})} className="input-modern border-red-100 focus:border-red-500 focus:ring-red-500/10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syarat & Ketentuan Pendaftaran</label>
                <textarea
                  value={event.terms_conditions || ''}
                  onChange={(e) => setEvent({...event, terms_conditions: e.target.value})}
                  placeholder="Tuliskan kriteria yang harus dipenuhi pendaftar..."
                  className="input-modern min-h-[160px] leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">Struktur Pertanyaan</h3>
                <div className="flex gap-2">
                   <button onClick={() => addField('text')} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"><List size={18} /></button>
                   <button onClick={() => addField('select')} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"><CheckSquare size={18} /></button>
                   <button onClick={() => addField('file')} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"><FileUp size={18} /></button>
                </div>
              </div>

              {event.form_schema.map((field, index) => (
                <div key={field.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-400 transition-all duration-300">
                  <button onClick={() => removeField(index)} className="absolute -top-3 -right-3 p-2 bg-white border border-red-100 text-red-500 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase">Label Pertanyaan</label>
                      <input type="text" value={field.label} onChange={(e) => updateField(index, 'label', e.target.value)} className="input-modern font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase">Tipe Jawaban</label>
                      <select value={field.type} onChange={(e) => updateField(index, 'type', e.target.value)} className="input-modern font-bold text-slate-600">
                        <option value="text">Teks Singkat</option>
                        <option value="email">Email</option>
                        <option value="select">Pilihan Ganda</option>
                        <option value="file">Upload Berkas</option>
                      </select>
                    </div>
                  </div>

                  {/* Pastikan bagian bawah setiap kartu pertanyaan (field) ada kode ini */}
                  <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer group/label">
                      <input 
                        type="checkbox" 
                        checked={field.required} 
                        onChange={(e) => updateField(index, 'required', e.target.checked)} 
                        className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-xs font-bold text-slate-500 group-hover/label:text-slate-900 transition-colors uppercase tracking-tight">Wajib diisi</span>
                    </label>
                    
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tampil jika:</span>
                      
                      {/* Dropdown untuk memilih pertanyaan pemicu */}
                      <select 
                        value={field.condition?.field || ''} 
                        onChange={(e) => updateCondition(index, 'field', e.target.value)} 
                        className="bg-transparent border-none text-[10px] font-black text-blue-600 focus:ring-0 p-0 cursor-pointer uppercase tracking-wider"
                      >
                        <option value="">-- Selalu Tampil --</option>
                        {event.form_schema.slice(0, index).filter(f => f.type === 'select').map(prev => (
                          <option key={prev.id} value={prev.id}>{prev.label}</option>
                        ))}
                      </select>

                      {/* Dropdown untuk memilih nilai jawaban pemicu */}
                      {field.condition?.field && (
                        <>
                          <span className="text-slate-300">=</span>
                          <select 
                            value={field.condition?.value || ''} 
                            onChange={(e) => updateCondition(index, 'value', e.target.value)} 
                            className="bg-transparent border-none text-[10px] font-black text-blue-600 focus:ring-0 p-0 cursor-pointer"
                          >
                            <option value="">Pilih Opsi</option>
                            {event.form_schema.find(f => f.id === field.condition.field)?.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Opsi Pilihan (Pisahkan dengan koma)</label>
                      <input type="text" value={field.options ? field.options.join(', ') : ''} onChange={(e) => {
                        const optionsArray = e.target.value.split(',').map(opt => opt.trimStart());
                        updateField(index, 'options', optionsArray);
                      }} className="input-modern border-blue-200 text-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="card-modern animate-in fade-in zoom-in-95 duration-300">
            <textarea 
              value={event.ai_knowledge || ''} 
              onChange={(e) => setEvent({...event, ai_knowledge: e.target.value})} 
              className="input-modern min-h-[300px] leading-relaxed text-slate-600" 
              placeholder="Berikan 'otak' pada asisten AI Anda..." 
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {chatHistory.map(session => (
              <div key={session.id} className="card-modern !p-0 overflow-hidden group">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                   <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">ID: {session.session_id}</span>
                   <span className="text-[10px] font-bold text-slate-400">{new Date(session.updated_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="p-6 space-y-6">
                  {session.messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'}`}>
                          {m.content}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pendaftar' && (
          <div className="card-modern !p-0 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900 uppercase tracking-tighter text-xs">Peserta Terdaftar ({submissions.length})</h3>
                <button onClick={handleExportCSV} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 py-2 text-xs font-black uppercase tracking-widest">
                   <Download size={14} /> Export CSV
                </button>
             </div>
             <div className="divide-y divide-slate-100">
                {submissions.map((sub, idx) => (
                  <div key={sub.id} className="p-8 hover:bg-slate-50/80 transition-all group">
                     <div className="flex justify-between items-center mb-6 text-xs font-bold uppercase tracking-widest">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">Batch #{submissions.length - idx}</span>
                        <span className="text-slate-400">{new Date(sub.created_at).toLocaleString('id-ID')}</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(sub.answers).map(([key, val]) => {
                           const fDef = event.form_schema.find(f => f.id === key);
                           return (
                             <div key={key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <label className="block text-[10px] font-black text-slate-300 uppercase mb-1">{fDef?.label || 'Unknown'}</label>
                                {fDef?.type === 'file' ? (
                                  <a href={val} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-sm flex items-center gap-1.5 hover:underline"><FileUp size={14} /> View Document</a>
                                ) : (
                                  <span className="text-sm font-bold text-slate-700 break-words">{val || '-'}</span>
                                )}
                             </div>
                           );
                        })}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}