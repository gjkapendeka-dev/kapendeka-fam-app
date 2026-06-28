const fs = require('fs');
let content = fs.readFileSync('src/app/arcade/page.tsx', 'utf8');

const leaderboardComponent = `
function Leaderboard() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [scores, setScores] = React.useState([]);

  React.useEffect(() => {
    if (!supabase || !profile?.family_id) return;
    
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

    const fetchScores = async () => {
      const { data } = await supabase
        .from('arcade_scores')
        .select('*, profiles!arcade_scores_member_id_fkey(display_name, avatar_url, id)')
        .eq('family_id', profile.family_id)
        .gte('updated_at', startOfWeek)
        .order('best_score', { ascending: false });

      if (data) setScores(data);
    };

    fetchScores();
  }, [supabase, profile]);

  // Group by game
  const grouped = scores.reduce((acc, curr) => {
    if (!acc[curr.game]) acc[curr.game] = [];
    acc[curr.game].push(curr);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-500" /> Weekly Leaderboard
      </h2>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-muted-foreground">No scores yet this week! Start playing!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([game, gameScores]) => (
            <Card key={game} className="rounded-3xl border-none shadow-md overflow-hidden bg-white/50">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg font-bold">{game}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {gameScores.slice(0, 3).map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={\`font-black text-lg \${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}\`}>#{i + 1}</div>
                      <div className="flex items-center gap-2">
                        <img src={s.profiles?.avatar_url || \`https://api.dicebear.com/9.x/fun-emoji/svg?seed=\${s.profiles?.id}\`} className="w-8 h-8 rounded-full bg-white shadow-sm" alt="avatar" />
                        <span className="font-bold text-sm">{s.profiles?.display_name}</span>
                      </div>
                    </div>
                    <div className="font-bold text-primary">
                      {s.best_score ? \`\${s.best_score} pts\` : (s.wins ? 'Won' : 'Played')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
`;

if (!content.includes('function Leaderboard()')) {
  // insert before export default function ArcadePage
  content = content.replace('export default function ArcadePage', leaderboardComponent + '\nexport default function ArcadePage');
}

// Add Leaderboard to tabs
const tabsListTarget = '<Tabs defaultValue="piano" className="w-full">';
const newTabsListTarget = '<Tabs defaultValue="leaderboard" className="w-full">';
content = content.replace(tabsListTarget, newTabsListTarget);

const tabsTriggerTarget = '<TabsList className="bg-muted/50 p-1 rounded-2xl w-full flex flex-nowrap overflow-x-auto h-auto mb-4 justify-start no-scrollbar touch-pan-x">';
const newTabsTrigger = tabsTriggerTarget + '\n          <TabsTrigger value="leaderboard" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Trophy className="h-4 w-4" /> Leaderboard</TabsTrigger>';
if (!content.includes('value="leaderboard"')) {
  content = content.replace(tabsTriggerTarget, newTabsTrigger);
}

const tabsContentTarget = '<div className="mt-4">';
const newTabsContent = tabsContentTarget + '\n          <TabsContent value="leaderboard"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl min-h-[60vh]"><Leaderboard /></Card></TabsContent>';
if (!content.includes('<TabsContent value="leaderboard">')) {
  content = content.replace(tabsContentTarget, newTabsContent);
}

fs.writeFileSync('src/app/arcade/page.tsx', content);
console.log('Leaderboard added');
