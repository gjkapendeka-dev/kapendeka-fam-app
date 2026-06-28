const fs = require('fs');
let content = fs.readFileSync('src/app/arcade/page.tsx', 'utf8');

const leaderboardHook = `
function Leaderboard() {
  const { profile } = useUser();
  const supabase = useSupabase();

  const tournamentQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("arcade_tournaments")
      .select("*")
      .eq("family_id", profile.familyId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
  }, [supabase, profile?.familyId])
  const { data: tournaments } = useCollection(tournamentQuery)
  const activeTournament = tournaments?.[0] || null

  const scoresQuery = React.useMemo(() => {
`;

if (content.includes('function Leaderboard() {\n  const { profile } = useUser();\n  const supabase = useSupabase();\n\n  const scoresQuery = React.useMemo(() => {')) {
    content = content.replace('function Leaderboard() {\n  const { profile } = useUser();\n  const supabase = useSupabase();\n\n  const scoresQuery = React.useMemo(() => {', leaderboardHook);
} else if (content.includes('function Leaderboard() {\n  const supabase = useSupabase();\n  const { profile } = useUser();\n\n  const scoresQuery = React.useMemo(() => {')) {
    content = content.replace('function Leaderboard() {\n  const supabase = useSupabase();\n  const { profile } = useUser();\n\n  const scoresQuery = React.useMemo(() => {', leaderboardHook);
} else {
    // try looser replace
    const before = 'function Leaderboard() {\n  const supabase = useSupabase();\n  const { profile } = useUser();';
    const after = before + '\n' + `  const tournamentQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("arcade_tournaments")
      .select("*")
      .eq("family_id", profile.familyId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
  }, [supabase, profile?.familyId])
  const { data: tournaments } = useCollection(tournamentQuery)
  const activeTournament = tournaments?.[0] || null`;
    content = content.replace(before, after);
}

const displayLogic = `
                        <span className="font-bold text-sm">{s.profiles?.display_name}</span>
                        {i === 0 && activeTournament?.game_name === game && (
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ml-1 shadow-sm border border-yellow-300">
                            <Crown className="h-3 w-3" /> Champ
                          </div>
                        )}
`;

content = content.replace('<span className="font-bold text-sm">{s.profiles?.display_name}</span>', displayLogic);

// Ensure Crown is imported
if (!content.includes('Crown')) {
    content = content.replace('Trophy,', 'Trophy, Crown,');
}

fs.writeFileSync('src/app/arcade/page.tsx', content);
console.log('Leaderboard Badge updated');
