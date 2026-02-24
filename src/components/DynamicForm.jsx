import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, UploadCloud, FileCheck, AlertCircle } from 'lucide-react';

// Versi 2.0 - Premium SaaS Style
export default function DynamicForm({ schema, eventId, onChange }) {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState({});

  // Fungsi untuk menangani perubahan input teks/pilihan
  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Pemicu agar OprecForm tahu ada aktivitas pengisian
    if (onChange) onChange(); 
  };

  // Logika untuk menampilkan/menyembunyikan field berdasarkan jawaban sebelumnya
  const checkCondition = (condition) => {
    if (!condition) return true;
    return formData[condition.field] === condition.value;
  };

  // Fungsi unggah berkas langsung ke Supabase Storage
  const handleFileUpload = async (id, file) => {
    if (!file) return;
    setUploadingFiles(prev => ({ ...prev, [id]: true }));
    setError('');

    try {
      // Membuat nama file unik untuk menghindari tabrakan data
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('oprec-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Ambil URL publik untuk disimpan di tabel submissions
      const { data: { publicUrl } } = supabase.storage
        .from('oprec-files')
        .getPublicUrl(filePath);

      handleChange(id, publicUrl);
    } catch (err) {
      setError('Gagal mengunggah berkas: ' + err.message);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validasi: pastikan tidak ada file yang masih dalam proses upload
      const isStillUploading = Object.values(uploadingFiles).some(status => status === true);
      if (isStillUploading) throw new Error('Harap tunggu, berkas sedang dalam proses enkripsi...');

      // Filter jawaban hanya untuk field yang terlihat (memenuhi kondisi)
      const finalAnswers = {};
      schema.forEach(field => {
        if (checkCondition(field.condition)) {
          finalAnswers[field.id] = formData[field.id] || '';
        }
      });

      const { error: insertError } = await supabase
        .from('submissions')
        .insert([{ event_id: eventId, answers: finalAnswers }]);

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Tampilan Sukses (Full Card)
  if (success) {
    return (
      <div className="text-center py-16 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 mt-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-50">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Data Terkirim!</h3>
        <p className="text-slate-500 font-medium">Pendaftaran Anda telah berhasil diamankan di sistem kami.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 mt-10">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="space-y-10">
        {schema.map((field) => {
          // Lewati jika kondisi "Tampil Jika" tidak terpenuhi
          if (!checkCondition(field.condition)) return null;

          return (
            <div key={field.id} className="group">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 transition-colors group-focus-within:text-blue-600">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {(field.type === 'text' || field.type === 'email') && (
                <input
                  type={field.type}
                  className="input-modern py-4 px-5 text-slate-700 font-semibold"
                  placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                />
              )}

              {field.type === 'select' && (
                <div className="relative">
                  <select
                    className="input-modern py-4 px-5 text-slate-700 font-bold appearance-none cursor-pointer"
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                  >
                    <option value="" disabled>Pilih salah satu opsi...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {field.type === 'file' && (
                <div className="relative group/file">
                  <div className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                    formData[field.id] ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50/50 border-slate-200 hover:border-blue-300 hover:bg-white'
                  }`}>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      required={field.required && !formData[field.id]}
                      disabled={uploadingFiles[field.id]}
                      onChange={(e) => handleFileUpload(field.id, e.target.files[0])}
                    />
                    
                    {uploadingFiles[field.id] ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                        <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Memproses Berkas...</span>
                      </div>
                    ) : formData[field.id] ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileCheck size={32} className="text-emerald-500" />
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest text-center">Berkas Terverifikasi</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={32} className="text-slate-300 group-hover/file:text-blue-400 transition-colors" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest text-center px-4">
                          Klik atau tarik berkas untuk mengunggah
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        type="submit" 
        disabled={submitting || schema.length === 0}
        className="btn-primary w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 mt-4 disabled:opacity-50 disabled:grayscale transition-all"
      >
        {submitting ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Kirim Pendaftaran'}
      </button>
    </form>
  );
}