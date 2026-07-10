"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser, useSupabase } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, TrendingUp, Target, Zap, Award } from "lucide-react"

export default function StudentProgressPage() {
  const router = useRouter()
  const { profile } = useUser()
  const supabase = useSupabase()

  const [attempts, setAttempts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      if (!supabase || !profile?.id) return
      setLoading(true)
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*, quizzes(title, category, difficulty)")
        .eq("student_id", profile.id)
        .order("started_at", { ascending: false })
      setAttempts(data || [])
      setLoading(false)
    }
    load()
  }, [supabase, profile?.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-indigo-500 gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="font-bold uppercase tracking-widest text-xs">Loading Progress...</p>
      </div>
    )
  }

  // Stats
  const totalQuizzes = attempts.length
  const totalPoints = attempts.reduce((s, a) => s + (a.total_points || 0), 0)
  const avgAccuracy = attempts.length === 0 ? 0 :
    Math.round(attempts.reduce((s, a) => {
      const pct = a.max_points > 0 ? (a.total_points / a.max_points) * 100 : 0
      return s + pct
    }, 0) / attempts.length)

  const recentScores = attempts.slice(0, 10).reverse().map(a =>
    a.max_points > 0 ? Math.round((a.total_points / a.max_points) * 100) : 0
  )
  const maxScore = Math.max(...recentScores, 1)

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/games")} className="h-10 w-10 bg-white rounded-full shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-indigo-900">My Progress</h1>
          <p className="text-muted-foreground font-medium">
            {profile?.display_name}&apos;s quiz history
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <CardContent className="p-7">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-indigo-200" />
              <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">Quizzes Taken</p>
            </div>
            <p className="text-5xl font-black">{totalQuizzes}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-7">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-emerald-200" />
              <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs">Avg Accuracy</p>
            </div>
            <p className="text-5xl font-black">{avgAccuracy}%</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <CardContent className="p-7">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-5 w-5 text-amber-200" />
              <p className="text-amber-100 font-bold uppercase tracking-widest text-xs">Total Points Earned</p>
            </div>
            <p className="text-5xl font-black">{totalPoints.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Trend Sparkline */}
      {recentScores.length > 0 && (
        <Card className="rounded-[2rem] border-2 border-slate-100 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Score Trend (Last {recentScores.length} Quizzes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-28">
              {recentScores.map((score, i) => {
                const pct = maxScore > 0 ? (score / maxScore) : 0
                const color = score >= 80 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-red-400"
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-slate-500">{score}%</span>
                    <div
                      className={`w-full rounded-t-lg ${color} transition-all`}
                      style={{ height: `${Math.max(pct * 96, 8)}px` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-bold mt-2">
              <span>Oldest</span>
              <span>Most Recent</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attempt History Table */}
      <Card className="rounded-[2rem] border-2 border-slate-100 shadow-none">
        <CardHeader>
          <CardTitle>Quiz History</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-2xl mb-2">🎯</p>
              <p className="font-bold">No quiz attempts yet.</p>
              <p className="text-sm mt-1">Complete a quiz to see your progress here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => {
                const accuracy = attempt.max_points > 0
                  ? Math.round((attempt.total_points / attempt.max_points) * 100) : 0
                const diff = attempt.quizzes?.difficulty
                const diffColors: Record<string, string> = {
                  easy: "bg-emerald-100 text-emerald-800",
                  medium: "bg-amber-100 text-amber-800",
                  hard: "bg-red-100 text-red-800",
                }
                return (
                  <div key={attempt.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 truncate">{attempt.quizzes?.title || "Unknown Quiz"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {attempt.quizzes?.category && (
                          <Badge variant="secondary" className="text-xs">{attempt.quizzes.category}</Badge>
                        )}
                        {diff && (
                          <Badge className={`text-xs border-none ${diffColors[diff] || ""}`}>{diff}</Badge>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          {attempt.started_at ? new Date(attempt.started_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-800">{attempt.total_points || 0} pts</p>
                        <p className="text-xs font-bold text-slate-400">of {attempt.max_points || 0}</p>
                      </div>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg shadow-sm ${
                        accuracy >= 80 ? "bg-emerald-100 text-emerald-700" :
                        accuracy >= 50 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {accuracy}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
