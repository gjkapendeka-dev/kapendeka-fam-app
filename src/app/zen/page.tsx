
"use client"

import * as React from "react"
import { Wind, Moon, Sun, Cloud, Heart, Play, RefreshCw, Loader2, Sparkles, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser, useFirestore } from "@/firebase"
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function ZenSpacePage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [activeTab, setActiveIdx] = React.useState<number | null>(null)
  const [timer, setTimer] = React.useState(0)
  const [isMeditating, setIsMeditating] = React.useState(false)

  React.useEffect(() => {
    let interval: any
    if (isMeditating) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isMeditating])

  const handleFinish = async () => {
    if (!db || !profile) return
    setIsMeditating(false)
    const mins = Math.floor(timer / 60) || 1
    
    await addDoc(collection(db, "zenMoments"), {
      familyId: profile.familyId,
      userId: profile.id,
      userName: profile.displayName,
      duration: mins,
      createdAt: serverTimestamp()
    })

    await updateDoc(doc(db, "users", profile.id), {
      points: increment(mins * 20)
    })

    toast({ title: "Zen Moment Archived", description: `You earned ${mins * 20} Tranquility Points.` })
    setTimer(0)
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-4xl mx-auto pb-24 pr-14">
      <header className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xl">
           <Wind className="h-6 w-6" />
        </div>
        <div>
           <h1 className="text-3xl font-black uppercase italic text-primary">Zen Space</h1>
           <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Family Mindfulness & Calm</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <Card className="rounded-[3rem] border-none shadow-2xl bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-12 text-center overflow-hidden relative">
          <div className="absolute -top-10 -left-10 h-64 w-64 bg-sky-100/40 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-8">
            {isMeditating ? (
              <div className="space-y-12 animate-in zoom-in duration-500">
                 <div className="h-48 w-48 rounded-full border-8 border-sky-200 border-t-sky-500 animate-spin mx-auto flex items-center justify-center">
                    <span className="text-5xl font-black text-sky-600">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
                 </div>
                 <h2 className="text-3xl font-black uppercase tracking-tighter text-sky-900">Breathing with the Universe</h2>
                 <Button onClick={handleFinish} className="h-16 px-12 rounded-2xl bg-sky-600 text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-sky-200">
                    Finish Session
                 </Button>
              </div>
            ) : (
              <div className="space-y-6">
                 <h2 className="text-4xl font-black uppercase tracking-tighter text-sky-900">Enter the Void</h2>
                 <p className="text-muted-foreground font-medium max-w-sm mx-auto uppercase text-xs tracking-widest">Find your center. The Hub will track your tranquility nodes.</p>
                 <div className="flex justify-center gap-4 py-8">
                    {[
                      { icon: Sun, label: "Morning" },
                      { icon: Moon, label: "Night" },
                      { icon: Cloud, label: "Deep" }
                    ].map((mode, i) => (
                      <button key={i} className="h-24 w-24 rounded-3xl bg-white shadow-xl flex flex-col items-center justify-center gap-2 group hover:bg-sky-500 hover:text-white transition-all active:scale-95">
                         <mode.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase">{mode.label}</span>
                      </button>
                    ))}
                 </div>
                 <Button onClick={() => setIsMeditating(true)} className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105">
                    <Play className="h-6 w-6 mr-3" /> Start Zen Portal
                 </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="rounded-[2.5rem] border-none shadow-lg bg-white p-8">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                 <Heart className="h-4 w-4" /> Universe Daily Wisdom
              </h4>
              <p className="text-lg font-bold italic text-slate-700 leading-relaxed">
                 "In the silence of the hub, the family nodes find their strongest alignment."
              </p>
           </Card>
           <Card className="rounded-[2.5rem] border-none shadow-lg bg-white p-8">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                 <Zap className="h-4 w-4" /> Tranquility XP
              </h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs font-black uppercase opacity-60">
                    <span>Weekly Goal</span>
                    <span>120 / 300 Mins</span>
                 </div>
                 <Progress value={40} className="h-2" />
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
