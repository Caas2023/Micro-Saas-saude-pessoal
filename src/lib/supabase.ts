import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase configuration API keys. Vercel environment variables needed.');
}

// Inicializar mesmo se vazio (o Supabase jogará erro nas requisições, mas não travará o carregamento do React)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
