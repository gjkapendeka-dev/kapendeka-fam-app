import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Copy, Loader2, AlertCircle, Image as ImageIcon, X } from "lucide-react"

interface QuestionOption {
  id: string
  text: string
  imageUrl?: string
}

interface Question {
  id: string
  number: number
  text: string
  type: "multiple_choice" | "true_false" | "short_answer" | "essay"
  options: QuestionOption[]
  correctAnswer: string | number
  explanation: string
  points: number
  imageUrl?: string
  difficulty?: "easy" | "medium" | "hard"
  timeLimit?: number
}

interface QuizCreatorProps {
  assignmentId?: string
  quizId?: string // For editing existing quiz
  onQuizCreated?: (quizId: string) => void
  onQuizUpdated?: () => void
  supabase: any
  profile: any
  familyId: string
}

export function QuizCreator({
  assignmentId,
  quizId,
  onQuizCreated,
  onQuizUpdated,
  supabase,
  profile,
  familyId,
}: QuizCreatorProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  // Kahoot settings
  const [questionTimer, setQuestionTimer] = useState(30)
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [timeBonusEnabled, setTimeBonusEnabled] = useState(true)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [shuffleOptions, setShuffleOptions] = useState(true)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(true)
  const [showExplanation, setShowExplanation] = useState(true)

  // Add new question
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      number: questions.length + 1,
      text: "",
      type: "multiple_choice",
      options: [{ id: "1", text: "" }, { id: "2", text: "" }],
      correctAnswer: "0",
      explanation: "",
      points: 1,
    }
    setCurrentQuestion(newQuestion)
  }

  // Save question to list
  const saveQuestion = () => {
    if (!currentQuestion) return

    if (!currentQuestion.text.trim()) {
      setError("Question text is required")
      return
    }

    if (currentQuestion.type === "multiple_choice") {
      const filledOptions = currentQuestion.options.filter((o) => o.text.trim())
      if (filledOptions.length < 2) {
        setError("Multiple choice needs at least 2 options")
        return
      }
    }

    const existing = questions.findIndex((q) => q.id === currentQuestion.id)
    if (existing !== -1) {
      const updated = [...questions]
      updated[existing] = currentQuestion
      setQuestions(updated)
    } else {
      setQuestions([...questions, currentQuestion])
    }

    setCurrentQuestion(null)
    setError("")
  }

  // Edit existing question
  const editQuestion = (question: Question) => {
    setCurrentQuestion(question)
  }

  // Delete question
  const deleteQuestion = (id: string) => {
    const updated = questions
      .filter((q) => q.id !== id)
      .map((q, i) => ({ ...q, number: i + 1 }))
    setQuestions(updated)
  }

  // Duplicate question
  const duplicateQuestion = (question: Question) => {
    const newQuestion = {
      ...question,
      id: Math.random().toString(36).substr(2, 9),
      number: questions.length + 1,
    }
    setQuestions([...questions, newQuestion])
  }

  // Save quiz to database
  const saveQuiz = async () => {
    if (!title.trim()) {
      setError("Quiz title is required")
      return
    }

    if (questions.length === 0) {
      setError("Add at least one question")
      return
    }

    setSaving(true)
    setError("")

    try {
      // Calculate total points
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

      const quizPayload = {
        family_id: familyId,
        assignment_id: assignmentId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        difficulty,
        question_timer: questionTimer,
        show_leaderboard: showLeaderboard,
        time_bonus_enabled: timeBonusEnabled,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_correct_answer: showCorrectAnswer,
        show_explanation: showExplanation,
        created_by: profile?.display_name || "Parent",
      }

      let quizData

      if (quizId) {
        // Update existing quiz
        const { data, error: quizError } = await supabase
          .from("quizzes")
          .update(quizPayload)
          .eq("id", quizId)
          .select()
          .single()

        if (quizError) throw quizError
        quizData = data

        // Delete old questions
        await supabase.from("quiz_questions").delete().eq("quiz_id", quizId)
      } else {
        // Create new quiz
        const { data, error: quizError } = await supabase
          .from("quizzes")
          .insert(quizPayload)
          .select()
          .single()

        if (quizError) throw quizError
        quizData = data
      }

      // Add all questions
      const questionsToInsert = questions.map((q) => ({
        quiz_id: quizData.id,
        question_number: q.number,
        question_text: q.text,
        question_type: q.type,
        question_image_url: q.imageUrl || "",
        difficulty: q.difficulty || "medium",
        time_limit: q.timeLimit || questionTimer,
        options:
          q.type === "multiple_choice" || q.type === "true_false"
            ? q.options.map((o) => o.text)
            : [],
        correct_answer:
          q.type === "multiple_choice"
            ? q.options[parseInt(q.correctAnswer.toString())].text
            : q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
      }))

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      setTitle("")
      setDescription("")
      setCategory("")
      setQuestions([])
      setCurrentQuestion(null)
      setOpen(false)

      if (quizId) {
        onQuizUpdated?.()
      } else {
        onQuizCreated?.(quizData.id)
      }
    } catch (err) {
      setError((err as any).message || "Failed to save quiz")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Kahoot-Style Quiz</DialogTitle>
          <DialogDescription>
            Build engaging questions for your students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quiz Details */}
          {!currentQuestion && (
            <div className="space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quiz-title" className="text-xs font-bold">
                    Quiz Title
                  </Label>
                  <Input
                    id="quiz-title"
                    placeholder="e.g., Chapter 3 Vocabulary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="quiz-category" className="text-xs font-bold">
                    Category
                  </Label>
                  <Input
                    id="quiz-category"
                    placeholder="e.g., Science"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quiz-desc" className="text-xs font-bold">
                  Description (optional)
                </Label>
                <Textarea
                  id="quiz-desc"
                  placeholder="Add instructions or context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-16 resize-none"
                />
              </div>

              {/* Kahoot Settings */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>⚡ Kahoot Settings</span>
                    <Badge variant="outline" className="text-xs">Pro</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Difficulty</Label>
                      <Select value={difficulty} onValueChange={(val: any) => setDifficulty(val)}>
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timer" className="text-xs font-bold">
                        Question Timer (sec)
                      </Label>
                      <Input
                        id="timer"
                        type="number"
                        min="5"
                        max="180"
                        value={questionTimer}
                        onChange={(e) => setQuestionTimer(parseInt(e.target.value) || 30)}
                        className="mt-1 h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="show-leaderboard"
                        checked={showLeaderboard}
                        onCheckedChange={(checked: any) => setShowLeaderboard(checked)}
                      />
                      <label htmlFor="show-leaderboard" className="text-xs font-medium cursor-pointer">
                        🏆 Show Leaderboard
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="time-bonus"
                        checked={timeBonusEnabled}
                        onCheckedChange={(checked: any) => setTimeBonusEnabled(checked)}
                      />
                      <label htmlFor="time-bonus" className="text-xs font-medium cursor-pointer">
                        ⏱️ Bonus Points for Speed
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="shuffle-questions"
                        checked={shuffleQuestions}
                        onCheckedChange={(checked: any) => setShuffleQuestions(checked)}
                      />
                      <label htmlFor="shuffle-questions" className="text-xs font-medium cursor-pointer">
                        🔀 Shuffle Questions
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="shuffle-options"
                        checked={shuffleOptions}
                        onCheckedChange={(checked: any) => setShuffleOptions(checked)}
                      />
                      <label htmlFor="shuffle-options" className="text-xs font-medium cursor-pointer">
                        🔀 Shuffle Answer Options
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="show-answer"
                        checked={showCorrectAnswer}
                        onCheckedChange={(checked: any) => setShowCorrectAnswer(checked)}
                      />
                      <label htmlFor="show-answer" className="text-xs font-medium cursor-pointer">
                        ✅ Show Correct Answer
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="show-explain"
                        checked={showExplanation}
                        onCheckedChange={(checked: any) => setShowExplanation(checked)}
                      />
                      <label htmlFor="show-explain" className="text-xs font-medium cursor-pointer">
                        💡 Show Explanation
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">
                    Questions ({questions.length})
                  </Label>
                  <Badge variant="secondary">
                    {questions.reduce((sum, q) => sum + q.points, 0)} points
                  </Badge>
                </div>

                {questions.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between bg-slate-50 p-2 rounded border text-sm"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-xs">
                            Q{q.number}: {q.text.substring(0, 50)}
                            {q.text.length > 50 ? "..." : ""}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {q.type === "multiple_choice" && "Multiple Choice"}
                            {q.type === "true_false" && "True/False"}
                            {q.type === "short_answer" && "Short Answer"}
                            {q.type === "essay" && "Essay"} • {q.points} pts
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => editQuestion(q)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteQuestion(q.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveQuiz}
                  disabled={!title.trim() || questions.length === 0 || saving}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Publish Quiz
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Question Editor */}
          {currentQuestion && <QuestionEditor 
            question={currentQuestion}
            onChange={setCurrentQuestion}
            onSave={saveQuestion}
            onCancel={() => setCurrentQuestion(null)}
            error={error}
            setError={setError}
          />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QuestionEditor({ 
  question, 
  onChange, 
  onSave, 
  onCancel,
  error,
  setError,
}: {
  question: Question
  onChange: (q: Question) => void
  onSave: () => void
  onCancel: () => void
  error: string
  setError: (e: string) => void
}) {
  const [imagePreview, setImagePreview] = useState<string>(question.imageUrl || "")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAddOption = () => {
    const newOptions = [
      ...question.options,
      { id: Math.random().toString(36).substr(2, 9), text: "", imageUrl: "" },
    ]
    onChange({ ...question, options: newOptions })
  }

  const handleRemoveOption = (id: string) => {
    const newOptions = question.options.filter((o) => o.id !== id)
    onChange({ ...question, options: newOptions })
  }

  const handleOptionChange = (id: string, text: string) => {
    const newOptions = question.options.map((o) =>
      o.id === id ? { ...o, text } : o
    )
    onChange({ ...question, options: newOptions })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isQuestion: boolean = true) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, create a data URL. In production, upload to Supabase storage
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      if (isQuestion) {
        setImagePreview(base64)
        onChange({ ...question, imageUrl: base64 })
      } else {
        // For option images, you'd handle similarly
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Question {question.number}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Type */}
        <div>
          <Label className="text-xs font-bold mb-1 block">Question Type</Label>
          <Select
            value={question.type}
            onValueChange={(val: any) =>
              onChange({ ...question, type: val })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="true_false">True/False</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold mb-1 block">Difficulty</Label>
            <Select
              value={question.difficulty || "medium"}
              onValueChange={(val: any) =>
                onChange({ ...question, difficulty: val })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="time-limit" className="text-xs font-bold">
              Time Limit (sec)
            </Label>
            <Input
              id="time-limit"
              type="number"
              min="5"
              max="180"
              value={question.timeLimit || 30}
              onChange={(e) =>
                onChange({ ...question, timeLimit: parseInt(e.target.value) || 30 })
              }
              className="mt-1"
            />
          </div>
        </div>

        {/* Question Text */}
        <div>
          <Label htmlFor="question-text" className="text-xs font-bold">
            Question
          </Label>
          <Textarea
            id="question-text"
            placeholder="Enter the question..."
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            className="mt-1 min-h-16"
          />
        </div>

        {/* Question Image */}
        <div>
          <Label className="text-xs font-bold mb-2 block">Question Image (optional)</Label>
          <div className="border-2 border-dashed rounded-lg p-3 bg-slate-50">
            {imagePreview && (
              <div className="mb-2 relative">
                <img
                  src={imagePreview}
                  alt="Question"
                  className="max-h-32 rounded border"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => {
                    setImagePreview("")
                    onChange({ ...question, imageUrl: "" })
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, true)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
              Upload Image
            </Button>
          </div>
        </div>

        {/* Options for Multiple Choice/True-False */}
        {(question.type === "multiple_choice" ||
          question.type === "true_false") && (
          <div>
            <Label className="text-xs font-bold mb-2 block">Options</Label>
            <div className="space-y-2">
              {question.options.map((option, idx) => (
                <div key={option.id} className="flex gap-2 items-start">
                  <Checkbox
                    checked={
                      question.type === "true_false"
                        ? question.correctAnswer ===
                          (idx === 0 ? "true" : "false")
                        : question.correctAnswer === idx.toString()
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange({
                          ...question,
                          correctAnswer:
                            question.type === "true_false"
                              ? idx === 0
                                ? "true"
                                : "false"
                              : idx.toString(),
                        })
                      }
                    }}
                    className="mt-2.5"
                  />
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={option.text}
                    onChange={(e) =>
                      handleOptionChange(option.id, e.target.value)
                    }
                    className="flex-1"
                  />
                  {question.options.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveOption(option.id)}
                      className="text-destructive hover:text-destructive mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {question.type === "multiple_choice" && question.options.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={handleAddOption}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            )}
          </div>
        )}

        {/* Correct Answer for Short Answer */}
        {question.type === "short_answer" && (
          <div>
            <Label htmlFor="correct-answer" className="text-xs font-bold">
              Correct Answer (for grading reference)
            </Label>
            <Input
              id="correct-answer"
              placeholder="e.g., mitochondria"
              value={question.correctAnswer}
              onChange={(e) =>
                onChange({ ...question, correctAnswer: e.target.value })
              }
              className="mt-1"
            />
          </div>
        )}

        {/* Points */}
        <div>
          <Label htmlFor="points" className="text-xs font-bold">
            Points
          </Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={question.points}
            onChange={(e) =>
              onChange({ ...question, points: parseInt(e.target.value) || 1 })
            }
            className="mt-1"
          />
        </div>

        {/* Explanation */}
        <div>
          <Label htmlFor="explanation" className="text-xs font-bold">
            Explanation (optional)
          </Label>
          <Textarea
            id="explanation"
            placeholder="Show this after they answer (helps learning)..."
            value={question.explanation}
            onChange={(e) =>
              onChange({ ...question, explanation: e.target.value })
            }
            className="mt-1 min-h-16 resize-none text-xs"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          >
            Save Question
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
