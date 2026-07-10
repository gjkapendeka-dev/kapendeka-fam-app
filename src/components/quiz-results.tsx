import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Users,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QuizEditor } from "./quiz-editor"
import { QuizLeaderboard } from "./quiz-leaderboard"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface QuizStats {
  totalAttempts: number
  averageScore: number
  highestScore: number
  lowestScore: number
}

interface QuizResultsProps {
  quizId: string
  supabase: any
  profile: any
  familyId?: string
  isParent?: boolean
}

export function QuizResults({
  quizId,
  supabase,
  profile,
  familyId,
  isParent,
}: QuizResultsProps) {
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<QuizStats | null>(null)
  const [grading, setGrading] = useState(false)
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null)
  const [startingHost, setStartingHost] = useState(false)
  const [requirePin, setRequirePin] = useState(false)
  const [hostDialogOpen, setHostDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [quizId])

  const fetchData = async () => {
    try {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single()

      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("question_number")

      let attemptsQuery = supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .order("completed_at", { ascending: false })

      if (!isParent) {
        attemptsQuery = attemptsQuery.eq("student_id", profile?.id)
      }

      const { data: attemptsData } = await attemptsQuery

      let responsesQuery = supabase
        .from("quiz_responses")
        .select("*")
        .eq("quiz_id", quizId)

      if (!isParent) {
        responsesQuery = responsesQuery.eq("student_id", profile?.id)
      }

      const { data: responsesData } = await responsesQuery

      setQuiz(quizData)
      setQuestions(questionsData || [])
      setAttempts(attemptsData || [])
      setResponses(responsesData || [])

      if (attemptsData && attemptsData.length > 0) {
        const completed = attemptsData.filter((a: any) => a.is_completed)
        const scores = completed.map((a: any) => a.percentage_score || 0)
        setStats({
          totalAttempts: attemptsData.length,
          averageScore:
            scores.length > 0
              ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100) / 100
              : 0,
          highestScore: scores.length > 0 ? Math.max(...scores) : 0,
          lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const scoreQuestion = async (responseId: string, pointsEarned: number, attemptId: string, studentId: string) => {
    setGrading(true)
    try {
      await supabase
        .from("quiz_responses")
        .update({
          is_correct: pointsEarned > 0,
          points_earned: pointsEarned,
        })
        .eq("id", responseId)

      // Fetch all responses for this specific attempt (use attempt_id if available, fallback to student_id)
      let responsesQuery = supabase
        .from("quiz_responses")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("attempt_id", attemptId)

      const { data: byAttemptId } = await responsesQuery
      
      const allResponses = (byAttemptId && byAttemptId.length > 0)
        ? byAttemptId
        : (await supabase.from("quiz_responses").select("*").eq("quiz_id", quizId).eq("student_id", studentId)).data

      if (allResponses) {
        const updated = allResponses.map((r: any) =>
          r.id === responseId ? { ...r, points_earned: pointsEarned, is_correct: pointsEarned > 0 } : r
        )
        const totalPoints = updated.reduce((sum: number, r: any) => sum + (r.points_earned || 0), 0)
        const attempt = attempts.find((a: any) => a.id === attemptId)
        const maxPoints = attempt?.max_points || 1
        const percentage = (totalPoints / maxPoints) * 100

        await supabase
          .from("quiz_attempts")
          .update({
            total_points: totalPoints,
            percentage_score: Math.round(percentage * 100) / 100,
          })
          .eq("id", attemptId)
      }

      fetchData()
      toast({ title: "Graded", description: "Question graded successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as any).message, variant: "destructive" })
    } finally {
      setGrading(false)
    }
  }

  const getAttemptResponses = (attempt: any) => {
    // Use attempt_id if available (new data), fall back to student_id for legacy
    const byAttemptId = responses.filter((r) => r.attempt_id === attempt.id)
    if (byAttemptId.length > 0) return byAttemptId
    return responses.filter((r) => r.student_id === attempt.student_id)
  }

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600"
    if (pct >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (pct: number) => {
    if (pct >= 80) return "bg-emerald-50 border-emerald-300"
    if (pct >= 60) return "bg-yellow-50 border-yellow-300"
    return "bg-red-50 border-red-300"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-8 flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // ─── STUDENT VIEW ────────────────────────────────────────────────────────────
  if (!isParent) {
    const myAttempts = attempts.filter((a) => a.student_id === profile?.id)
    const completedAttempts = myAttempts.filter((a) => a.is_completed)
    const bestAttempt = completedAttempts.length > 0
      ? [...completedAttempts].sort((a, b) => (b.percentage_score || 0) - (a.percentage_score || 0))[0]
      : null

    return (
      <div className="space-y-4">
        {bestAttempt && (
          <Card className={`border-2 ${getScoreBg(bestAttempt.percentage_score || 0)}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-center">
                  <div className={`text-3xl font-black ${getScoreColor(bestAttempt.percentage_score || 0)}`}>
                    {bestAttempt.percentage_score || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Best Score</div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{quiz?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {bestAttempt.total_points}/{bestAttempt.max_points} points •{" "}
                    {completedAttempts.length} attempt{completedAttempts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Trophy className={`h-8 w-8 ${getScoreColor(bestAttempt.percentage_score || 0)}`} />
              </div>
            </CardContent>
          </Card>
        )}

        {quiz?.show_leaderboard && (
          <QuizLeaderboard
            quizId={quizId}
            supabase={supabase}
            currentStudentId={profile?.id}
            showLive={false}
          />
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              My Attempts ({myAttempts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myAttempts.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No attempts yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myAttempts.map((attempt, index) => {
                  const attemptResponses = getAttemptResponses(attempt)
                  const isExpanded = expandedAttemptId === attempt.id
                  return (
                    <div key={attempt.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setExpandedAttemptId(isExpanded ? null : attempt.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-muted-foreground w-6 text-center">
                            #{myAttempts.length - index}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {attempt.is_completed ? (
                                <span className={getScoreColor(attempt.percentage_score || 0)}>
                                  {attempt.percentage_score || 0}%
                                </span>
                              ) : (
                                <span className="text-slate-400">Not submitted</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attempt.is_completed
                                ? `${attempt.total_points}/${attempt.max_points} pts • ${new Date(attempt.completed_at).toLocaleDateString()}`
                                : `Started ${new Date(attempt.created_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {attempt.is_completed && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${(attempt.percentage_score || 0) >= 80 ? "border-emerald-500 text-emerald-700" : (attempt.percentage_score || 0) >= 60 ? "border-yellow-500 text-yellow-700" : "border-red-400 text-red-700"}`}
                            >
                              {(attempt.percentage_score || 0) >= 80 ? "Excellent" : (attempt.percentage_score || 0) >= 60 ? "Good" : "Needs Work"}
                            </Badge>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {isExpanded && attempt.is_completed && (
                        <div className="p-3 space-y-3 border-t bg-white">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                            Question Breakdown
                          </p>
                          {questions.map((question) => {
                            const response = attemptResponses.find(
                              (r) => r.question_id === question.id
                            )
                            return (
                              <div
                                key={question.id}
                                className={`rounded-lg border p-3 ${
                                  !response || response.is_correct === null
                                    ? "bg-amber-50 border-amber-200"
                                    : response.is_correct
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                              >
                                <div className="flex items-start gap-2 mb-1">
                                  {!response || response.is_correct === null ? (
                                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                  ) : response.is_correct ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold">
                                      Q{question.question_number}: {question.question_text}
                                    </p>
                                  </div>
                                  <span className="text-xs font-bold shrink-0">
                                    {response?.points_earned !== null && response?.points_earned !== undefined
                                      ? `${response.points_earned}/${question.points}`
                                      : `?/${question.points}`}{" "}pts
                                  </span>
                                </div>
                                {response ? (
                                  <div className="ml-6 space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      <span className="font-medium">Your answer:</span>{" "}
                                      <span className="italic">{response.answer_text || "—"}</span>
                                    </p>
                                    {(question.question_type === "multiple_choice" || question.question_type === "true_false") && !response.is_correct && (
                                      <p className="text-xs text-emerald-700">
                                        <span className="font-medium">Correct answer:</span>{" "}
                                        {question.correct_answer}
                                      </p>
                                    )}
                                    {response.is_correct === null && (
                                      <p className="text-xs text-amber-700">Awaiting parent grading</p>
                                    )}
                                    {question.explanation && quiz?.show_explanation && (
                                      <p className="text-xs text-blue-700 bg-blue-50 rounded p-1.5 mt-1">
                                        💡 {question.explanation}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="ml-6 text-xs text-muted-foreground italic">Not answered</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
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

  // ─── HOST GAME ───────────────────────────────────────────────────────────────
  const handleHostGame = async () => {
    if (!profile || !familyId) return
    setStartingHost(true)
    try {
      const pin = requirePin ? Math.floor(100000 + Math.random() * 900000).toString() : null
      const { data, error } = await supabase
        .from("quiz_sessions")
        .insert({
          quiz_id: quizId,
          host_id: profile.id,
          family_id: familyId,
          status: "waiting",
          require_pin: requirePin,
          join_pin: pin
        })
        .select("id")
        .single()
      
      if (error) throw error
      
      setHostDialogOpen(false)
      router.push(`/games/host/${data.id}`)
    } catch (e: any) {
      toast({ title: "Failed to host game", description: e.message, variant: "destructive" })
      setStartingHost(false)
    }
  }

  // ─── PARENT VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quiz Results: {quiz?.title}
            </CardTitle>
            {familyId && (
              <div className="flex items-center gap-2">
                <Dialog open={hostDialogOpen} onOpenChange={setHostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Host Live Game
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Host Live Game</DialogTitle>
                      <DialogDescription>
                        Host this quiz live! Players can join and you control the pace.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border my-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Require Join PIN</Label>
                        <p className="text-xs text-muted-foreground">If disabled, players can join instantly from their dashboard.</p>
                      </div>
                      <Switch checked={requirePin} onCheckedChange={setRequirePin} />
                    </div>
                    <Button onClick={handleHostGame} disabled={startingHost} className="w-full h-12 text-lg font-bold">
                      {startingHost ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Start Lobby"}
                    </Button>
                  </DialogContent>
                </Dialog>
                <QuizEditor
                  quizId={quizId}
                  quizTitle={quiz?.title}
                  supabase={supabase}
                  profile={profile}
                  familyId={familyId}
                  onUpdated={() => fetchData()}
                />
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
            {quiz?.category && <Badge variant="outline">{quiz.category}</Badge>}
            {quiz?.difficulty && <Badge variant="outline" className="capitalize">{quiz.difficulty}</Badge>}
            {quiz?.max_attempts && (
              <Badge variant="outline">Max {quiz.max_attempts} attempt{quiz.max_attempts !== 1 ? "s" : ""}</Badge>
            )}
            {quiz?.assigned_to?.length > 0 && (
              <Badge variant="outline">{quiz.assigned_to.length} assigned</Badge>
            )}
          </div>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalAttempts}</div>
                <div className="text-xs text-muted-foreground">Total Attempts</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.averageScore}%</div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.highestScore}%</div>
                <div className="text-xs text-muted-foreground">Highest</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.lowestScore}%</div>
                <div className="text-xs text-muted-foreground">Lowest</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {quiz?.show_leaderboard && (
        <QuizLeaderboard
          quizId={quizId}
          supabase={supabase}
          currentStudentId={profile?.id}
          showLive={true}
        />
      )}

      {/* Aggregate results for Poll, Word Cloud, Open-Ended, Brainstorm */}
      {(() => {
        const aggregateQs = questions.filter(q =>
          ["poll", "word_cloud", "open_ended", "brainstorm"].includes(q.question_type)
        )
        if (aggregateQs.length === 0) return null
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📊 Aggregate Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {aggregateQs.map(q => {
                const qResponses = responses.filter(r => r.question_id === q.id && r.answer_text)
                return (
                  <div key={q.id}>
                    <p className="text-xs font-bold mb-2">
                      {q.question_type === "poll" ? "📢" : q.question_type === "word_cloud" ? "☁️" : q.question_type === "brainstorm" ? "🧠" : "💬"}{" "}
                      Q{q.question_number}: {q.question_text}
                    </p>

                    {/* POLL — bar chart */}
                    {q.question_type === "poll" && (
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt: string, i: number) => {
                          const count = qResponses.filter(r => r.answer_text === opt).length
                          const total = Math.max(qResponses.length, 1)
                          const pct = Math.round((count / total) * 100)
                          const barColors = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-yellow-500"]
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span className="font-medium">{opt}</span>
                                <span className="text-muted-foreground">{count} vote{count !== 1 ? "s" : ""} ({pct}%)</span>
                              </div>
                              <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${barColors[i % barColors.length]} rounded-full transition-all`}
                                  style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                        {qResponses.length === 0 && <p className="text-xs text-muted-foreground italic">No responses yet</p>}
                      </div>
                    )}

                    {/* WORD CLOUD — CSS tag cloud */}
                    {q.question_type === "word_cloud" && (
                      <div>
                        {qResponses.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No responses yet</p>
                        ) : (() => {
                          const wordCounts: Record<string, number> = {}
                          qResponses.forEach(r => {
                            const w = r.answer_text?.trim().toLowerCase()
                            if (w) wordCounts[w] = (wordCounts[w] || 0) + 1
                          })
                          const maxCount = Math.max(...Object.values(wordCounts))
                          const cloudWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1])
                          const tagColors = ["text-blue-600", "text-emerald-600", "text-purple-600", "text-orange-600", "text-rose-600", "text-cyan-600"]
                          return (
                            <div className="flex flex-wrap gap-2 items-end bg-sky-50 rounded-xl p-4">
                              {cloudWords.map(([word, count], i) => {
                                const scale = 0.75 + (count / maxCount) * 1.25
                                return (
                                  <span key={word}
                                    style={{ fontSize: `${scale}rem`, fontWeight: count > 1 ? 700 : 400 }}
                                    className={`${tagColors[i % tagColors.length]} transition-all`}>
                                    {word}
                                    {count > 1 && <sup className="text-[10px] ml-0.5">{count}</sup>}
                                  </span>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* OPEN-ENDED / BRAINSTORM — list all responses */}
                    {["open_ended", "brainstorm"].includes(q.question_type) && (
                      <div className="space-y-1.5">
                        {qResponses.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No responses yet</p>
                        ) : qResponses.map((r, i) => (
                          <div key={i} className="bg-white border rounded-lg p-2.5">
                            <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{r.student_name}</p>
                            <p className="text-sm whitespace-pre-wrap">{r.answer_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })()}


      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Attempts ({attempts.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Click any row to expand the full question-by-question review. Grade open-ended answers inline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No quiz attempts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map((attempt, index) => {
                const attemptResponses = getAttemptResponses(attempt)
                const isExpanded = expandedAttemptId === attempt.id
                const pendingGrading = attemptResponses.filter((r) => r.is_correct === null).length
                const correct = attemptResponses.filter((r) => r.is_correct === true).length

                return (
                  <div key={attempt.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => setExpandedAttemptId(isExpanded ? null : attempt.id)}
                    >
                      <div className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{attempt.student_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.is_completed
                            ? `Submitted ${new Date(attempt.completed_at).toLocaleString()}`
                            : `Started ${new Date(attempt.created_at).toLocaleDateString()} — not submitted`}
                        </p>
                        {attempt.is_completed && (
                          <p className="text-xs text-muted-foreground">
                            {correct}/{questions.length} correct
                            {pendingGrading > 0 && (
                              <span className="text-amber-600 font-medium"> • {pendingGrading} pending grading</span>
                            )}
                          </p>
                        )}
                      </div>

                      {attempt.is_completed ? (
                        <div className="text-right shrink-0">
                          <div className={`text-lg font-black ${getScoreColor(attempt.percentage_score || 0)}`}>
                            {attempt.percentage_score || 0}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {attempt.total_points}/{attempt.max_points} pts
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs shrink-0">Not submitted</Badge>
                      )}

                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      }
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t bg-white space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                            Full Question Breakdown — {attempt.student_name}
                          </p>
                          {pendingGrading > 0 && (
                            <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                              {pendingGrading} to grade
                            </Badge>
                          )}
                        </div>

                        {questions.map((question) => {
                          const response = attemptResponses.find(
                            (r) => r.question_id === question.id
                          )
                          const isManual = ["short_answer", "essay", "open_ended", "brainstorm"].includes(question.question_type)
                          const isAggregate = ["poll", "word_cloud"].includes(question.question_type)
                          const isSlide = question.question_type === "slide"
                          if (isSlide) return null // Slides have no answers to show

                          return (
                            <div
                              key={question.id}
                              className={`rounded-lg border p-3 ${
                                isAggregate
                                  ? "bg-blue-50 border-blue-200"
                                  : !response
                                  ? "bg-slate-50 border-slate-200"
                                  : response.is_correct === null
                                  ? "bg-amber-50 border-amber-200"
                                  : response.is_correct
                                  ? "bg-emerald-50 border-emerald-200"
                                  : "bg-red-50 border-red-200"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!response ? (
                                  <AlertCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                ) : response.is_correct === null ? (
                                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                ) : response.is_correct ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold">
                                      Q{question.question_number}: {question.question_text}
                                    </p>
                                    <span className="text-xs font-bold shrink-0">
                                      {response?.points_earned !== null && response?.points_earned !== undefined
                                        ? `${response.points_earned}/${question.points}`
                                        : `—/${question.points}`}{" "}pts
                                    </span>
                                  </div>

                                  {response ? (
                                    <div className="mt-2 space-y-1.5">
                                      <div className="text-xs bg-white rounded p-2 border">
                                        <span className="font-medium text-muted-foreground">Answer: </span>
                                        <span>{response.answer_text || "—"}</span>
                                      </div>

                                      {isAggregate && (
                                        <p className="text-xs text-blue-700 italic">This is a {question.question_type === "poll" ? "Poll" : "Word Cloud"} question — all responses are shown in Aggregate Results above.</p>
                                      )}

                                      {!isManual && !isAggregate && !response.is_correct && (
                                        <div className="text-xs text-emerald-700 bg-emerald-50 rounded p-1.5">
                                          <span className="font-medium">Correct answer: </span>
                                          {question.correct_answer}
                                        </div>
                                      )}

                                      {isManual && !isAggregate && response.is_correct === null && (
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            size="sm"
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-7"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              scoreQuestion(response.id, question.points, attempt.id, attempt.student_id)
                                            }}
                                            disabled={grading}
                                          >
                                            {grading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                            ✓ Full Marks ({question.points} pts)
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-xs h-7 border-red-300 text-red-600 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              scoreQuestion(response.id, 0, attempt.id, attempt.student_id)
                                            }}
                                            disabled={grading}
                                          >
                                            ✗ Incorrect
                                          </Button>
                                        </div>
                                      )}

                                      {isManual && !isAggregate && response.is_correct !== null && (
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              scoreQuestion(response.id, question.points, attempt.id, attempt.student_id)
                                            }}
                                            disabled={grading}
                                          >
                                            Re-grade: Correct
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              scoreQuestion(response.id, 0, attempt.id, attempt.student_id)
                                            }}
                                            disabled={grading}
                                          >
                                            Re-grade: Incorrect
                                          </Button>
                                        </div>
                                      )}

                                      {question.explanation && (
                                        <p className="text-xs text-blue-700 bg-blue-50 rounded p-1.5">
                                          💡 {question.explanation}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic mt-1">Not answered</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
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