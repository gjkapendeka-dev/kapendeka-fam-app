const fs = require('fs');
let content = fs.readFileSync('src/app/quest/page.tsx', 'utf8');

const parentDialogJSX = `
          {profile?.role === 'parent' && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl h-12 px-6 bg-primary text-white shadow-lg font-black uppercase text-[10px] tracking-widest">
                  <Plus className="h-4 w-4 mr-2" /> Launch Quest
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Epic Quest</DialogTitle>
                  <DialogDescription>Bundle tasks for massive XP.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Quest Title</Label>
                    <Input value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} placeholder="e.g. The Morning Routine" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} placeholder="Complete this before school!" />
                  </div>
                  <div className="grid gap-2">
                    <Label>XP Reward</Label>
                    <Input type="number" value={newQuest.points_reward} onChange={e => setNewQuest({...newQuest, points_reward: parseInt(e.target.value)})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Step 1</Label>
                    <Input value={newQuest.step1} onChange={e => setNewQuest({...newQuest, step1: e.target.value})} placeholder="e.g. Make Bed" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Step 2</Label>
                    <Input value={newQuest.step2} onChange={e => setNewQuest({...newQuest, step2: e.target.value})} placeholder="e.g. Brush Teeth" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Step 3</Label>
                    <Input value={newQuest.step3} onChange={e => setNewQuest({...newQuest, step3: e.target.value})} placeholder="e.g. Eat Breakfast" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateQuest} disabled={!newQuest.title || !newQuest.step1 || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Launch Quest
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
`;

const replaceTarget = `<Button className="rounded-2xl h-12 px-6 bg-primary text-white shadow-lg font-black uppercase text-[10px] tracking-widest">
             <Plus className="h-4 w-4 mr-2" /> Launch Quest
          </Button>`;

if (content.includes(replaceTarget)) {
  content = content.replace(replaceTarget, parentDialogJSX);
}

// Add state
const stateHook = `
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [newQuest, setNewQuest] = React.useState({ title: "", description: "", points_reward: 500, step1: "", step2: "", step3: "" })

  const handleCreateQuest = async () => {
    if (!supabase || !profile?.familyId) return
    setIsSubmitting(true)
    
    const steps = []
    if (newQuest.step1) steps.push({ label: newQuest.step1, hint: "Required", completed: false })
    if (newQuest.step2) steps.push({ label: newQuest.step2, hint: "Required", completed: false })
    if (newQuest.step3) steps.push({ label: newQuest.step3, hint: "Required", completed: false })

    const { error } = await supabase.from("quests").insert([{
      family_id: profile.familyId,
      title: newQuest.title,
      description: newQuest.description,
      points_reward: newQuest.points_reward,
      steps: steps
    }])

    setIsSubmitting(false)
    if (!error) {
      setIsCreateOpen(false)
      setNewQuest({ title: "", description: "", points_reward: 500, step1: "", step2: "", step3: "" })
      toast({ title: "Quest Launched!" })
    }
  }
`;

content = content.replace('const { toast } = useToast()', 'const { toast } = useToast()\n' + stateHook);

// Also fix the property naming issue for quests
content = content.replace('quest.pointsReward', 'quest.points_reward');
content = content.replace('quest.pointsReward', 'quest.points_reward');

// Also update the xp awarding
const handleCompleteTarget = `
    const allDone = newSteps.every(s => s.completed)
    supabase.from("quests").update({
      steps: newSteps,
      status: allDone ? "completed" : "active"
    }).eq("id", questId)
    
    if (allDone) {
      toast({ title: "Quest Completed!", description: \`Earned \${quest.pointsReward} bonus XP!\` })
    }
`;

const newCompleteTarget = `
    const allDone = newSteps.every(s => s.completed)
    supabase.from("quests").update({
      steps: newSteps,
      status: allDone ? "completed" : "active"
    }).eq("id", questId)
    
    if (allDone && profile?.role !== 'parent') {
      supabase.from("profiles").update({ points: (profile.points || 0) + quest.points_reward }).eq("id", profile.id).then(() => {
        toast({ title: "Quest Completed!", description: \`Earned \${quest.points_reward} bonus XP!\` })
      })
    } else if (allDone) {
      toast({ title: "Quest Completed!", description: "Kids earn XP for this!" })
    }
`;

content = content.replace(handleCompleteTarget, newCompleteTarget);
// wait handleCompleteTarget has quest.pointsReward but I replaced it above with quest.points_reward.
// Let's use string replace on the exact text.
// To be safe, I'll use regex.
content = content.replace(/const allDone = newSteps\.every.*?if \(allDone\).*?}/s, newCompleteTarget);

// Also add Dialog imports
if (!content.includes('DialogContent')) {
  const dialogImport = `import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"\n`;
  content = dialogImport + content;
  content = content.replace('import { Label } from "@/components/ui/label"', 'import { Label } from "@/components/ui/label"\n' + dialogImport);
}

fs.writeFileSync('src/app/quest/page.tsx', content);
console.log('Quests updated');
