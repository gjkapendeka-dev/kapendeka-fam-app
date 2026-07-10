"use client"
import React, { useState, useEffect, useRef } from "react"
import { QuizLeaderboard } from "./quiz-leaderboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle, CheckCircle2, XCircle, Loader2,
  ChevronRight, ChevronLeft, Clock, GripVertical,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string
  question_number: number
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string
  points: number
  question_image_url?: string
  difficulty?: string
  time_limit?: number
  // Extended
  items?: string[]
  min_value?: number
  max_value?: number
  correct_value?: number
  pin_image_url?: string
  pin_region?: { x: number; y: number; radius: number }
  pin_region?: { x: number; y: number; radius: number }
  slide_content?: string
  allow_multiple_selection?: boolean
}

interface StudentResponse { questionId: string; answer: string; timeSpent?: number }

interface QuizDisplayProps {
  quizId: string
  supabase: any
  profile: any
  onComplete?: (score: number, maxScore: number) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POLL_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-yellow-500"]

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuizDisplay({ quizId, supabase, profile, onComplete }: QuizDisplayProps) {
  const { toast } = useToast()

  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [responses, setResponses] = useState<StudentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quizAttempt, setQuizAttempt] = useState<any>(null)
  const [accessError, setAccessError] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)

  // Per-question interaction state
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [textAnswer, setTextAnswer] = useState("")
  const [puzzleOrder, setPuzzleOrder] = useState<string[]>([])
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [sliderValue, setSliderValue] = useState(50)
  const [pinLocation, setPinLocation] = useState<{ x: number; y: number } | null>(null)
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([])

  // ── Load quiz ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchData()
  }, [quizId])

  const fetchData = async () => {
    try {
      const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", quizId).single()
      const { data: qData } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("question_number")

      if (quizData?.assigned_to?.length > 0 && !quizData.assigned_to.includes(profile?.id)) {
        setAccessError("You are not assigned to this quiz.")
        setLoading(false); return
      }

      if (quizData?.max_attempts) {
        const { count } = await supabase.from("quiz_attempts").select("*", { count: "exact", head: true })
          .eq("quiz_id", quizId).eq("student_id", profile?.id).eq("is_completed", true)
        if ((count || 0) >= quizData.max_attempts) {
          setAccessError(`You have used all ${quizData.max_attempts} attempt(s).`)
          setLoading(false); return
        }
      }

      setQuiz(quizData)
      setQuestions(qData || [])

      const totalPoints = (qData || []).reduce((s: number, q: any) => s + (q.points || 0), 0)
      const { data: attempt } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId, student_id: profile?.id, student_name: profile?.display_name,
        max_points: totalPoints, is_completed: false,
      }).select().single()
      setQuizAttempt(attempt)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const q = questions[currentIdx]
    if (!q || showResults) return
    const limit = q.time_limit || quiz?.question_timer || 30
    if (q.question_type === "slide") return
    setTimeRemaining(limit)
    setQuestionStartTime(Date.now())
    const iv = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) { clearInterval(iv); handleAutoAdvance(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [currentIdx, questions, showResults])

  // ── Reset per-question state ───────────────────────────────────────────────

  useEffect(() => {
    const q = questions[currentIdx]
    if (!q) return
    setSelectedOption("")
    setSelectedMultiple([])
    setTextAnswer("")
    setPinLocation(null)
    setDragOverIdx(null)
    setDragIdx(null)
    if (q.question_type === "puzzle") {
      const src = q.items?.length ? q.items : q.correct_answer?.split("|||") || []
      setPuzzleOrder(shuffleArray(src.filter(Boolean)))
    } else if (q.question_type === "slider") {
      const mid = Math.round(((q.min_value ?? 0) + (q.max_value ?? 100)) / 2)
      setSliderValue(mid)
    }
  }, [currentIdx, questions])

  // ── Grading ────────────────────────────────────────────────────────────────

  const gradeQuestion = (q: QuizQuestion, answer: string): { correct: boolean | null; points: number } => {
    const noGrade = ["poll", "word_cloud", "open_ended", "brainstorm", "slide"]
    if (noGrade.includes(q.question_type)) return { correct: null, points: 0 }

    let correct = false
    switch (q.question_type) {
      case "multiple_choice":
        if (q.allow_multiple_selection) {
          const correctArr = (q.correct_answer || "").split(",").sort();
          const ansArr = answer.split(",").sort();
          correct = correctArr.length === ansArr.length && correctArr.every((v, i) => v === ansArr[i]);
        } else {
          const isIndex = !isNaN(parseInt(q.correct_answer)) && String(parseInt(q.correct_answer)) === q.correct_answer;
          const actualCorrectText = isIndex ? (q.options[parseInt(q.correct_answer)] || "") : q.correct_answer;
          correct = answer.trim().toLowerCase() === actualCorrectText.trim().toLowerCase();
        }
        break
      case "true_false":
        correct = answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase(); break
      case "short_answer":
        correct = q.correct_answer ? answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase() : false; break
      case "puzzle": {
        const correctOrder = q.correct_answer || (q.items || []).join("|||")
        correct = answer === correctOrder; break
      }
      case "slider": {
        const cv = q.correct_value ?? parseFloat(q.correct_answer || "0")
        correct = Math.abs(parseFloat(answer) - cv) <= 1; break
      }
      case "drop_pin": {
        if (q.pin_region) {
          try {
            const { x: px, y: py } = JSON.parse(answer)
            const dist = Math.sqrt(Math.pow(px - q.pin_region.x, 2) + Math.pow(py - q.pin_region.y, 2))
            correct = dist <= q.pin_region.radius
          } catch { correct = false }
        }
        break
      }
    }
    return { correct, points: correct ? q.points : 0 }
  }

  // ── Collect current answer string ──────────────────────────────────────────

  const getCurrentAnswer = (q: QuizQuestion): string => {
    switch (q.question_type) {
      case "puzzle": return puzzleOrder.join("|||")
      case "slider": return String(sliderValue)
      case "drop_pin": return pinLocation ? JSON.stringify(pinLocation) : ""
      case "short_answer":
      case "open_ended":
      case "word_cloud": return textAnswer
      case "multiple_choice": return q.allow_multiple_selection ? selectedMultiple.join(",") : selectedOption
      default: return selectedOption
    }
  }

  // ── Record response & advance ──────────────────────────────────────────────

  const handleAnswer = async (answer?: string) => {
    const q = questions[currentIdx]
    if (!q) return
    const ans = answer ?? getCurrentAnswer(q)
    const timeSpent = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : 0
    setTotalTimeSpent(t => t + timeSpent)

    const newResp: StudentResponse = { questionId: q.id, answer: ans, timeSpent }
    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== q.id)
      return [...filtered, newResp]
    })

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      await submitQuiz([...responses.filter(r => r.questionId !== q.id), newResp])
    }
  }

  const handleAutoAdvance = () => {
    const q = questions[currentIdx]
    if (!q) return
    handleAnswer(getCurrentAnswer(q) || "")
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submitQuiz = async (finalResponses: StudentResponse[]) => {
    if (!quizAttempt || submitting) return
    setSubmitting(true)
    try {
      let totalPoints = 0
      for (const q of questions) {
        const resp = finalResponses.find(r => r.questionId === q.id)
        const answer = resp?.answer || ""
        const { correct, points } = gradeQuestion(q, answer)
        totalPoints += points
        await supabase.from("quiz_responses").insert({
          quiz_id: quizId, question_id: q.id, student_id: profile?.id,
          student_name: profile?.display_name, attempt_id: quizAttempt.id,
          answer_text: answer, is_correct: correct, points_earned: points,
        })
      }

      const pct = (totalPoints / Math.max(quizAttempt.max_points, 1)) * 100
      await supabase.from("quiz_attempts").update({
        is_completed: true, completed_at: new Date().toISOString(),
        total_points: totalPoints,
        percentage_score: Math.round(pct * 100) / 100,
        time_taken_seconds: totalTimeSpent,
      }).eq("id", quizAttempt.id)

      setFinalScore(totalPoints)
      setShowResults(true)
    } catch (e: any) {
      toast({ title: "Submit error", description: e.message, variant: "destructive" })
    } finally { setSubmitting(false) }
  }

  // ── Drag-and-drop for Puzzle ───────────────────────────────────────────────

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (dragIdx === null) return
    const newOrder = [...puzzleOrder]
    const [moved] = newOrder.splice(dragIdx, 1)
    newOrder.splice(targetIdx, 0, moved)
    setPuzzleOrder(newOrder)
    setDragIdx(null); setDragOverIdx(null)
  }

  // ── Loading / Error / Results ─────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (accessError) return (
    <Card>
      <CardContent className="p-6 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <p className="font-semibold">{accessError}</p>
      </CardContent>
    </Card>
  )

  if (showResults) {
    const pct = Math.round((finalScore / Math.max(quizAttempt?.max_points || 1, 1)) * 100)
    const ring = pct >= 80 ? "border-emerald-500 text-emerald-600" : pct >= 60 ? "border-yellow-500 text-yellow-600" : "border-red-400 text-red-600"
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Complete! 🎉</CardTitle>
          <CardDescription>You scored {finalScore} out of {quizAttempt?.max_points}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className={`h-32 w-32 rounded-full border-4 flex flex-col items-center justify-center ${ring}`}>
              <span className="text-3xl font-black">{pct}%</span>
            </div>
          </div>

          {quiz?.show_leaderboard && (
            <QuizLeaderboard quizId={quizId} supabase={supabase} currentStudentId={profile?.id} showLive={false} />
          )}

          {/* Answer review */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Your Answers</p>
            <div className="space-y-2">
              {questions.filter(q => !["slide", "poll", "word_cloud", "brainstorm", "open_ended"].includes(q.question_type))
                .map((q, idx) => {
                  const resp = responses.find(r => r.questionId === q.id)
                  const { correct } = gradeQuestion(q, resp?.answer || "")
                  return (
                    <div key={q.id}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${correct === null ? "bg-amber-50 border-amber-200" : correct ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                      {correct === null ? <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        : correct ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">Q{idx + 1}: {q.question_text}</p>
                        {resp && <p className="text-xs text-muted-foreground mt-0.5">Your answer: <em>{resp.answer}</em></p>}
                        {correct === false && q.correct_answer && (
                          <p className="text-xs text-emerald-700 mt-0.5">Correct: {q.correct_answer}</p>
                        )}
                        {correct === null && <p className="text-xs text-amber-700 mt-0.5">Pending review</p>}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="pt-2 border-t flex justify-center">
            <Button onClick={() => onComplete?.(finalScore, quizAttempt?.max_points || 0)} className="px-8">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const q = questions[currentIdx]
  if (!q) return null

  const progress = ((currentIdx) / questions.length) * 100
  const timeLimit = q.time_limit || quiz?.question_timer || 30
  const timePct = timeLimit > 0 ? (timeRemaining / timeLimit) * 100 : 100
  const timerColor = timePct > 50 ? "bg-emerald-500" : timePct > 25 ? "bg-yellow-500" : "bg-red-500"
  const canSubmit = (() => {
    switch (q.question_type) {
      case "slide": return true
      case "puzzle": return puzzleOrder.length > 0
      case "drop_pin": return pinLocation !== null
      case "short_answer": case "open_ended": case "brainstorm": case "word_cloud": return textAnswer.trim().length > 0
      case "multiple_choice": return q.allow_multiple_selection ? selectedMultiple.length > 0 : selectedOption !== ""
      default: return selectedOption !== ""
    }
  })()

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <Badge variant="secondary" className="text-[10px]">{q.points} pts</Badge>
        </div>
        <Progress value={progress} className="h-1.5" />

        {/* Timer */}
        {q.question_type !== "slide" && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                style={{ width: `${timePct}%` }} />
            </div>
            <span className={`text-xs font-bold tabular-nums ${timeRemaining <= 5 ? "text-red-500" : "text-muted-foreground"}`}>
              {timeRemaining}s
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question media */}
        {q.youtube_video_id ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden border">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${q.youtube_video_id}?autoplay=1&controls=0`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        ) : q.question_image_url ? (
          <img src={q.question_image_url} alt="" className="w-full max-h-40 object-cover rounded-xl border" />
        ) : null}

        {/* Question text */}
        {q.question_type !== "slide" && (
          <h2 className="text-base font-bold leading-snug">{q.question_text}</h2>
        )}

        {/* ── Type-specific input ── */}

        {/* SLIDE */}
        {q.question_type === "slide" && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 rounded-2xl p-6 min-h-[120px] flex flex-col items-center justify-center text-center gap-3">
            <span className="text-3xl">📋</span>
            <p className="font-semibold text-base whitespace-pre-wrap">{q.slide_content || q.question_text}</p>
          </div>
        )}

        {/* MULTIPLE CHOICE */}
        {q.question_type === "multiple_choice" && (
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, i) => {
              const colors = ["border-blue-400 bg-blue-50", "border-orange-400 bg-orange-50", "border-emerald-400 bg-emerald-50", "border-purple-400 bg-purple-50", "border-rose-400 bg-rose-50", "border-yellow-400 bg-yellow-50"]
              
              if (q.allow_multiple_selection) {
                const selected = selectedMultiple.includes(i.toString())
                return (
                  <button key={i} onClick={() => {
                    const newArr = selected ? selectedMultiple.filter(x => x !== i.toString()) : [...selectedMultiple, i.toString()];
                    setSelectedMultiple(newArr);
                  }}
                    className={`w-full p-3 rounded-xl border-2 text-left font-semibold text-sm flex items-center transition-all ${selected ? colors[i % colors.length] + " scale-[0.98]" : "border-border hover:border-primary/40 hover:bg-slate-50"}`}>
                    <div className="mr-3 mt-0.5">
                      <div className={`w-5 h-5 rounded border ${selected ? 'bg-emerald-500 border-emerald-500 flex items-center justify-center' : 'border-slate-300 bg-white'}`}>
                        {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="font-black text-muted-foreground mr-2">{["A", "B", "C", "D", "E", "F"][i]}.</span>
                    {opt}
                  </button>
                )
              } else {
                const selected = selectedOption === opt
                return (
                  <button key={i} onClick={() => { setSelectedOption(opt); handleAnswer(opt) }}
                    className={`w-full p-3 rounded-xl border-2 text-left font-semibold text-sm transition-all ${selected ? colors[i % colors.length] + " scale-[0.98]" : "border-border hover:border-primary/40 hover:bg-slate-50"}`}>
                    <span className="font-black text-muted-foreground mr-2">{["A", "B", "C", "D", "E", "F"][i]}.</span>
                    {opt}
                  </button>
                )
              }
            })}
          </div>
        )}

        {/* TRUE / FALSE */}
        {q.question_type === "true_false" && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setSelectedOption("true"); handleAnswer("true") }}
              className={`p-6 rounded-2xl border-4 font-black text-xl transition-all ${selectedOption === "true" ? "bg-emerald-500 text-white border-emerald-500" : "border-emerald-300 hover:bg-emerald-50"}`}>
              ✅ True
            </button>
            <button onClick={() => { setSelectedOption("false"); handleAnswer("false") }}
              className={`p-6 rounded-2xl border-4 font-black text-xl transition-all ${selectedOption === "false" ? "bg-red-500 text-white border-red-500" : "border-red-300 hover:bg-red-50"}`}>
              ❌ False
            </button>
          </div>
        )}

        {/* TYPE ANSWER */}
        {q.question_type === "short_answer" && (
          <div className="space-y-2">
            <Input placeholder="Type your answer here..." value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              onKeyDown={e => e.key === "Enter" && textAnswer.trim() && handleAnswer(textAnswer.trim())}
              className="h-12 text-base" autoFocus />
          </div>
        )}

        {/* PUZZLE */}
        {q.question_type === "puzzle" && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Drag to reorder — put them in the correct sequence</p>
            <div className="space-y-2">
              {puzzleOrder.map((item, idx) => (
                <div key={`${item}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 bg-white cursor-grab active:cursor-grabbing transition-all ${dragOverIdx === idx ? "border-primary bg-primary/5 scale-[0.98]" : "border-border hover:border-primary/40"}`}>
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                  <span className="font-medium text-sm flex-1">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDER */}
        {q.question_type === "slider" && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <span className="text-4xl font-black text-primary">{sliderValue}</span>
            </div>
            <input type="range"
              min={q.min_value ?? 0} max={q.max_value ?? 100} step={1}
              value={sliderValue} onChange={e => setSliderValue(parseInt(e.target.value))}
              className="w-full h-3 rounded-full accent-primary cursor-pointer" />
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>{q.min_value ?? 0}</span>
              <span>{q.max_value ?? 100}</span>
            </div>
          </div>
        )}

        {/* POLL */}
        {q.question_type === "poll" && (
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => { setSelectedOption(opt); handleAnswer(opt) }}
                className={`w-full p-3 rounded-xl border-2 font-semibold text-sm text-left transition-all ${selectedOption === opt ? `${POLL_COLORS[i % POLL_COLORS.length]} text-white border-transparent` : "border-border hover:bg-slate-50"}`}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* WORD CLOUD */}
        {q.question_type === "word_cloud" && (
          <div className="space-y-3">
            <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-4 text-center">
              <p className="text-3xl mb-2">☁️</p>
              <p className="text-xs text-muted-foreground">Type one word or short phrase that comes to mind</p>
            </div>
            <Input placeholder="Your word..." value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              className="h-12 text-base text-center font-bold" autoFocus
              onKeyDown={e => e.key === "Enter" && textAnswer.trim() && handleAnswer(textAnswer.trim())} />
          </div>
        )}

        {/* OPEN-ENDED */}
        {q.question_type === "open_ended" && (
          <Textarea placeholder="Write your response here..." value={textAnswer}
            onChange={e => setTextAnswer(e.target.value)}
            className="min-h-[100px] resize-none text-sm" autoFocus />
        )}

        {/* BRAINSTORM */}
        {q.question_type === "brainstorm" && (
          <div className="space-y-2">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
              <p className="text-xs text-violet-800 font-medium">🧠 List as many ideas as you can! Separate with commas or new lines.</p>
            </div>
            <Textarea placeholder="Idea 1, Idea 2, Idea 3..." value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              className="min-h-[100px] resize-none text-sm" autoFocus />
          </div>
        )}

        {/* DROP PIN */}
        {q.question_type === "drop_pin" && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Click on the image to drop your pin 📍</p>
            {q.pin_image_url ? (
              <div className="relative cursor-crosshair rounded-xl overflow-hidden border-2 border-border select-none"
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                  setPinLocation({ x, y })
                }}>
                <img src={q.pin_image_url} alt="Drop pin" className="w-full object-cover pointer-events-none" />
                {pinLocation && (
                  <div className="absolute pointer-events-none" style={{ left: `${pinLocation.x}%`, top: `${pinLocation.y}%`, transform: "translate(-50%, -100%)" }}>
                    <span className="text-3xl drop-shadow-lg">📍</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl h-40 flex items-center justify-center text-muted-foreground text-sm">
                No image uploaded for this question
              </div>
            )}
            {pinLocation && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Pin placed at ({pinLocation.x}%, {pinLocation.y}%) — click to move
              </p>
            )}
          </div>
        )}

        {/* ── Submit / Next button ── */}
        <div className="flex gap-2 pt-2">
          {currentIdx > 0 && q.question_type === "slide" && (
            <Button variant="outline" onClick={() => setCurrentIdx(i => i - 1)} className="flex-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {(!["multiple_choice", "true_false", "poll"].includes(q.question_type) || (q.question_type === "multiple_choice" && q.allow_multiple_selection)) && (
            <Button onClick={() => handleAnswer()} disabled={!canSubmit || submitting}
              className="flex-1 h-11 font-bold">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> :
                currentIdx === questions.length - 1 ? "Submit Quiz 🚀" :
                q.question_type === "slide" ? "Next →" : "Confirm Answer"}
              {!submitting && !["slide"].includes(q.question_type) && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
