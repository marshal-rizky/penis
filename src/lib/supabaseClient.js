import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jeqjmsxmcwdryshcgkyr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_F2dbj4qrTLKhvSeLXau1DQ_fDhD_j2w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
