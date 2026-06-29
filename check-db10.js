const supabaseUrl = "https://xmyaeantpmvdgdvuvjlz.supabase.co"
const supabaseKey = "sb_publishable_8ozcYwwEAaax-7Bh2OUCiA_bRJXGa3e"

async function check() {
  const data = {
    family_id: 'test',
    member_id: 'test',
    language: 'isiZulu',
    created_at: new Date().toISOString()
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/language_progress`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  })
  
  if (!res.ok) {
    console.error("HTTP Error:", res.status, res.statusText)
    console.error("Body:", await res.text())
  } else {
    console.log("Success! Data:", await res.json())
  }
}

check()
