import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wedgspquwjfqmzojyjtp.supabase.co';
const supabaseKey = 'sb_publishable_fmxbUKYOmtNodttu5tL42g_YSTJggKP';

export const supabase = createClient(supabaseUrl, supabaseKey);