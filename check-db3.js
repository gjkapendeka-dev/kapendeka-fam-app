const supabaseUrl = "https://xmyaeantpmvdgdvuvjlz.supabase.co"
const supabaseKey = "sb_publishable_8ozcYwwEAaax-7Bh2OUCiA_bRJXGa3e"

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/language_progress?select=*&limit=1`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  })
  
  if (!res.ok) {
    console.error("HTTP Error:", res.status, res.statusText)
    console.error("Body:", await res.text())
    return
  }
  
  const data = await res.json()
  console.log('Data:', data)
}

check()
