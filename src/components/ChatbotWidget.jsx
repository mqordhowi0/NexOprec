import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChatbotWidget({ eventId, schema, aiKnowledge, terms }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('nexoprec_session');
    if (existing) return existing;
    const newId = 'GUEST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    sessionStorage.setItem('nexoprec_session', newId);
    return newId;
  });

  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Halo! Saya asisten virtual panitia. Butuh bantuan mengenai syarat, berkas, atau jadwal pendaftaran ini?' }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const TEAM_ID = import.meta.env.VITE_DOCSBOT_TEAM_ID;
  const BOT_ID = import.meta.env.VITE_DOCSBOT_BOT_ID;
  const API_KEY = import.meta.env.VITE_DOCSBOT_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isLoading]);

  const saveChatHistory = async (chatArray) => {
    try {
      await supabase.from('chat_sessions').upsert({
        event_id: eventId,
        session_id: sessionId,
        messages: chatArray,
        updated_at: new Date().toISOString()
      }, { onConflict: 'event_id,session_id' });
    } catch (err) { console.error(err); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const contextPrompt = `Konteks Form: ${JSON.stringify(schema)}\nS&K: ${terms}\nCatatan Panitia: ${aiKnowledge}\n\nPendaftar Tanya: ${userText}`;

    try {
      const response = await fetch(`https://api.docsbot.ai/teams/${TEAM_ID}/bots/${BOT_ID}/chat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: contextPrompt, full_source: false })
      });
      const data = await response.json();
      const aiReply = data.answer || "Maaf, sistem AI sedang dalam pemeliharaan berkala.";
      const finalMessages = [...newMessages, { role: 'ai', content: aiReply }];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (error) {
      const fallback = [...newMessages, { role: 'ai', content: 'Terjadi gangguan koneksi. Harap hubungi panitia melalui kanal resmi lainnya.' }];
      setMessages(fallback);
      saveChatHistory(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      {isOpen && (
        <div className="bg-white w-[90vw] sm:w-[400px] h-[550px] rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-6 animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
          
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-blue-600/20 blur-3xl rounded-full"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <Zap size={18} fill="currentColor" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">Asisten Panitia</h3>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Verified Session: {sessionId}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] flex flex-col gap-5 no-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed font-medium shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none border-blue-500' 
                    : 'bg-white text-slate-700 rounded-tl-none border-slate-200/60'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="bg-white border border-slate-200 text-slate-400 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3 text-xs font-bold animate-pulse">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span>MENGANALISIS KETENTUAN...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Tanyakan sesuatu..."
              className="flex-1 p-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none text-sm font-semibold transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-5 rounded-[1.5rem] shadow-2xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ring-8 ring-blue-600/5 group"
        >
          <MessageCircle size={32} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}
    </div>
  );
}