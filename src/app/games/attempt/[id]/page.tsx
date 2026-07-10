"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser, useSupabase } from "@/supabase"
import { QuizDisplay } from "@/components/quiz-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, BookOpen, Clock, Zap, Trophy, CheckCircle2 } from "lucide-react"

export default function AttemptQuizPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useUser()
  const supabase = useSupabase()
  const quizId = params.id as string

  const [quiz, setQuiz] = React.useState<any>(null)
  const [questions, setQuestions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [started, setStarted] = React.useState(false)
  const [completed, setCompleted] = React.useState(false)
  const [finalScore, setFinalScore] = React.useState(0)
  const [maxScore, setMaxScore] = React.useState(0)
  const [enteredPin, setEnteredPin] = React.useState("")
  const [pinError, setPinError] = React.useState(false)

  React.useEffect(() => {
    if (!supabase || !quizId) return
    const fetchQuiz = async () => {
      const [{ data: quizData }, { data: qData }] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", quizId).single(),
        supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("question_number"),
      ])
      setQuiz(quizData)
      setQuestions(qData || [])
      setLoading(false)
    }
    fetchQuiz()
  }, [supabase, quizId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground font-medium">Quiz not found.</p>
        <Button onClick={() => router.push("/games")}>Back to Games</Button>
      </div>
    )
  }

  const totalPoints = questions.reduce((s: number, q: any) => s + (q.points || 1), 0)
  const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0

  const getEmoji = (pct: number) => {
    if (pct >= 90) return "🏆"
    if (pct >= 70) return "🎉"
    if (pct >= 50) return "👍"
    return "💪"
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl shadow-indigo-500/10 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 text-center">
            <div className="text-6xl mb-4">{getEmoji(percentage)}</div>
            <CardTitle className="text-3xl font-black">Quiz Complete!</CardTitle>
            <CardDescription className="text-indigo-100 mt-1 font-medium">{quiz.title}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <p className="text-6xl font-black text-indigo-600">{percentage}%</p>
              <p className="text-muted-foreground font-medium mt-1">{finalScore} / {maxScore} points</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold border-2"
                onClick={() => { setStarted(false); setCompleted(false); setFinalScore(0); setMaxScore(0) }}
              >
                Try Again
              </Button>
              <Button
                className="flex-1 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700"
                onClick={() => router.push("/games")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 flex items-start justify-center pt-8">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" onClick={() => setStarted(false)} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-black text-lg">{quiz.title}</h2>
              <p className="text-xs text-muted-foreground font-medium">Solo Attempt • Assignment Mode</p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-indigo-100 text-indigo-700 font-black uppercase tracking-wider text-[10px]">
              <BookOpen className="h-3 w-3 mr-1" /> Solo
            </Badge>
          </div>
          <QuizDisplay
            quizId={quizId}
            supabase={supabase}
            profile={profile}
            onComplete={(score, max) => {
              setFinalScore(score)
              setMaxScore(max)
              setCompleted(true)
            }}
          />
        </div>
      </div>
    )
  }

  // Pre-flight screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 flex items-center justify-center">
      <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl shadow-indigo-500/10 overflow-hidden">
        <CardHeader className="bg-indigo-500/10 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/games")} className="rounded-xl -ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Badge className="bg-indigo-100 text-indigo-700 border-none font-black uppercase tracking-wider text-[10px]">
              <BookOpen className="h-3 w-3 mr-1" /> Solo Attempt
            </Badge>
          </div>
          <CardTitle className="text-3xl font-black leading-tight text-indigo-900">{quiz.title}</CardTitle>
          {quiz.description && (
            <CardDescription className="mt-2 font-medium text-base">{quiz.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-indigo-50 rounded-2xl p-4 text-center">
              <Zap className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-xl font-black text-indigo-700">{questions.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Questions</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-4 text-center">
              <Trophy className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xl font-black text-purple-700">{totalPoints}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Points</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 text-center">
              <Clock className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-black text-emerald-700">{quiz.question_timer || 30}s</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Per Q</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-amber-800 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              This is a solo attempt — you answer at your own pace. Your score will be recorded when you finish.
            </p>
          </div>

          {quiz.solo_pin && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Quiz PIN Required</label>
              <input
                type="text"
                placeholder="Enter PIN"
                className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 font-bold text-center tracking-[0.2em] text-lg"
                value={enteredPin}
                onChange={e => {
                  setEnteredPin(e.target.value)
                  setPinError(false)
                }}
              />
              {pinError && <p className="text-red-500 text-xs font-bold mt-2 text-center">Incorrect PIN</p>}
            </div>
          )}

          <Button
            className="w-full h-14 rounded-2xl font-black text-base uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/25"
            onClick={() => {
              if (quiz.solo_pin && enteredPin.trim() !== quiz.solo_pin) {
                setPinError(true)
                return
              }
              setStarted(true)
            }}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Start Attempt
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
