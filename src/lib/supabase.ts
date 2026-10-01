import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ojponshufkhcksdpfjso.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yvqX4JU2phLZsdHnrNWCtQ_0IJLSB-9';

export const supabase = createClient(supabaseUrl, supabaseKey);
