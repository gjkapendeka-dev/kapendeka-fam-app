
"use client"

import * as React from "react"
import { HelpCircle, Trophy, Zap, ArrowRight, Play, RefreshCw, Loader2, Sparkles, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser, useFirestore } from "@/firebase"
import { doc, updateDoc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const QUESTIONS = [
  { q: "What is the family's favorite vacation destination?", options: ["Cape Town", "Durban", "Kruger Park", "Sun City"], correct: 0 },
  { q: "Who in the family has the highest chore streak?", options: ["George", "Sarah", "Junior", "None of us!"], correct: 2 },
  { q: "What is our official family motto?", options: ["Unity is Strength", "One Family, One Universe", "Always Moving", "Love First"], correct: 1 },
  { q: "Which day is 'Sunday Braai' usually held?", options: ["Saturday", "Sunday", "Any day!", "Christmas only"], correct: 1 },
]

export default function TriviaPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [gameState, setGameState] = React.useState<"idle" | "playing" | "result">("idle")
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [score, setScore] = React.useState(0)
  const [selected, setSelected] = React.useState<number | null>(null)

  const handleStart = () => {
    setGameState("playing")
    setCurrentIdx(0)
    setScore(0)
    setSelected(null)
  }

  const handleAnswer = (idx: number) => {
    setSelected(idx)
    if (idx === QUESTIONS[currentIdx].correct) {
      setScore(s => s + 1)
      toast({ title: "Correct!", className: "bg-emerald-500 text-white" })
    } else {
      toast({ variant: "destructive", title: "Incorrect!" })
    }

    setTimeout(() => {
      if (currentIdx + 1 < QUESTIONS.length) {
        setCurrentIdx(c => c + 1)
        setSelected(null)
      } else {
        setGameState("result")
        // Award points for completion
        if (db && profile) {
          updateDoc(doc(db, "users", profile.id), {
            points: increment(score * 50)
          })
        }
      }
    }, 1000)
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-4xl mx-auto pb-24 pr-14">
      <header className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl">
           <HelpCircle className="h-6 w-6" />
        </div>
        <div>
           <h1 className="text-3xl font-black uppercase italic text-primary">Trivia Quest</h1>
           <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">How well do you know the Universe?</p>
        </div>
      </header>

      {gameState === "idle" ? (
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-12 text-center overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <Trophy className="h-48 w-48" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Universe Trivia</h2>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">Prove you're the master node of the Kapendeka Universe. Earn XP for every correct answer.</p>
          <Button onClick={handleStart} className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105">
             <Play className="h-6 w-6 mr-3" /> Begin Challenge
          </Button>
        </Card>
      ) : gameState === "playing" ? (
        <div className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[10px] uppercase px-4 py-1">
                 Question {currentIdx + 1} / {QUESTIONS.length}
              </Badge>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Score: {score}</div>
           </div>
           <Progress value={((currentIdx + 1) / QUESTIONS.length) * 100} className="h-2 bg-muted/20" />
           <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-10">
              <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-8 leading-tight">{QUESTIONS[currentIdx].q}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {QUESTIONS[currentIdx].options.map((opt, i) => (
                    <Button 
                      key={i} 
                      variant={selected === i ? (i === QUESTIONS[currentIdx].correct ? "default" : "destructive") : "outline"}
                      className="h-16 rounded-2xl font-bold text-lg justify-start px-8 shadow-sm transition-all active:scale-95"
                      onClick={() => selected === null && handleAnswer(i)}
                      disabled={selected !== null}
                    >
                       <span className="h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center mr-4 text-xs font-black">{String.fromCharCode(65 + i)}</span>
                       {opt}
                    </Button>
                 ))}
              </div>
           </Card>
        </div>
      ) : (
        <Card className="rounded-[3rem] border-none shadow-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white p-12 text-center">
           <div className="h-24 w-24 rounded-[2rem] bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Star className="h-12 w-12 text-white fill-white" />
           </div>
           <h2 className="text-5xl font-black uppercase tracking-tighter mb-2">Game Over!</h2>
           <p className="text-2xl font-bold opacity-80 mb-8">You scored {score} out of {QUESTIONS.length}</p>
           <div className="bg-white/10 p-6 rounded-3xl border border-white/10 mb-8 max-w-xs mx-auto">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Rewards Earned</div>
              <div className="text-3xl font-black mt-1">+{score * 50} XP</div>
           </div>
           <Button onClick={handleStart} className="h-14 px-10 rounded-2xl bg-white text-orange-600 font-black uppercase tracking-widest shadow-2xl">
              <RefreshCw className="h-5 w-5 mr-3" /> Try Again
           </Button>
        </Card>
      )}
    </div>
  )
}
