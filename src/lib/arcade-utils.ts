export const saveGameScore = async (supabase: any, profile: any, game: string, score: number, type: 'score' | 'win' | 'loss' | 'draw' = 'score') => {
  if (!supabase || !profile) return
  
  const payload: any = {
    family_id: profile.family_id,
    member_id: profile.id,
    game: game,
    updated_at: new Date().toISOString()
  }

  if (type === 'score') payload.best_score = score
  if (type === 'win') payload.wins = 1
  if (type === 'loss') payload.losses = 1
  if (type === 'draw') payload.draws = 1

  await supabase.from('arcade_scores').insert([payload])
}
