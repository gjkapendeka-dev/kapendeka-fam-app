"use client"

import * as React from "react"
import { Compass, Plus, MapPin, CheckCircle2, ChevronRight, Trophy, Zap, Loader2, Target, Maximize } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

export default function QuestPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

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


  const questsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("quests").select("*").eq("familyId", profile.familyId)
  }, [supabase, profile?.familyId])

  const { data: quests, loading } = useCollection(questsQuery)

  const toggleLandscape = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape')
        }
      } else {
        document.exitFullscreen()
      }
    } catch (e) {
      console.warn("Fullscreen failed:", e)
    }
  }

  const handleCompleteStep = (questId: string, stepIdx: number) => {
    if (!supabase || !quests) return
    const quest = quests.find(q => q.id === questId)
    if (!quest) return

    const newSteps = [...quest.steps]
    newSteps[stepIdx] = { ...newSteps[stepIdx], completed: !newSteps[stepIdx].completed }
    
    
    const allDone = newSteps.every(s => s.completed)
    supabase.from("quests").update({
      steps: newSteps,
      status: allDone ? "completed" : "active"
    }).eq("id", questId)
    
    if (allDone && profile?.role !== 'parent') {
      supabase.from("profiles").update({ points: (profile.points || 0) + quest.points_reward }).eq("id", profile.id).then(() => {
        toast({ title: "Quest Completed!", description: `Earned ${quest.points_reward} bonus XP!` })
      })
    } else if (allDone) {
      toast({ title: "Quest Completed!", description: "Kids earn XP for this!" })
    }
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-5xl mx-auto pb-20 pr-14">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl">
              <Compass className="h-6 w-6" />
           </div>
           <div>
              <h1 className="text-3xl font-black uppercase italic text-primary">Universe Quests</h1>
              <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Active Adventures for the Kids</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleLandscape}
            className="rounded-xl font-bold border-primary/20 text-primary h-11 px-4 shadow-sm"
          >
            <Maximize className="h-4 w-4 mr-2" /> 
            Rotate
          </Button>
          
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

        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
           {loading ? (
             [1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-[2.5rem]" />)
           ) : (quests || []).length === 0 ? (
             <div className="py-24 bg-muted/20 rounded-[3rem] border-4 border-dashed border-muted/50 text-center">
                <Target className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-xl font-black uppercase tracking-tighter">No Active Quests</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Parents can setup hunts and challenges here.</p>
             </div>
           ) : (
             quests?.map((quest) => {
               const completedCount = quest.steps.filter((s:any) => s.completed).length
               const pct = (completedCount / quest.steps.length) * 100
               return (
                 <Card key={quest.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group">
                    <CardHeader className="p-4 pb-4">
                       <div className="flex justify-between items-start mb-4">
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3">
                             {quest.points_reward} XP REWARD
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{quest.status}</span>
                       </div>
                       <CardTitle className="text-2xl font-black uppercase tracking-tight">{quest.title}</CardTitle>
                       <CardDescription className="font-bold text-xs">{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                             <span>Exploration Progress</span>
                             <span>{completedCount} / {quest.steps.length} Steps</span>
                          </div>
                          <Progress value={pct} className="h-2 bg-emerald-50" />
                       </div>
                       <div className="grid gap-3">
                          {quest.steps.map((step: any, idx: number) => (
                            <button 
                              key={idx}
                              onClick={() => handleCompleteStep(quest.id, idx)}
                              className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${step.completed ? 'bg-emerald-50 opacity-60' : 'bg-muted/20 hover:bg-muted/30'}`}
                            >
                               <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${step.completed ? 'bg-emerald-500 text-white' : 'bg-white text-muted-foreground'}`}>
                                  {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                               </div>
                               <div>
                                  <div className={`font-black text-sm uppercase ${step.completed ? 'line-through' : ''}`}>{step.label}</div>
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase">{step.hint}</div>
                               </div>
                            </button>
                          ))}
                       </div>
                    </CardContent>
                 </Card>
               )
             })
           )}
        </div>

        <div className="lg:col-span-4 space-y-4">
           <Card className="rounded-[2rem] border-none shadow-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-4">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                 <Trophy className="h-8 w-8 text-yellow-400 fill-yellow-400" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Master Explorer</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-xs font-black uppercase opacity-70">
                    <span>Quests Done</span>
                    <span>12</span>
                 </div>
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full shadow-lg" style={{ width: '65%' }} />
                 </div>
                 <p className="text-[10px] font-bold text-white/60 leading-relaxed italic uppercase pt-4">
                    "Every room in the hub hides a new mystery waiting for the bold nodes of the Universe."
                 </p>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
