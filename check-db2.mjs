import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = "https://xmyaeantpmvdgdvuvjlz.supabase.co"
const supabaseKey = "sb_publishable_8ozcYwwEAaax-7Bh2OUCiA_bRJXGa3e"

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('language_progress').select('*').limit(1)
  console.log('Error:', error)
  console.log('Data:', data)
}

check()
