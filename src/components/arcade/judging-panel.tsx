"use client"

import * as React from "react"
import { Plus, X, Check, Star, Mic2, UserPlus, Trophy, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { audio } from "@/lib/audio"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

type Contestant = {
  id: string
  name: string
  status: "pending" | "yes" | "no" | "golden"
}

export function JudgingPanel() {
  const [contestants, setContestants] = React.useState<Contestant[]>([])
  const [newContestant, setNewContestant] = React.useState("")
  const [activeContestantId, setActiveContestantId] = React.useState<string | null>(null)

  const activeContestant = contestants.find(c => c.id === activeContestantId)

  const addContestant = () => {
    if (!newContestant.trim()) return
    const newEntry: Contestant = {
      id: Date.now().toString(),
      name: newContestant.trim(),
      status: "pending"
    }
    setContestants(prev => [...prev, newEntry])
    setNewContestant("")
    if (!activeContestantId) {
      setActiveContestantId(newEntry.id)
    }
  }

  const handleVote = (status: "yes" | "no" | "golden") => {
    if (!activeContestantId) return

    if (status === "yes") {
      audio.playWin()
    } else if (status === "no") {
      audio.playSad() // Or we can use playBoom for a loud X
      audio.playBoom()
    } else if (status === "golden") {
      audio.playGoldenBuzzer()
      // Multi-burst confetti over 5 seconds to match the fanfare
      const colors = ['#FFD700', '#FFA500', '#FFFFFF', '#FFE066', '#FF6B35']
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, colors })
      setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { x: 0.2, y: 0.7 }, colors }), 800)
      setTimeout(() => confetti({ particleCount: 180, spread: 130, origin: { x: 0.8, y: 0.7 }, colors }), 1600)
      setTimeout(() => confetti({ particleCount: 250, spread: 150, origin: { y: 0.5 }, colors }), 2500)
      setTimeout(() => confetti({ particleCount: 200, angle: 60, spread: 80, origin: { x: 0, y: 0.6 }, colors }), 3200)
      setTimeout(() => confetti({ particleCount: 200, angle: 120, spread: 80, origin: { x: 1, y: 0.6 }, colors }), 3200)
      setTimeout(() => confetti({ particleCount: 300, spread: 180, origin: { y: 0.4 }, startVelocity: 40, colors }), 4000)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300, 100, 800])
      }
    }

    setContestants(prev => prev.map(c => 
      c.id === activeContestantId ? { ...c, status } : c
    ))
  }

  const selectContestant = (id: string) => {
    setActiveContestantId(id)
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-6 px-4 w-full sm:min-w-[400px] md:min-w-[600px] overflow-hidden bg-slate-950 rounded-[3rem] text-slate-100 relative">
      {/* Stage Lights effect */}
      <div className="absolute top-0 left-1/4 w-32 h-64 bg-blue-500/20 blur-[100px] -rotate-12 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-32 h-64 bg-purple-500/20 blur-[100px] rotate-12 pointer-events-none" />

      <div className="flex items-center justify-between w-full mb-2 z-10">
        <h3 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
          <Mic2 className="h-8 w-8 text-yellow-500" />
          KAPENDEKA IDOL
        </h3>
        <div className="flex gap-4 items-center">
           <Badge className="bg-slate-800 text-white font-bold tracking-widest uppercase py-1.5 px-4 rounded-xl border border-slate-700">
             {contestants.length} Acts
           </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-6 z-10">
        {/* Adjudication Panel */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800">
          
          <div className="text-center min-h-[120px] flex flex-col items-center justify-center">
            {activeContestant ? (
              <>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Currently Judging</p>
                <h2 className="text-4xl font-black text-white">{activeContestant.name}</h2>
                {activeContestant.status !== 'pending' && (
                  <Badge className={cn(
                    "mt-4 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border-none",
                    activeContestant.status === 'yes' ? 'bg-emerald-500 text-white' : '',
                    activeContestant.status === 'no' ? 'bg-red-500 text-white' : '',
                    activeContestant.status === 'golden' ? 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white shadow-[0_0_20px_rgba(251,191,36,0.5)]' : ''
                  )}>
                    {activeContestant.status === 'yes' ? 'Proceeds' : activeContestant.status === 'no' ? 'Eliminated' : 'GOLDEN BUZZER!'}
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-slate-500 font-medium">Add or select a contestant to begin judging!</p>
            )}
          </div>

          <div className="flex gap-4 items-center justify-center w-full max-w-sm">
            <button 
              onClick={() => handleVote("no")}
              disabled={!activeContestantId}
              className="group relative flex items-center justify-center h-24 w-24 rounded-full bg-red-500 shadow-[0_10px_0_rgb(153,27,27)] active:translate-y-2 active:shadow-[0_2px_0_rgb(153,27,27)] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4 border-red-400"
            >
              <X className="h-12 w-12 text-white drop-shadow-md group-active:scale-90 transition-transform" />
            </button>
            
            <button 
              onClick={() => handleVote("golden")}
              disabled={!activeContestantId}
              className="group relative flex items-center justify-center h-32 w-32 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 shadow-[0_12px_0_rgb(180,83,9),0_0_30px_rgba(251,191,36,0.6)] active:translate-y-2 active:shadow-[0_2px_0_rgb(180,83,9),0_0_15px_rgba(251,191,36,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4 border-yellow-200 z-10"
            >
              <Star className="h-16 w-16 text-white drop-shadow-lg group-active:scale-90 transition-transform fill-white" />
            </button>

            <button 
              onClick={() => handleVote("yes")}
              disabled={!activeContestantId}
              className="group relative flex items-center justify-center h-24 w-24 rounded-full bg-emerald-500 shadow-[0_10px_0_rgb(6,95,70)] active:translate-y-2 active:shadow-[0_2px_0_rgb(6,95,70)] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4 border-emerald-400"
            >
              <Check className="h-12 w-12 text-white drop-shadow-md group-active:scale-90 transition-transform" />
            </button>
          </div>

        </div>

        {/* Contestants List */}
        <div className="w-full md:w-72 flex flex-col space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Contestant Name" 
              className="h-12 rounded-xl bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
              value={newContestant} 
              onChange={(e) => setNewContestant(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addContestant()}
            />
            <Button size="icon" className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={addContestant}><UserPlus className="h-5 w-5" /></Button>
          </div>

          <div className="flex-1 bg-slate-900/80 rounded-2xl border border-slate-800 p-2 overflow-y-auto max-h-[300px] flex flex-col gap-2">
            {contestants.length === 0 && (
               <div className="text-center p-4 text-slate-500 text-sm font-medium">No contestants yet.</div>
            )}
            {contestants.map(c => (
              <div 
                key={c.id} 
                onClick={() => selectContestant(c.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                  activeContestantId === c.id ? "bg-slate-800 border border-slate-700 shadow-md" : "hover:bg-slate-800/50 border border-transparent"
                )}
              >
                <div className="font-bold text-white text-sm">{c.name}</div>
                <div className="flex items-center">
                  {c.status === 'yes' && <Check className="h-4 w-4 text-emerald-500" />}
                  {c.status === 'no' && <X className="h-4 w-4 text-red-500" />}
                  {c.status === 'golden' && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
