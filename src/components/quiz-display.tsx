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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Zap,
  Flame,
  Clock,
  Target,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QuizQuestion {
  id: string
  question_number: number
  question_text: string
  question_type: "multiple_choice" | "true_false" | "short_answer" | "essay"
  options: string[]
  correct_answer: string
  explanation: string
  points: number
  question_image_url?: string
  difficulty?: string
}

interface StudentResponse {
  questionId: string
  answer: string
  timeSpent?: number
}

interface QuizDisplayProps {
  quizId: string
  supabase: any
  profile: any
  onComplete?: (score: number, maxScore: number) => void
}

export function QuizDisplay({
  quizId,
  supabase,
  profile,
  onComplete,
}: QuizDisplayProps) {
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<StudentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quizAttempt, setQuizAttempt] = useState<any>(null)
  
  // Kahoot features
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)

  useEffect(() => {
    fetchQuizData()
  }, [quizId])

  // Timer effect
  useEffect(() => {
    if (!quiz || timeRemaining <= 0 || submitting) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleNextQuestion() // Auto-advance when time runs out
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, quiz, submitting])

  const fetchQuizData = async () => {
    try {
      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single()

      if (quizError) throw quizError

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("question_number", { ascending: true })

      if (questionsError) throw questionsError

      setQuiz(quizData)
      setQuestions(questionsData)
      setTimeRemaining(quizData.question_timer || 30)
      setQuestionStartTime(Date.now())

      // Create quiz attempt
      const totalPoints = questionsData.reduce((sum: number, q: any) => sum + q.points, 0)
      const { data: attemptData, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          student_id: profile?.id,
          student_name: profile?.display_name,
          max_points: totalPoints,
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      setQuizAttempt(attemptData)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any).message || "Failed to load quiz",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Track time spent on current question
      if (questionStartTime) {
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
        setTotalTimeSpent((prev) => prev + timeSpent)
        
        const index = responses.findIndex((r) => r.questionId === currentQuestion.id)
        if (index !== -1) {
          responses[index].timeSpent = timeSpent
        }
      }

      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setTimeRemaining(quiz?.question_timer || 30)
      setQuestionStartTime(Date.now())
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setTimeRemaining(quiz?.question_timer || 30)
      setQuestionStartTime(Date.now())
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentResponse = responses.find((r) => r.questionId === currentQuestion?.id)

  const handleAnswer = (answer: string) => {
    const index = responses.findIndex((r) => r.questionId === currentQuestion.id)
    if (index !== -1) {
      const updated = [...responses]
      updated[index] = { questionId: currentQuestion.id, answer }
      setResponses(updated)
    } else {
      setResponses([...responses, { questionId: currentQuestion.id, answer }])
    }
  }

  const submitQuiz = async () => {
    if (responses.length !== questions.length) {
      toast({
        title: "Incomplete",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      let totalPoints = 0

      // Save responses and calculate score
      for (const question of questions) {
        const response = responses.find((r) => r.questionId === question.id)
        if (!response) continue

        let isCorrect = false
        let pointsEarned = 0

        if (question.question_type === "multiple_choice") {
          isCorrect = response.answer === question.correct_answer
          pointsEarned = isCorrect ? question.points : 0
        } else if (question.question_type === "true_false") {
          isCorrect =
            response.answer.toLowerCase() === question.correct_answer.toLowerCase()
          pointsEarned = isCorrect ? question.points : 0
        } else {
          // Short answer and essay need manual grading
          pointsEarned = 0
        }

        if (isCorrect) totalPoints += pointsEarned

        // Save response
        await supabase.from("quiz_responses").insert({
          quiz_id: quizId,
          question_id: question.id,
          student_id: profile?.id,
          student_name: profile?.display_name,
          answer_text: response.answer,
          is_correct: question.question_type === "short_answer" || question.question_type === "essay" ? null : isCorrect,
          points_earned:
            question.question_type === "short_answer" || question.question_type === "essay"
              ? null
              : pointsEarned,
        })
      }

      // Update attempt
      const percentage =
        (totalPoints / (quizAttempt?.max_points || 1)) * 100

      await supabase
        .from("quiz_attempts")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          total_points: totalPoints,
          percentage_score: Math.round(percentage * 100) / 100,
        })
        .eq("id", quizAttempt.id)

      toast({
        title: "Quiz Submitted!",
        description: `You scored ${totalPoints}/${quizAttempt?.max_points || 0} points`,
      })

      onComplete?.(totalPoints, quizAttempt?.max_points || 0)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any).message || "Failed to submit quiz",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
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

  if (!quiz || questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8">
          <div className="flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Quiz not found</p>
              <p className="text-xs text-muted-foreground">
                This quiz is no longer available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                {quiz.title}
              </CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </div>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <div className="flex items-start gap-2 mb-3">
            <h3 className="text-lg font-bold flex-1">{currentQuestion?.question_text}</h3>
            <Badge className="bg-emerald-100 text-emerald-800">
              {currentQuestion?.points} pts
            </Badge>
          </div>

          {/* Multiple Choice */}
          {currentQuestion?.question_type === "multiple_choice" && (
            <RadioGroup
              value={currentResponse?.answer || ""}
              onValueChange={handleAnswer}
            >
              <div className="space-y-2">
                {currentQuestion?.options.map((option: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label
                      htmlFor={`option-${idx}`}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* True/False */}
          {currentQuestion?.question_type === "true_false" && (
            <RadioGroup
              value={currentResponse?.answer || ""}
              onValueChange={handleAnswer}
            >
              <div className="flex gap-3">
                {["True", "False"].map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors flex-1"
                  >
                    <RadioGroupItem
                      value={option}
                      id={`tf-${option}`}
                    />
                    <Label
                      htmlFor={`tf-${option}`}
                      className="cursor-pointer font-bold"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* Short Answer */}
          {currentQuestion?.question_type === "short_answer" && (
            <Input
              placeholder="Type your answer..."
              value={currentResponse?.answer || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              className="min-h-10"
            />
          )}

          {/* Essay */}
          {currentQuestion?.question_type === "essay" && (
            <Textarea
              placeholder="Type your essay answer here..."
              value={currentResponse?.answer || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              className="min-h-32 resize-none"
            />
          )}

          {/* Explanation hint */}
          {currentQuestion?.explanation && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
              <p className="font-bold mb-1">💡 Hint:</p>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0 || submitting}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={submitQuiz}
              disabled={responses.length !== questions.length || submitting}
              className="bg-emerald-500 hover:bg-emerald-600 gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
              }
              disabled={!currentResponse || submitting}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Question Summary */}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs font-bold text-muted-foreground mb-2">
            Question Status
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
            {questions.map((q, idx) => {
              const hasResponse = responses.find((r) => r.questionId === q.id)
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-8 rounded font-bold text-xs transition-colors ${
                    idx === currentQuestionIndex
                      ? "bg-emerald-500 text-white ring-2 ring-emerald-600 ring-offset-2"
                      : hasResponse
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
