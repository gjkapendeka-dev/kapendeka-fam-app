const fs = require('fs');
let content = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

const simulateMidnightBtn = `
        {profile?.role === 'parent' && (
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                <h2 className="text-xl font-bold">Midnight Reset (Test)</h2>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This button simulates the automated midnight cron job. It resets all daily recurring chores.</p>
                <Button onClick={handleSimulateMidnight} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                  <Sparkles className="h-4 w-4 mr-2" /> Simulate Midnight Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
`;

const midnightHook = `
  const handleSimulateMidnight = async () => {
    if (!supabase || !profile?.familyId) return
    
    // Reset all chores where recurrence is daily or done_at is not null
    await supabase.from("chores").update({
      done_at: null,
      done_by: null
    }).eq("family_id", profile.familyId).neq("done_at", null)

    // Reset quests logic: we can just leave quests as they are or reset their steps
    
    toast({ title: "Midnight Simulated", description: "All daily chores have been reset for the new day!" })
  }
`;

if (!content.includes('handleSimulateMidnight')) {
  // Insert hook
  content = content.replace('const handleSave = async () => {', midnightHook + '\n\n  const handleSave = async () => {');
  
  // Insert button
  content = content.replace('</CardContent>\n        </Card>\n\n        <Card', '</CardContent>\n        </Card>\n\n' + simulateMidnightBtn + '\n\n        <Card');
}

fs.writeFileSync('src/app/settings/page.tsx', content);
console.log('Settings page updated with simulate midnight button');
