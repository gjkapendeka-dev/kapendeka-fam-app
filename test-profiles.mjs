import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmyaeantpmvdgdvuvjlz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8ozcYwwEAaax-7Bh2OUCiA_bRJXGa3e';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) console.error("Error:", error);
  else {
    console.log("Profiles columns:", data.length > 0 ? Object.keys(data[0]) : "No profiles found");
    if (data.length > 0) console.log("Sample profile:", data[0]);
  }
}

check();
