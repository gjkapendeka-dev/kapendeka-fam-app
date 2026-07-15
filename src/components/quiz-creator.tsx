import React, { useState, useEffect, useRef } from "react"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Plus, Trash2, Loader2, AlertCircle, Image as ImageIcon,
  X, ChevronUp, ChevronDown, GripVertical, Pencil,
} from "lucide-react"

// ─── Question Types ────────────────────────────────────────────────────────────

export const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice", icon: "🎯", desc: "Choose the one correct answer", color: "bg-blue-50 border-blue-200 hover:border-blue-500", badge: "bg-blue-100 text-blue-800" },
  { value: "true_false",      label: "True or False",  icon: "✅", desc: "Pick True or False",            color: "bg-green-50 border-green-200 hover:border-green-500", badge: "bg-green-100 text-green-800" },
  { value: "short_answer",    label: "Type Answer",    icon: "⌨️", desc: "Type a short text answer",      color: "bg-purple-50 border-purple-200 hover:border-purple-500", badge: "bg-purple-100 text-purple-800" },
  { value: "puzzle",          label: "Puzzle",         icon: "🧩", desc: "Arrange items in the right order", color: "bg-orange-50 border-orange-200 hover:border-orange-500", badge: "bg-orange-100 text-orange-800" },
  { value: "slider",          label: "Slider",         icon: "🎚️", desc: "Pick a number on a scale",       color: "bg-cyan-50 border-cyan-200 hover:border-cyan-500", badge: "bg-cyan-100 text-cyan-800" },
  { value: "poll",            label: "Poll",           icon: "📢", desc: "Survey — no correct answer",     color: "bg-yellow-50 border-yellow-200 hover:border-yellow-500", badge: "bg-yellow-100 text-yellow-800" },
  { value: "word_cloud",      label: "Word Cloud",     icon: "☁️", desc: "Type a word, see the cloud",     color: "bg-sky-50 border-sky-200 hover:border-sky-500", badge: "bg-sky-100 text-sky-800" },
  { value: "open_ended",      label: "Open-Ended",     icon: "💬", desc: "Free-form written response",     color: "bg-rose-50 border-rose-200 hover:border-rose-500", badge: "bg-rose-100 text-rose-800" },
  { value: "brainstorm",      label: "Brainstorm",     icon: "🧠", desc: "List as many ideas as possible", color: "bg-violet-50 border-violet-200 hover:border-violet-500", badge: "bg-violet-100 text-violet-800" },
  { value: "drop_pin",        label: "Drop Pin",       icon: "📍", desc: "Click the correct spot on an image", color: "bg-emerald-50 border-emerald-200 hover:border-emerald-500", badge: "bg-emerald-100 text-emerald-800" },
  { value: "slide",           label: "Slide",          icon: "📋", desc: "Presentation page — no answer",  color: "bg-slate-50 border-slate-200 hover:border-slate-500", badge: "bg-slate-100 text-slate-800" },
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"]

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface QuestionOption { id: string; text: string }

export interface Question {
  id: string
  number: number
  text: string
  type: QuestionType
  options: QuestionOption[]
  correctAnswer: string
  explanation: string
  points: number
  imageUrl?: string
  youtubeVideoId?: string
  difficulty?: "easy" | "medium" | "hard"
  timeLimit?: number
  // Puzzle
  items?: string[]
  // Slider
  minValue?: number
  maxValue?: number
  correctValue?: number
  // Drop Pin
  pinImageUrl?: string
  pinRegion?: { x: number; y: number; radius: number }
  // Slide
  slideContent?: string
  // Multiple Choice Additions
  allowMultipleSelection?: boolean
  // Scoring Enhancements
  isDoublePoints?: boolean
}

interface QuizCreatorProps {
  assignmentId?: string
  quizId?: string
  onQuizCreated?: (quizId: string) => void
  onQuizUpdated?: () => void
  supabase: any
  profile: any
  familyId: string
  customTrigger?: React.ReactNode
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).substr(2, 9) }

function makeQuestion(type: QuestionType, number: number): Question {
  const base: Question = {
    id: uid(), number, text: "", type, options: [], correctAnswer: "",
    explanation: "", points: 1, difficulty: "medium", timeLimit: 30,
  }
  switch (type) {
    case "multiple_choice":
      return { ...base, options: [{ id: "1", text: "" }, { id: "2", text: "" }], correctAnswer: "0" }
    case "true_false":
      return { ...base, options: [{ id: "t", text: "True" }, { id: "f", text: "False" }], correctAnswer: "true" }
    case "poll":
      return { ...base, options: [{ id: "1", text: "" }, { id: "2", text: "" }], correctAnswer: "", points: 0 }
    case "puzzle":
      return { ...base, items: ["", ""], correctAnswer: "" }
    case "slider":
      return { ...base, minValue: 0, maxValue: 100, correctValue: 50, correctAnswer: "50" }
    case "drop_pin":
      return { ...base, pinImageUrl: "", pinRegion: { x: 50, y: 50, radius: 10 } }
    case "slide":
      return { ...base, slideContent: "", points: 0, timeLimit: 0 }
    case "word_cloud":
    case "open_ended":
    case "brainstorm":
      return { ...base, points: 0 }
    default:
      return base
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function QuizCreator({
  assignmentId, quizId, onQuizCreated, onQuizUpdated, supabase, profile, familyId, customTrigger
}: QuizCreatorProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<"overview" | "type-picker" | "editor">("overview")

  // Quiz meta
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [localQuizId, setLocalQuizId] = useState<string | undefined>(quizId)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Game settings
  const [questionTimer, setQuestionTimer] = useState(30)
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [timeBonusEnabled, setTimeBonusEnabled] = useState(true)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [shuffleOptions, setShuffleOptions] = useState(true)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(true)
  const [showExplanation, setShowExplanation] = useState(true)
  const [theme, setTheme] = useState("indigo")

  // Access
  const [maxAttempts, setMaxAttempts] = useState<number | "">("")
  const [assignedUsers, setAssignedUsers] = useState<string[]>([])
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [guestMode, setGuestMode] = useState(false)
  const [soloPin, setSoloPin] = useState("")
  const [allowCloning, setAllowCloning] = useState(false)
  const [allowEditing, setAllowEditing] = useState(false)

  useEffect(() => {
    if (open && familyId && supabase) {
      supabase.from("profiles").select("*").eq("family_id", familyId)
        .then(({ data }: any) => { if (data) setFamilyMembers(data) })

      if (quizId) {
        setSaving(true)
        Promise.all([
          supabase.from("quizzes").select("*").eq("id", quizId).single(),
          supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("question_number")
        ]).then(([quizRes, questionsRes]: any) => {
          if (quizRes.data) {
            const q = quizRes.data
            setTitle(q.title || "")
            setDescription(q.description || "")
            setCategory(q.category || "")
            setDifficulty(q.difficulty || "medium")
            setQuestionTimer(q.question_timer || 30)
            setShowLeaderboard(q.show_leaderboard ?? true)
            setTimeBonusEnabled(q.time_bonus_enabled ?? true)
            setShuffleQuestions(q.shuffle_questions ?? false)
            setShuffleOptions(q.shuffle_options ?? true)
            setShowCorrectAnswer(q.show_correct_answer ?? true)
            setShowExplanation(q.show_explanation ?? true)
            setMaxAttempts(q.max_attempts ?? "")
            setAssignedUsers(q.assigned_to || [])
            setGuestMode(q.guest_mode ?? false)
            setSoloPin(q.solo_pin || "")
            setAllowCloning(q.allow_cloning ?? false)
            setAllowEditing(q.allow_editing ?? false)
            setTheme(q.theme || "indigo")
          }
          if (questionsRes.data) {
            const loaded = questionsRes.data.map((q: any) => ({
              id: uid(),
              number: q.question_number,
              text: q.question_text,
              type: q.question_type,
              imageUrl: q.question_image_url || "",
              youtubeVideoId: q.youtube_video_id || "",
              difficulty: q.difficulty || "medium",
              timeLimit: q.time_limit || 30,
              options: q.options?.map((opt: string, i: number) => ({ id: i.toString(), text: opt })) || [],
              correctAnswer: q.correct_answer || "",
              explanation: q.explanation || "",
              points: q.points || 0,
              items: q.items || [],
              minValue: q.min_value || 0,
              maxValue: q.max_value || 100,
              correctValue: q.correct_value || 50,
              pinImageUrl: q.pin_image_url || "",
              pinRegion: q.pin_region || null,
              slideContent: q.slide_content || "",
              isDoublePoints: q.is_double_points || false,
            }))
            // For multiple choice, we mapped options to text, but correctAnswer in DB was the text, we need the index.
            const mapped = loaded.map((q: any) => {
               if (q.type === "multiple_choice") {
                  // Wait, earlier version stored it as string if it wasn't multi-select. But for multi-select it will just be indices already if we change it.
                  // For backward compatibility, if it's text we try to find the index. If it contains commas, it's multi-select indices.
                  if (q.correctAnswer && !q.correctAnswer.includes(",") && isNaN(parseInt(q.correctAnswer))) {
                      const idx = q.options.findIndex((o: any) => o.text === q.correctAnswer)
                      return { ...q, correctAnswer: idx !== -1 ? idx.toString() : "0" }
                  }
                  return q;
               }
               return q
            })
            setQuestions(mapped)
          }
          setSaving(false)
        }).catch(err => {
          setError(err.message)
          setSaving(false)
        })
      } else {
        // Reset
        setTitle(""); setDescription(""); setCategory(""); setQuestions([])
        setLocalQuizId(undefined)
      }
    }
  }, [open, familyId, supabase, quizId])

  // Auto-save effect for drafts
  useEffect(() => {
    if (!open || (!title.trim() && questions.length === 0)) return

    const timer = setTimeout(() => {
      saveQuiz(true, true) // Silent draft save
    }, 5000)

    return () => clearTimeout(timer)
  }, [
    title, description, category, difficulty, questions, questionTimer,
    showLeaderboard, timeBonusEnabled, shuffleQuestions, shuffleOptions,
    showCorrectAnswer, showExplanation, theme, maxAttempts, assignedUsers, guestMode, open
  ])

  const handleTypeSelect = (type: QuestionType) => {
    setCurrentQ(makeQuestion(type, questions.length + 1))
    setView("editor")
    setError("")
  }

  const handleSaveQuestion = (q: Question) => {
    setError("")
    if (q.type !== "slide" && !q.text.trim()) { setError("Question text is required"); return false }
    if (q.type === "multiple_choice" && q.options.filter(o => o.text.trim()).length < 2) {
      setError("Add at least 2 options"); return false
    }
    if (q.type === "puzzle" && (q.items || []).filter(i => i.trim()).length < 2) {
      setError("Add at least 2 puzzle items"); return false
    }
    const idx = questions.findIndex(x => x.id === q.id)
    if (idx !== -1) {
      const updated = [...questions]; updated[idx] = q; setQuestions(updated)
    } else {
      setQuestions([...questions, q])
    }
    setCurrentQ(null)
    setView("overview")
    return true
  }

  const deleteQuestion = (id: string) =>
    setQuestions(questions.filter(q => q.id !== id).map((q, i) => ({ ...q, number: i + 1 })))

  const saveQuiz = async (isDraft: boolean = false, isSilent: boolean = false) => {
    if (!title.trim()) { if (!isSilent) setError("Quiz title is required"); return }
    if (questions.length === 0) { if (!isSilent) setError("Add at least one question"); return }
    if (!isSilent) { setSaving(true); setError("") }
    try {
      const payload = {
        family_id: familyId, assignment_id: assignmentId,
        title: title.trim(), description: description.trim(), category: category.trim(),
        difficulty, question_timer: questionTimer, show_leaderboard: showLeaderboard,
        time_bonus_enabled: timeBonusEnabled, shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions, show_correct_answer: showCorrectAnswer,
        show_explanation: showExplanation, created_by: profile?.display_name || "Parent",
        max_attempts: maxAttempts === "" ? null : parseInt(maxAttempts.toString()),
        assigned_to: guestMode ? [] : (assignedUsers.length === 0 ? [] : assignedUsers),
        guest_mode: guestMode,
        solo_pin: soloPin.trim() || null,
        allow_cloning: allowCloning,
        allow_editing: allowEditing,
        theme: theme,
        is_draft: isDraft,
        updated_at: new Date().toISOString()
      }

      let quizData: any
      if (localQuizId) {
        const { data, error: e } = await supabase.from("quizzes").update(payload).eq("id", localQuizId).select().single()
        if (e && e.code !== 'PGRST116') throw e // ignore if not found just in case
        quizData = data || { id: localQuizId }
        await supabase.from("quiz_questions").delete().eq("quiz_id", localQuizId)
      } else {
        const { data, error: e } = await supabase.from("quizzes").insert(payload).select().single()
        if (e) throw e
        quizData = data
        if (isSilent) setLocalQuizId(data.id)
      }

      const toInsert = questions.map(q => ({
        quiz_id: quizData.id,
        question_number: q.number,
        question_text: q.text,
        question_type: q.type,
        question_image_url: q.imageUrl || "",
        youtube_video_id: q.youtubeVideoId || "",
        difficulty: q.difficulty || "medium",
        time_limit: q.timeLimit || questionTimer,
        options: ["multiple_choice", "true_false", "poll"].includes(q.type)
          ? q.options.map(o => o.text) : [],
        correct_answer:
          q.type === "multiple_choice" ? q.correctAnswer
          : q.type === "slider" ? String(q.correctValue ?? 50)
          : q.type === "puzzle" ? (q.items || []).filter(Boolean).join("|||")
          : q.correctAnswer || "",
        allow_multiple_selection: q.allowMultipleSelection || false,
        explanation: q.explanation,
        points: q.points,
        items: q.items || [],
        min_value: q.minValue ?? 0,
        max_value: q.maxValue ?? 100,
        correct_value: q.correctValue ?? null,
        pin_image_url: q.pinImageUrl || "",
        pin_region: q.pinRegion || null,
        slide_content: q.slideContent || "",
        is_double_points: q.isDoublePoints || false,
      }))

      const { error: qe } = await supabase.from("quiz_questions").insert(toInsert)
      if (qe) throw qe

      setLastSaved(new Date())

      if (!isDraft) {
        setTitle(""); setDescription(""); setCategory(""); setQuestions([])
        setCurrentQ(null); setView("overview"); setOpen(false); setLocalQuizId(undefined)
        quizId ? onQuizUpdated?.() : onQuizCreated?.(quizData.id)
      }
    } catch (err: any) {
      if (!isSilent) setError(err.message || "Failed to save quiz")
    } finally { 
      if (!isSilent) setSaving(false) 
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setView("overview"); setCurrentQ(null); setError("") } }}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-lg shadow-indigo-500/20">
            <Plus className="h-5 w-5 mr-2" />
            Create Quiz
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2">
                🎮 {localQuizId && !quizId ? "Resume Draft" : "Create Interactive Game Quiz"}
              </DialogTitle>
              <DialogDescription>Build engaging questions for your family</DialogDescription>
            </div>
            {lastSaved && (
              <span className="text-xs text-muted-foreground italic flex items-center">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Draft saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </DialogHeader>

        {view === "type-picker" && (
          <TypePicker
            onSelect={handleTypeSelect}
            onCancel={() => setView("overview")}
          />
        )}

        {view === "editor" && currentQ && (
          <QuestionEditor
            question={currentQ}
            onChange={setCurrentQ}
            onSave={handleSaveQuestion}
            onCancel={() => { setCurrentQ(null); setView("overview") }}
            error={error}
            setError={setError}
          />
        )}

        {view === "overview" && (
          <div className="space-y-4">
            {/* Basic details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quiz-title" className="text-xs font-bold">Quiz Title *</Label>
                <Input id="quiz-title" placeholder="e.g. Chapter 3 Quiz" value={title}
                  onChange={e => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="quiz-cat" className="text-xs font-bold">Category</Label>
                <Input id="quiz-cat" placeholder="e.g. Science" value={category}
                  onChange={e => setCategory(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="quiz-desc" className="text-xs font-bold">Description (optional)</Label>
              <Textarea id="quiz-desc" placeholder="Add instructions..." value={description}
                onChange={e => setDescription(e.target.value)} className="mt-1 min-h-[56px] resize-none" />
            </div>

            {/* Access & Limits */}
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm">🔒 Access & Limits</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                <div>
                  <Label className="text-xs font-bold">Max Attempts per Person</Label>
                  <Input type="number" placeholder="Leave blank for unlimited"
                    value={maxAttempts} className="mt-1"
                    onChange={e => setMaxAttempts(e.target.value === "" ? "" : parseInt(e.target.value))} />
                </div>

                {/* Guest Mode Toggle */}
                <div className={`flex items-center justify-between rounded-xl border-2 p-3 transition-all ${guestMode ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
                  <div>
                    <p className="text-xs font-black text-slate-800">🎮 Guest Mode</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {guestMode
                        ? "Anyone can join — guests type their own name. Family assignment is disabled."
                        : "Only family members can attempt this quiz."}
                    </p>
                  </div>
                  <Switch
                    id="guest-mode"
                    checked={guestMode}
                    onCheckedChange={(c) => {
                      setGuestMode(c)
                      if (c) setAssignedUsers([])
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold block mb-1.5">Require PIN for Solo Attempts</Label>
                    <Input 
                      placeholder="e.g. 1234 (blank = no PIN)" 
                      value={soloPin} 
                      onChange={e => setSoloPin(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center justify-between p-2 border rounded-lg bg-white">
                    <label className="text-xs font-medium cursor-pointer" htmlFor="allow-cloning">Allow others to duplicate</label>
                    <Switch id="allow-cloning" checked={allowCloning} onCheckedChange={(c: any) => setAllowCloning(c)} />
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-lg bg-white">
                    <label className="text-xs font-medium cursor-pointer" htmlFor="allow-editing">Allow others to edit</label>
                    <Switch id="allow-editing" checked={allowEditing} onCheckedChange={(c: any) => setAllowEditing(c)} />
                  </div>
                </div>

                {/* Family member selector */}
                {!guestMode && (
                  <div>
                    <Label className="text-xs font-bold block mb-1.5">Assign to specific members (empty = everyone)</Label>
                    <div className="flex flex-wrap gap-2">
                      {familyMembers.map(m => {
                        const sel = assignedUsers.includes(m.id)
                        return (
                          <div key={m.id} onClick={() => setAssignedUsers(sel
                            ? assignedUsers.filter(id => id !== m.id)
                            : [...assignedUsers, m.id])}
                            className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors select-none ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-slate-100 border-border"}`}>
                            {m.display_name}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Picker */}
            {(() => {
              const THEMES = [
                { id: "indigo",   label: "Indigo",   from: "from-indigo-600",  to: "to-indigo-800" },
                { id: "crimson",  label: "Crimson",  from: "from-red-500",     to: "to-rose-800" },
                { id: "emerald",  label: "Emerald",  from: "from-emerald-500", to: "to-teal-700" },
                { id: "sunset",   label: "Sunset",   from: "from-orange-400",  to: "to-pink-600" },
                { id: "midnight", label: "Midnight", from: "from-slate-700",   to: "to-slate-950" },
                { id: "ocean",    label: "Ocean",    from: "from-cyan-500",    to: "to-blue-800" },
              ]
              return (
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm">🎨 Game Theme</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="grid grid-cols-3 gap-2">
                      {THEMES.map(t => (
                        <button key={t.id} onClick={() => setTheme(t.id)}
                          className={`h-14 rounded-xl bg-gradient-to-br ${t.from} ${t.to} text-white font-black text-sm relative transition-all ${
                            theme === t.id ? "ring-4 ring-offset-2 ring-slate-400 scale-95" : "hover:scale-95 opacity-80 hover:opacity-100"
                          }`}>
                          {t.label}
                          {theme === t.id && <span className="absolute top-1 right-1 text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Game Settings */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  ⚡ Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold">Difficulty</Label>
                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Default Timer (sec)</Label>
                    <Input id="def-timer" type="number" min="5" max="180" value={questionTimer}
                      onChange={e => setQuestionTimer(parseInt(e.target.value) || 30)} className="mt-1 h-8" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { id: "lb", val: showLeaderboard, set: setShowLeaderboard, label: "🏆 Show Leaderboard" },
                    { id: "tb", val: timeBonusEnabled, set: setTimeBonusEnabled, label: "⏱️ Bonus Points for Speed" },
                    { id: "sq", val: shuffleQuestions, set: setShuffleQuestions, label: "🔀 Shuffle Questions" },
                    { id: "so", val: shuffleOptions, set: setShuffleOptions, label: "🔀 Shuffle Options" },
                    { id: "ca", val: showCorrectAnswer, set: setShowCorrectAnswer, label: "✅ Show Correct Answer" },
                    { id: "ex", val: showExplanation, set: setShowExplanation, label: "💡 Show Explanation" },
                  ].map(({ id, val, set, label }) => (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox id={id} checked={val} onCheckedChange={(c: any) => set(c)} />
                      <label htmlFor={id} className="text-xs font-medium cursor-pointer">{label}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Questions list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Questions ({questions.length})</Label>
                <Badge variant="secondary">{questions.reduce((s, q) => s + q.points, 0)} pts</Badge>
              </div>
              {questions.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                  {questions.map(q => {
                    const ti = QUESTION_TYPES.find(t => t.value === q.type)
                    return (
                      <div key={q.id} className="flex items-center gap-2 bg-white p-2 rounded border text-xs">
                        <span className="text-base shrink-0">{ti?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">Q{q.number}: {q.text || "(Slide)"}</div>
                          <div className="text-muted-foreground">{ti?.label} • {q.points} pts</div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                          onClick={() => { setCurrentQ(q); setView("editor") }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive"
                          onClick={() => deleteQuestion(q.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setView("type-picker")}>
                <Plus className="h-4 w-4 mr-2" />Add Question
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => saveQuiz(true)} disabled={!title.trim() || questions.length === 0 || saving} className="font-bold">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Draft
                </Button>
                <Button onClick={() => saveQuiz(false)} disabled={!title.trim() || questions.length === 0 || saving}
                  className="bg-emerald-500 hover:bg-emerald-600 font-bold">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Publish
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Type Picker ───────────────────────────────────────────────────────────────

function TypePicker({ onSelect, onCancel }: { onSelect: (t: QuestionType) => void; onCancel: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base">Choose Question Type</h3>
          <p className="text-xs text-muted-foreground">Select how players will answer</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QUESTION_TYPES.map(t => (
          <button key={t.value} type="button"
            onClick={() => onSelect(t.value as QuestionType)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${t.color}`}>
            <span className="text-2xl">{t.icon}</span>
            <span className="font-bold text-sm leading-tight">{t.label}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Question Editor ───────────────────────────────────────────────────────────

function QuestionEditor({
  question, onChange, onSave, onCancel, error, setError,
}: {
  question: Question
  onChange: (q: Question) => void
  onSave: (q: Question) => boolean
  onCancel: () => void
  error: string
  setError: (e: string) => void
}) {
  const ti = QUESTION_TYPES.find(t => t.value === question.type)!

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ti.icon}</span>
          <div>
            <CardTitle className="text-sm font-bold">{ti.label}</CardTitle>
            <p className="text-xs text-muted-foreground">{ti.desc}</p>
          </div>
          <Badge className={`ml-auto text-[10px] ${ti.badge}`}>{ti.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">

        {/* Settings row */}
        <div className={`grid gap-2 ${question.type === "slide" ? "grid-cols-2" : "grid-cols-4"}`}>
          {question.type !== "slide" && question.type !== "poll" && question.type !== "word_cloud" && (
            <div>
              <Label className="text-xs font-bold">Points</Label>
              <Input type="number" min="0" value={question.points}
                onChange={e => onChange({ ...question, points: parseInt(e.target.value) || 0 })}
                className="mt-1 h-8" />
            </div>
          )}
          {question.type !== "slide" && question.type !== "poll" && question.type !== "word_cloud" && (
            <div className="flex flex-col justify-end pb-1">
              <div className="flex items-center space-x-2">
                <Switch 
                  id={`double-pts-${question.id}`} 
                  checked={!!question.isDoublePoints} 
                  onCheckedChange={(c) => onChange({ ...question, isDoublePoints: c })} 
                />
                <Label htmlFor={`double-pts-${question.id}`} className="text-xs cursor-pointer">Double Points</Label>
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs font-bold">Difficulty</Label>
            <Select value={question.difficulty || "medium"} onValueChange={(v: any) => onChange({ ...question, difficulty: v })}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {question.type !== "slide" && (
            <div>
              <Label className="text-xs font-bold">Timer (sec)</Label>
              <Input type="number" min="5" max="300" value={question.timeLimit || 30}
                onChange={e => onChange({ ...question, timeLimit: parseInt(e.target.value) || 30 })}
                className="mt-1 h-8" />
            </div>
          )}
        </div>

        {/* Question Text / Prompt */}
        {question.type === "slide" ? (
          <div>
            <Label className="text-xs font-bold">Slide Content</Label>
            <Textarea placeholder="Write the content to display on this slide..."
              value={question.slideContent || ""}
              onChange={e => onChange({ ...question, slideContent: e.target.value })}
              className="mt-1 min-h-[100px]" />
          </div>
        ) : (
          <div>
            <Label className="text-xs font-bold">
              {question.type === "word_cloud" || question.type === "brainstorm" || question.type === "open_ended"
                ? "Prompt / Question" : "Question"}
            </Label>
            <Textarea placeholder="Enter the question or prompt..."
              value={question.text}
              onChange={e => onChange({ ...question, text: e.target.value })}
              className="mt-1 min-h-[60px]" />
          </div>
        )}

        {/* Type-specific panels */}
        {question.type === "multiple_choice" && <MCPanel q={question} onChange={onChange} />}
        {question.type === "true_false" && <TFPanel q={question} onChange={onChange} />}
        {question.type === "short_answer" && <ShortAnswerPanel q={question} onChange={onChange} />}
        {question.type === "puzzle" && <PuzzlePanel q={question} onChange={onChange} />}
        {question.type === "slider" && <SliderPanel q={question} onChange={onChange} />}
        {question.type === "poll" && <PollPanel q={question} onChange={onChange} />}
        {question.type === "word_cloud" && (
          <InfoPanel icon="☁️" text="Players type one word or phrase. After everyone responds, their answers appear as a live Word Cloud — bigger words = more popular." />
        )}
        {question.type === "open_ended" && (
          <InfoPanel icon="💬" text="Players write a free-form response. You review and score each one manually in the Results view." />
        )}
        {question.type === "brainstorm" && (
          <InfoPanel icon="🧠" text="Players list as many ideas as they can. All responses are collected and shown for group discussion." />
        )}
        {question.type === "drop_pin" && <DropPinPanel q={question} onChange={onChange} />}
        {question.type === "slide" && (
          <InfoPanel icon="📋" text="This is a read-only slide. Players just read the content and press Next to continue — no answer required." />
        )}

        {/* Explanation */}
        {!["slide", "poll", "word_cloud", "brainstorm", "open_ended", "drop_pin"].includes(question.type) && (
          <div>
            <Label className="text-xs font-bold">Explanation (shown after answering)</Label>
            <Textarea placeholder="Optional: explain why the answer is correct..."
              value={question.explanation}
              onChange={e => onChange({ ...question, explanation: e.target.value })}
              className="mt-1 min-h-[44px]" />
          </div>
        )}

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button onClick={() => onSave(question)} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
            Save Question
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Type-Specific Panels ─────────────────────────────────────────────────────

function InfoPanel({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex gap-2 bg-slate-50 border rounded-lg p-3">
      <span className="text-xl shrink-0">{icon}</span>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

function MCPanel({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  const addOpt = () => onChange({ ...q, options: [...q.options, { id: uid(), text: "" }] })
  const removeOpt = (id: string) => onChange({ ...q, options: q.options.filter(o => o.id !== id) })
  const updateOpt = (id: string, text: string) =>
    onChange({ ...q, options: q.options.map(o => o.id === id ? { ...o, text } : o) })

  const toggleCorrect = (idx: string) => {
    if (q.allowMultipleSelection) {
      const current = q.correctAnswer ? q.correctAnswer.split(",") : [];
      if (current.includes(idx)) {
        onChange({ ...q, correctAnswer: current.filter(i => i !== idx).join(",") })
      } else {
        onChange({ ...q, correctAnswer: [...current, idx].join(",") })
      }
    } else {
      onChange({ ...q, correctAnswer: idx })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 block">
        <Label className="text-xs font-bold">Answer Options (tick the correct one{q.allowMultipleSelection ? "s" : ""})</Label>
        <div className="flex items-center space-x-2">
          <Switch 
            id={`multi-${q.id}`} 
            checked={!!q.allowMultipleSelection} 
            onCheckedChange={(c) => onChange({ ...q, allowMultipleSelection: c, correctAnswer: "" })} 
          />
          <Label htmlFor={`multi-${q.id}`} className="text-xs cursor-pointer">Allow Multiple</Label>
        </div>
      </div>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const isCorrect = q.allowMultipleSelection 
            ? (q.correctAnswer ? q.correctAnswer.split(",").includes(idx.toString()) : false)
            : q.correctAnswer === idx.toString();
          
          return (
            <div key={opt.id} className="flex items-center gap-2">
              <input 
                type={q.allowMultipleSelection ? "checkbox" : "radio"} 
                name={`correct-${q.id}`} 
                checked={isCorrect}
                onChange={() => toggleCorrect(idx.toString())}
                className="w-4 h-4 accent-emerald-500" 
              />
              <Input placeholder={`Option ${idx + 1}`} value={opt.text}
                onChange={e => updateOpt(opt.id, e.target.value)} className="flex-1 h-8" />
              {q.options.length > 2 && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                  onClick={() => removeOpt(opt.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
      {q.options.length < 6 && (
        <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={addOpt}>
          <Plus className="h-3 w-3 mr-1" />Add Option
        </Button>
      )}
    </div>
  )
}

function TFPanel({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  return (
    <div>
      <Label className="text-xs font-bold mb-2 block">Correct Answer</Label>
      <div className="flex gap-3">
        {["true", "false"].map(v => (
          <button key={v} type="button"
            onClick={() => onChange({ ...q, correctAnswer: v })}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all capitalize ${q.correctAnswer === v ? v === "true" ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500" : "border-border hover:border-primary/40"}`}>
            {v === "true" ? "✅ True" : "❌ False"}
          </button>
        ))}
      </div>
    </div>
  )
}

function ShortAnswerPanel({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  return (
    <div>
      <Label className="text-xs font-bold">Correct Answer (for auto-grading)</Label>
      <Input placeholder="e.g. mitochondria" value={q.correctAnswer}
        onChange={e => onChange({ ...q, correctAnswer: e.target.value })} className="mt-1" />
      <p className="text-[10px] text-muted-foreground mt-1">Case-insensitive exact match. Leave blank for manual grading.</p>
    </div>
  )
}

function PuzzlePanel({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  const items = q.items || []
  const updateItem = (idx: number, val: string) => {
    const updated = [...items]; updated[idx] = val
    onChange({ ...q, items: updated })
  }
  const addItem = () => onChange({ ...q, items: [...items, ""] })
  const removeItem = (idx: number) => onChange({ ...q, items: items.filter((_, i) => i !== idx) })
  const moveUp = (idx: number) => {
    if (idx === 0) return
    const u = [...items];[u[idx - 1], u[idx]] = [u[idx], u[idx - 1]]
    onChange({ ...q, items: u })
  }
  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return
    const u = [...items];[u[idx], u[idx + 1]] = [u[idx + 1], u[idx]]
    onChange({ ...q, items: u })
  }

  return (
    <div>
      <Label className="text-xs font-bold mb-1 block">Items in Correct Order (top = first)</Label>
      <p className="text-[10px] text-muted-foreground mb-2">Players will see them scrambled and drag them into order.</p>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input placeholder={`Step ${idx + 1}`} value={item}
              onChange={e => updateItem(idx, e.target.value)} className="flex-1 h-8" />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveUp(idx)} disabled={idx === 0}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveDown(idx)} disabled={idx === items.length - 1}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {items.length > 2 && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {items.length < 8 && (
        <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" />Add Item
        </Button>
      )}
    </div>
  )
}

function SliderPanel({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  const min = q.minValue ?? 0
  const max = q.maxValue ?? 100
  const correct = q.correctValue ?? 50

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs font-bold">Min</Label>
          <Input type="number" value={min} className="mt-1 h-8"
            onChange={e => onChange({ ...q, minValue: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <Label className="text-xs font-bold">Max</Label>
          <Input type="number" value={max} className="mt-1 h-8"
            onChange={e => onChange({ ...q, maxValue: parseInt(e.target.value) || 100 })} />
        </div>
        <div>
          <Label className="text-xs font-bold">Correct Answer</Label>
          <Input type="number" value={correct} min={min} max={max} className="mt-1 h-8"
            onChange={e => {
              const v = parseInt(e.target.value) || 0
              onChange({ ...q, correctValue: v, correctAnswer: String(v) })
            }} />
        </div>
      </div>
      <div>
        <Label className="text-xs font-bold mb-1 block">Preview (correct answer shown)</Label>
        <div className="space-y-1">
          <input type="range" min={min} max={max} value={correct} readOnly
            className="w-full accent-emerald-500" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{min}</span><span className="font-bold text-emerald-600">✓ {correct}</span><span>{max}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PollPanel({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  const addOpt = () => onChange({ ...q, options: [...q.options, { id: uid(), text: "" }] })
  const removeOpt = (id: string) => onChange({ ...q, options: q.options.filter(o => o.id !== id) })
  const updateOpt = (id: string, text: string) =>
    onChange({ ...q, options: q.options.map(o => o.id === id ? { ...o, text } : o) })

  return (
    <div>
      <Label className="text-xs font-bold mb-1 block">Poll Options</Label>
      <p className="text-[10px] text-muted-foreground mb-2">No correct answer — results are shown as a bar chart.</p>
      <div className="space-y-2">
        {q.options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
            <Input placeholder={`Option ${idx + 1}`} value={opt.text}
              onChange={e => updateOpt(opt.id, e.target.value)} className="flex-1 h-8" />
            {q.options.length > 2 && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                onClick={() => removeOpt(opt.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {q.options.length < 6 && (
        <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={addOpt}>
          <Plus className="h-3 w-3 mr-1" />Add Option
        </Button>
      )}
    </div>
  )
}

function DropPinPanel({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const region = q.pinRegion || { x: 50, y: 50, radius: 10 }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => onChange({ ...q, pinImageUrl: reader.result as string })
    reader.readAsDataURL(file)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    onChange({ ...q, pinRegion: { ...region, x, y } })
  }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      {!q.pinImageUrl ? (
        <div className="border-2 border-dashed rounded-xl p-6 text-center bg-slate-50 cursor-pointer"
          onClick={() => fileRef.current?.click()}>
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Upload background image</p>
          <p className="text-xs text-muted-foreground">Then click on it to mark the correct spot</p>
        </div>
      ) : (
        <div>
          <Label className="text-xs font-bold mb-1 block">
            Click on the image to set the correct pin location 📍
          </Label>
          <div ref={imgRef} className="relative cursor-crosshair rounded-xl overflow-hidden border-2 border-primary/30"
            onClick={handleImageClick}>
            <img src={q.pinImageUrl} alt="Drop pin background" className="w-full object-cover" />
            {/* Correct region circle */}
            <div className="absolute pointer-events-none" style={{
              left: `${region.x}%`, top: `${region.y}%`,
              width: `${region.radius * 2}%`, height: `${region.radius * 2}%`,
              transform: "translate(-50%, -50%)",
            }}>
              <div className="w-full h-full rounded-full border-4 border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                <span className="text-lg">📍</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">
              Pin at ({region.x}%, {region.y}%) • Tolerance: ±{region.radius}%
            </p>
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-bold">Radius %</Label>
              <Input type="number" min="3" max="40" value={region.radius} className="h-7 w-16 text-xs"
                onChange={e => onChange({ ...q, pinRegion: { ...region, radius: parseInt(e.target.value) || 10 } })} />
              <Button variant="ghost" size="sm" className="text-xs h-7"
                onClick={() => { onChange({ ...q, pinImageUrl: "" }); if (fileRef.current) fileRef.current.value = "" }}>
                <X className="h-3 w-3 mr-1" />Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
