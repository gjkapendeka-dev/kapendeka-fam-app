const supabaseUrl = "https://xmyaeantpmvdgdvuvjlz.supabase.co"
const supabaseKey = "sb_publishable_8ozcYwwEAaax-7Bh2OUCiA_bRJXGa3e"

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`)
  
  const data = await res.json()
  const table = data.definitions?.language_progress || data.components?.schemas?.language_progress
  if (table) {
    console.log('Columns for language_progress:', Object.keys(table.properties))
  } else {
    console.log('Table language_progress not found in schema.')
    console.log('Available schemas:', Object.keys(data.definitions || data.components?.schemas || {}))
  }
}

check()
