
"use client"

import * as React from "react"
import { Compass, Plus, MapPin, CheckCircle2, ChevronRight, Trophy, Zap, Loader2, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function QuestPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const questsQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(collection(db, "quests"), where("familyId", "==", profile.familyId))
  }, [db, profile?.familyId])

  const { data: quests, loading } = useCollection(questsQuery)

  const handleCompleteStep = (questId: string, stepIdx: number) => {
    if (!db || !quests) return
    const quest = quests.find(q => q.id === questId)
    if (!quest) return

    const newSteps = [...quest.steps]
    newSteps[stepIdx] = { ...newSteps[stepIdx], completed: !newSteps[stepIdx].completed }
    
    const allDone = newSteps.every(s => s.completed)
    updateDoc(doc(db, "quests", questId), {
      steps: newSteps,
      status: allDone ? "completed" : "active"
    })
    
    if (allDone) {
      toast({ title: "Quest Completed!", description: `Earned ${quest.pointsReward} bonus XP!` })
    }
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 pr-14">
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
        <Button className="rounded-2xl h-12 px-6 bg-primary shadow-lg font-black uppercase text-[10px] tracking-widest">
           <Plus className="h-4 w-4 mr-2" /> Launch Quest
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
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
                    <CardHeader className="p-8 pb-4">
                       <div className="flex justify-between items-start mb-4">
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3">
                             {quest.pointsReward} XP REWARD
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{quest.status}</span>
                       </div>
                       <CardTitle className="text-2xl font-black uppercase tracking-tight">{quest.title}</CardTitle>
                       <CardDescription className="font-bold text-xs">{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
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

        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-[2rem] border-none shadow-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-8">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
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
