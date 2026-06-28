
"use client"

import * as React from "react"
import { 
  Target, 
  Plus, 
  Sun, 
  Moon, 
  Coffee, 
  CloudSun, 
  CheckCircle2, 
  Loader2, 
  Trash2,
  Trophy,
  Sparkles,
  Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const TIME_OF_DAY = [
  { value: "morning", label: "Morning Ritual", icon: Sun, color: "text-amber-500 bg-amber-50" },
  { value: "afternoon", label: "Afternoon Sync", icon: CloudSun, color: "text-sky-500 bg-sky-50" },
  { value: "evening", label: "Evening Wind-down", icon: Moon, color: "text-indigo-500 bg-indigo-50" },
  { value: "anytime", label: "Universe Anytime", icon: Target, color: "text-primary bg-primary/5" },
]

export default function RitualsPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [timeOfDay, setTimeOfDay] = React.useState("morning")
  const [points, setPoints] = React.useState("100")

  const ritualsQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(
      collection(db, "rituals"),
      where("familyId", "==", profile.familyId)
    )
  }, [db, profile?.familyId])

  const { data: rituals, loading } = useCollection(ritualsQuery)

  const handleAddRitual = () => {
    if (!db || !profile?.familyId || !title) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      title,
      description,
      timeOfDay,
      pointsValue: parseInt(points),
      lastCompletedAt: null,
      createdAt: serverTimestamp(),
    }

    addDoc(collection(db, "rituals"), data)
      .then(() => {
        setIsDialogOpen(false)
        setTitle("")
        setDescription("")
        toast({ title: "Ritual Anchored", description: `${title} is now a family tradition.` })
      })
      .finally(() => setIsSubmitting(false))
  }

  const handleComplete = (ritualId: string, ritualPoints: number) => {
    if (!db || !profile) return
    
    // Complete ritual logic
    updateDoc(doc(db, "rituals", ritualId), {
      lastCompletedAt: serverTimestamp()
    })
    
    // Award points
    updateDoc(doc(db, "users", profile.id), {
      points: increment(ritualPoints)
    })

    toast({ 
      title: "Ritual Honored!", 
      description: `You earned ${ritualPoints} points for maintaining the Universe.`,
      variant: "default"
    })
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteDoc(doc(db, "rituals", id))
      .then(() => toast({ title: "Ritual Removed" }))
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:pr-0 pr-14">
        <div>
          <Badge className="bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] mb-2 px-3">Legacy Feature</Badge>
          <h1 className="text-4xl font-black tracking-tight text-primary uppercase italic">Family Rituals</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Designing the Kapendeka Daily Cycle</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-[1.5rem] h-14 px-8 font-black uppercase tracking-widest text-[11px] bg-primary shadow-2xl shadow-primary/20 group">
              <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform" /> Create Tradition
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] border-none shadow-2xl">
            <DialogHeader className="p-4">
              <DialogTitle className="text-2xl font-black uppercase">Anchor a New Ritual</DialogTitle>
              <DialogDescription className="font-bold text-[10px] uppercase tracking-widest">Rituals define your family identity.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 p-4">
              <div className="grid gap-2">
                <Label className="font-black uppercase text-[10px] tracking-widest">Name</Label>
                <Input placeholder="e.g. Sunday Braai Setup" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl" />
              </div>
              <div className="grid gap-2">
                <Label className="font-black uppercase text-[10px] tracking-widest">Mission</Label>
                <Input placeholder="What is the goal of this ritual?" value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 rounded-2xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest">Solar Cycle</Label>
                  <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_OF_DAY.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest">XP Value</Label>
                  <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="h-12 rounded-2xl" />
                </div>
              </div>
            </div>
            <DialogFooter className="p-4">
              <Button onClick={handleAddRitual} disabled={!title || isSubmitting} className="w-full h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-sm">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Establish Ritual
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-[3rem]" />)
            ) : rituals?.length === 0 ? (
              <Card className="col-span-full py-24 bg-white rounded-[4rem] border-4 border-dashed border-muted/50 flex flex-col items-center text-center">
                <div className="h-24 w-24 bg-muted/20 rounded-[2.5rem] flex items-center justify-center mb-6">
                  <Target className="h-12 w-12 text-muted-foreground/20" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">The Universe is Waiting</h3>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] max-w-xs mt-2">Create rituals to build a daily family legacy.</p>
              </Card>
            ) : (
              rituals?.map((ritual) => {
                const timeInfo = TIME_OF_DAY.find(t => t.value === ritual.timeOfDay) || TIME_OF_DAY[3]
                return (
                  <Card key={ritual.id} className="rounded-[3rem] border-none shadow-xl shadow-primary/5 bg-white overflow-hidden group hover:shadow-primary/10 transition-all border-l-8 border-l-transparent hover:border-l-primary">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${timeInfo.color}`}>
                          <timeInfo.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-[0.2em] bg-muted/50 border-none px-2">
                          {ritual.pointsValue} XP
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">{ritual.title}</CardTitle>
                      <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">{ritual.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleComplete(ritual.id, ritual.pointsValue)}
                          className="flex-1 rounded-[1.5rem] h-12 font-black uppercase tracking-widest text-[10px] bg-accent shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(ritual.id)}
                          className="rounded-2xl h-12 w-12 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[3rem] bg-gradient-to-br from-amber-400 to-orange-600 text-white p-10 relative overflow-hidden shadow-2xl shadow-orange-500/20">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Trophy className="h-24 w-24" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Consistency Score</h3>
            <div className="text-6xl font-black mb-6">94%</div>
            <div className="space-y-4">
               <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest opacity-80">
                  <span>Daily Ritual Streak</span>
                  <span>12 Days</span>
               </div>
               <div className="h-2 w-full bg-white/20 rounded-full">
                  <div className="h-full bg-white rounded-full shadow-lg" style={{ width: '94%' }} />
               </div>
            </div>
            <p className="mt-8 text-sm font-bold text-white/80 leading-relaxed italic">
              "The secret to a great family life is hidden in your daily routine."
            </p>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 space-y-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Zap className="h-6 w-6" />
               </div>
               <h4 className="text-lg font-black uppercase tracking-tighter">Ritual Stats</h4>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-muted pb-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Morning Done</span>
                  <span className="font-black text-primary">85%</span>
               </div>
               <div className="flex items-center justify-between border-b border-muted pb-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Evening Sync</span>
                  <span className="font-black text-primary">92%</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Weekly Rituals</span>
                  <span className="font-black text-primary">42/50</span>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
