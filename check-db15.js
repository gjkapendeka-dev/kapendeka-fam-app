const supabaseUrl = "https://xmyaeantpmvdgdvuvjlz.supabase.co"
const supabaseKey = "sb_publishable_8ozcYwwEAaax-7Bh2OUCiA_bRJXGa3e"

async function check() {
  const data = {
    family_id: '00000000-0000-0000-0000-000000000000',
    member_id: '00000000-0000-0000-0000-000000000000',
    game: 'test',
    best_score: 100,
    updated_at: new Date().toISOString()
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/arcade_scores`, {
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
