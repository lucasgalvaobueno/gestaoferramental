import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO GRAVE: Supabase URL ou Anon Key não configurados no arquivo .env ou no painel da Vercel.");
}

// Cria o client apenas se tiver as variáveis, senão cria um "fake client" para evitar tela branca (crash) 
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : {
        from: () => ({ select: () => ({}), insert: () => ({}), update: () => ({}), delete: () => ({}) }),
        channel: () => ({ on: () => ({ subscribe: () => {} }) }),
        removeChannel: () => {}
      };
