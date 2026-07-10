"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser, useSupabase } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Trophy, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

export default function GameReportPage() {
  const router = useRouter()
  const { id: sessionId } = useParams()
  const { profile } = useUser()
  const supabase = useSupabase()

  const [sessionData, setSessionData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    async function loadReport() {
      if (!supabase || !sessionId) return
      try {
        setLoading(true)
        const { data: session, error: err } = await supabase
          .from("quiz_sessions")
          .select(`
            *,
            quizzes (title, description),
            quiz_session_players (*),
            quiz_responses (*)
          `)
          .eq("id", sessionId)
          .single()

        if (err) throw err
        setSessionData(session)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [supabase, sessionId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-indigo-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 font-bold uppercase tracking-widest text-xs">Loading Report...</p>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Failed to load report: {error}</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  // Calculate stats
  const players = sessionData.quiz_session_players || []
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  
  const responses = sessionData.quiz_responses || []
  const questionAccuracy: Record<number, { correct: number, total: number }> = {}
  
  responses.forEach((r: any) => {
    if (!questionAccuracy[r.question_index]) {
      questionAccuracy[r.question_index] = { correct: 0, total: 0 }
    }
    questionAccuracy[r.question_index].total++
    if (r.is_correct) {
      questionAccuracy[r.question_index].correct++
    }
  })

  const difficultQuestions = Object.entries(questionAccuracy)
    .filter(([_, stats]) => (stats.correct / stats.total) < 0.5)
    .map(([index, _]) => parseInt(index) + 1) // 1-based index

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/games")} className="h-10 w-10 bg-white rounded-full shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-indigo-900">{sessionData.quizzes?.title || "Unknown Quiz"} - Report</h1>
          <p className="text-muted-foreground font-medium">Played on {new Date(sessionData.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-xl shadow-indigo-500/5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Players</p>
            <p className="text-5xl font-black">{players.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl shadow-amber-500/5 bg-gradient-to-br from-amber-400 to-amber-500 text-white md:col-span-2">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <div className="flex items-start gap-4">
              <Trophy className="h-12 w-12 text-amber-200" />
              <div>
                <p className="text-amber-100 font-bold uppercase tracking-widest text-xs mb-2">Podium Winners</p>
                <div className="flex items-center gap-4">
                  {sortedPlayers.slice(0, 3).map((p: any, i: number) => (
                    <div key={p.id} className="flex flex-col items-center bg-white/20 rounded-xl px-4 py-2 min-w-[100px]">
                      <span className="font-black text-xl text-white">#{i + 1}</span>
                      <span className="font-bold text-sm text-amber-50 truncate max-w-[80px]">{p.student_name}</span>
                    </div>
                  ))}
                  {sortedPlayers.length === 0 && <span className="text-xl font-bold">No players</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-2 border-slate-100 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Difficult Questions</CardTitle>
            <CardDescription>Questions where more than 50% of players answered incorrectly.</CardDescription>
          </CardHeader>
          <CardContent>
            {difficultQuestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {difficultQuestions.map(q => (
                  <Badge key={q} variant="destructive" className="text-sm px-4 py-1">Question {q}</Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold">Everyone scored well! No difficult questions.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-2 border-slate-100 shadow-none">
          <CardHeader>
            <CardTitle>Player Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedPlayers.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-400 w-6">#{i+1}</span>
                    <span className="font-bold text-slate-700">{p.student_name}</span>
                  </div>
                  <Badge variant="secondary" className="font-black">{p.score} pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
