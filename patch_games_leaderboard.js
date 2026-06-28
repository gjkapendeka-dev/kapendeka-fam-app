const fs = require('fs');
let content = fs.readFileSync('src/app/games/page.tsx', 'utf8');

const queryCode = `
  // Fetch Family Leaderboard
  const leaderboardQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("profiles").select("*").eq("family_id", profile.familyId).order("points", { ascending: false })
  }, [supabase, profile?.familyId])
  const { data: profiles } = useCollection(leaderboardQuery)
  
  const leaderboard = (profiles || []).map(p => ({
    name: p.display_name,
    points: p.points || 0,
    level: Math.floor((p.points || 0) / 200) + 1,
    streak: p.streak_days || 0,
    avatar: p.display_name?.charAt(0) || "?",
    id: p.id,
    avatar_url: p.avatar_url
  }))
`;

const mockBlock = `
  // Leaderboard Mock
  const leaderboard = [
    { name: "George", points: 2850, level: 15, streak: 12, avatar: "G" },
    { name: "Junior", points: 1420, level: 8, streak: 5, avatar: "J" },
    { name: "Sarah", points: 910, level: 6, streak: 3, avatar: "S" },
  ]
`;

if (content.includes('// Leaderboard Mock')) {
    content = content.replace(mockBlock, queryCode);
}

// Update avatar URL inside leaderboard
const oldAvatar = '<AvatarImage src={`https://picsum.photos/seed/${m.name}/100/100`} />';
const newAvatar = '<AvatarImage src={m.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${m.id}`} />';
if (content.includes(oldAvatar)) {
  content = content.replace(oldAvatar, newAvatar);
}

fs.writeFileSync('src/app/games/page.tsx', content);
console.log('Leaderboard updated to live database');
