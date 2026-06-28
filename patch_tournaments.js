const fs = require('fs');
let content = fs.readFileSync('src/app/arcade/page.tsx', 'utf8');

// Insert tournament banner hook before ArcadePage return
const tournamentHook = `
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
`;

const arcadePageReturnTarget = '  return (\n    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto pb-20 overflow-x-hidden">';
if (!content.includes('const tournamentQuery')) {
  // We need to make sure supabase and profile are available in ArcadePage. Wait, they are NOT in ArcadePage!
  // Let me inject them.
  const arcadePageStart = 'export default function ArcadePage() {';
  const arcadePageHook = `export default function ArcadePage() {
  const supabase = useSupabase();
  const { profile } = useUser();
${tournamentHook}
`;
  content = content.replace(arcadePageStart, arcadePageHook);
}

const bannerJSX = `
      {activeTournament && (
        <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-r from-yellow-400 to-amber-600 text-white overflow-hidden mb-2">
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><Flame className="h-6 w-6 text-white animate-pulse" /> Weekend Tournament</CardTitle>
              <CardDescription className="text-white/80 font-bold">Play {activeTournament.game_name} to win the Gold Badge!</CardDescription>
            </div>
            <div className="hidden md:flex h-12 w-12 bg-white/20 rounded-xl items-center justify-center">
              <Trophy className="h-6 w-6 text-yellow-100" />
            </div>
          </CardHeader>
        </Card>
      )}
      <Tabs defaultValue="leaderboard"`;

if (!content.includes('Weekend Tournament')) {
    content = content.replace('<Tabs defaultValue="leaderboard"', bannerJSX);
}

fs.writeFileSync('src/app/arcade/page.tsx', content);
console.log('Arcade Tournaments added');
