import { createClient } from '@supabase/supabase-js';

// Mengambil credential dari file .env secara aman
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inisialisasi dan export koneksi client Supabase biar bisa dipanggil di file lain
export const supabase = createClient(supabaseUrl, supabaseAnonKey);