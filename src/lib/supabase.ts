import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase configuration API keys. Vercel environment variables needed.');
}

// Inicializar mesmo se variáveis não estiverem setadas na Vercel (fallback para não dar Tela Preta por crash de módulo síncrono)
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co', 
  supabaseAnonKey || 'dummy_anon_key'
);
