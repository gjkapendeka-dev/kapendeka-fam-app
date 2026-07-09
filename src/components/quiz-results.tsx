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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Users,
  FileText,
  Download,
  Eye,
  Pencil,
  TrendingUp,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QuizEditor } from "./quiz-editor"
import { QuizLeaderboard } from "./quiz-leaderboard"

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
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null)
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [quizId])

  const fetchData = async () => {
    try {
      // Fetch quiz
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single()

      // Fetch questions
      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("question_number")

      // Fetch attempts
      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .order("completed_at", { ascending: false })

      // Fetch responses
      const { data: responsesData } = await supabase
        .from("quiz_responses")
        .select("*")
        .eq("quiz_id", quizId)

      setQuiz(quizData)
      setQuestions(questionsData || [])
      setAttempts(attemptsData || [])
      setResponses(responsesData || [])

      // Calculate stats
      if (attemptsData && attemptsData.length > 0) {
        const completed = attemptsData.filter((a) => a.is_completed)
        const scores = completed.map((a) => a.percentage_score || 0)
        setStats({
          totalAttempts: attemptsData.length,
          averageScore:
            scores.length > 0
              ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
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

  const getAttemptResponses = (attemptId: string) => {
    return responses.filter((r) => {
      const attempt = attempts.find((a) => a.id === attemptId)
      return attempt && r.student_id === attempt.student_id
    })
  }

  const scoreQuestion = async (responseId: string, pointsEarned: number) => {
    setGrading(true)
    try {
      await supabase
        .from("quiz_responses")
        .update({
          is_correct: pointsEarned > 0,
          points_earned: pointsEarned,
        })
        .eq("id", responseId)

      // Update attempt score
      const attemptResponses = responses.map((r) =>
        r.id === responseId
          ? { ...r, points_earned: pointsEarned, is_correct: pointsEarned > 0 }
          : r
      )

      const totalPoints = attemptResponses.reduce(
        (sum, r) => sum + (r.points_earned || 0),
        0
      )
      const attempt = attempts.find(
        (a) => a.id === selectedAttempt.id
      )
      const maxPoints = attempt?.max_points || 1
      const percentage = (totalPoints / maxPoints) * 100

      await supabase
        .from("quiz_attempts")
        .update({
          total_points: totalPoints,
          percentage_score: Math.round(percentage * 100) / 100,
        })
        .eq("id", selectedAttempt.id)

      // Refresh data
      fetchData()
      toast({
        title: "Scored",
        description: "Question scored successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any).message,
        variant: "destructive",
      })
    } finally {
      setGrading(false)
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

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quiz Results: {quiz?.title}
            </CardTitle>
            {isParent && familyId && (
              <QuizEditor
                quizId={quizId}
                quizTitle={quiz?.title}
                supabase={supabase}
                profile={profile}
                familyId={familyId}
                onUpdated={() => fetchData()}
              />
            )}
          </div>
          {quiz?.category && (
            <p className="text-xs text-muted-foreground mt-2">
              Category: <Badge variant="outline">{quiz.category}</Badge>
              {quiz?.difficulty && (
                <>
                  {" "}Difficulty: <Badge variant="outline" className="capitalize">{quiz.difficulty}</Badge>
                </>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Kahoot Stats */}
          {quiz && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="text-center">
                <div className="text-sm font-bold">⏱️</div>
                <div className="text-xs font-semibold">{quiz.question_timer}s</div>
                <div className="text-[10px] text-muted-foreground">Timer</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">{quiz.time_bonus_enabled ? "✨" : "✖️"}</div>
                <div className="text-xs font-semibold">Speed Bonus</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">{quiz.show_leaderboard ? "🏆" : "✖️"}</div>
                <div className="text-xs font-semibold">Leaderboard</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">{quiz.shuffle_questions ? "🔀" : "➡️"}</div>
                <div className="text-xs font-semibold">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">{quiz.shuffle_options ? "🔀" : "➡️"}</div>
                <div className="text-xs font-semibold">Options</div>
              </div>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.totalAttempts}
                </div>
                <div className="text-xs text-muted-foreground">Total Attempts</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.averageScore}%
                </div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {stats.highestScore}%
                </div>
                <div className="text-xs text-muted-foreground">Highest</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.lowestScore}%
                </div>
                <div className="text-xs text-muted-foreground">Lowest</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {quiz?.show_leaderboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <QuizLeaderboard
            quizId={quizId}
            supabase={supabase}
            currentStudentId={profile?.id}
            showLive={true}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attempts.length > 0 && (
                <>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium">Total Responses</span>
                    <span className="text-sm font-bold">{responses.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium">Accuracy Rate</span>
                    <span className="text-sm font-bold">
                      {responses.length > 0
                        ? Math.round(
                            (responses.filter((r) => r.is_correct).length /
                              responses.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span className="text-xs font-medium">🏆 Top Score</span>
                    <span className="text-sm font-bold">{stats?.highestScore}%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Attempts ({attempts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm">{attempt.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attempt.is_completed
                      ? `Completed: ${new Date(attempt.completed_at).toLocaleDateString()}`
                      : "In Progress"}
                  </p>
                </div>

                {attempt.is_completed && (
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">
                        {attempt.total_points}/{attempt.max_points}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">
                        {attempt.percentage_score}%
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAttempt(attempt)}
                          className="gap-2"
                        >
                          <Eye className="h-3 w-3" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Review: {attempt.student_name}
                          </DialogTitle>
                          <DialogDescription>
                            Score: {attempt.total_points}/{attempt.max_points} (
                            {attempt.percentage_score}%)
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {questions.map((question) => {
                            const response = responses.find(
                              (r) =>
                                r.question_id === question.id &&
                                r.student_id === attempt.student_id
                            )

                            return (
                              <Card key={question.id} className="border-l-4 border-l-blue-500">
                                <CardContent className="pt-4">
                                  <div className="mb-3">
                                    <h4 className="font-bold text-sm mb-1">
                                      Q{question.question_number}: {question.question_text}
                                    </h4>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      {question.points} pts
                                    </Badge>
                                  </div>

                                  {response ? (
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-xs font-bold text-muted-foreground">
                                          Student Answer:
                                        </p>
                                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                                          {response.answer_text}
                                        </p>
                                      </div>

                                      {question.question_type === "multiple_choice" ||
                                      question.question_type === "true_false" ? (
                                        <>
                                          <div className="flex items-center gap-2">
                                            {response.is_correct ? (
                                              <>
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                <span className="text-xs font-bold text-emerald-600">
                                                  Correct!
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <XCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-xs font-bold text-red-600">
                                                  Incorrect
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-muted-foreground">
                                              Correct Answer:
                                            </p>
                                            <p className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded">
                                              {question.correct_answer}
                                            </p>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="space-y-2 bg-amber-50 border border-amber-200 p-2 rounded">
                                          <p className="text-xs font-bold text-amber-800">
                                            Needs Manual Grading
                                          </p>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="flex-1"
                                              onClick={() =>
                                                scoreQuestion(
                                                  response.id,
                                                  question.points
                                                )
                                              }
                                              disabled={grading}
                                            >
                                              {grading && (
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                              )}
                                              Mark Correct ({question.points} pts)
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                scoreQuestion(response.id, 0)
                                              }
                                              disabled={grading}
                                              className="flex-1"
                                            >
                                              Mark Incorrect
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {question.explanation && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                          <p className="text-xs font-bold text-blue-800 mb-1">
                                            💡 Explanation:
                                          </p>
                                          <p className="text-xs text-blue-700">
                                            {question.explanation}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <AlertCircle className="h-4 w-4" />
                                      <span className="text-xs">Not answered</span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>

          {attempts.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No quiz attempts yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
