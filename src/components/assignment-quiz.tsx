import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { QuizCreator } from "./quiz-creator"
import { QuizDisplay } from "./quiz-display"
import { QuizResults } from "./quiz-results"
import { Zap, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AssignmentQuizProps {
  assignmentId: string
  supabase: any
  profile: any
  familyId: string
  isParent: boolean
}

export function AssignmentQuiz({
  assignmentId,
  supabase,
  profile,
  familyId,
  isParent,
}: AssignmentQuizProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [quizAction, setQuizAction] = useState<"take" | "results" | null>(null)
  const [studentHasAttempted, setStudentHasAttempted] = useState(false)

  useEffect(() => {
    if (open) {
      fetchQuizzes()
    }
  }, [open])

  const fetchQuizzes = async () => {
    try {
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .eq("assignment_id", assignmentId)

      setQuizzes(data || [])

      // Check if student has attempted any quiz
      if (!isParent && data && data.length > 0) {
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("*")
          .in("quiz_id", data.map((q: any) => q.id))
          .eq("student_id", profile?.id)

        setStudentHasAttempted((attempts?.length || 0) > 0)
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

  const handleQuizCreated = (quizId: string) => {
    fetchQuizzes()
    toast({
      title: "Quiz Created!",
      description: "Your quiz has been published successfully.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-yellow-500 gap-2"
          title="Add Quiz"
        >
          <Zap className="h-4 w-4 text-yellow-500" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Assignment Quizzes
          </DialogTitle>
          <DialogDescription>
            {isParent
              ? "Create and manage Kahoot-style quizzes for this assignment"
              : "Take the quiz for this assignment"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading quizzes...</span>
          </div>
        ) : quizzes.length === 0 && isParent ? (
          <div className="text-center py-8 space-y-4">
            <Zap className="h-12 w-12 mx-auto text-yellow-500/30" />
            <div>
              <p className="font-bold text-sm">No quizzes yet</p>
              <p className="text-xs text-muted-foreground">
                Create interactive Kahoot-style quizzes for your students
              </p>
            </div>
            <QuizCreator
              assignmentId={assignmentId}
              onQuizCreated={handleQuizCreated}
              supabase={supabase}
              profile={profile}
              familyId={familyId}
            />
          </div>
        ) : quizzes.length === 0 && !isParent ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No quizzes available yet
            </p>
          </div>
        ) : (
          <Tabs defaultValue="quizzes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              {isParent && <TabsTrigger value="create">Create New</TabsTrigger>}
            </TabsList>

            <TabsContent value="quizzes" className="space-y-4">
              {selectedQuiz && quizAction === "take" && !isParent ? (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedQuiz(null)
                      setQuizAction(null)
                    }}
                  >
                    ← Back to Quizzes
                  </Button>
                  <QuizDisplay
                    quizId={selectedQuiz.id}
                    supabase={supabase}
                    profile={profile}
                    onComplete={() => {
                      setSelectedQuiz(null)
                      setQuizAction(null)
                      fetchQuizzes()
                    }}
                  />
                </div>
              ) : selectedQuiz && (quizAction === "results" || isParent) ? (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedQuiz(null)
                      setQuizAction(null)
                    }}
                  >
                    ← Back to Quizzes
                  </Button>
                  <QuizResults
                    quizId={selectedQuiz.id}
                    supabase={supabase}
                    profile={profile}
                    familyId={familyId}
                    isParent={isParent}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <Card key={quiz.id} className="rounded-lg">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm mb-1">
                              {quiz.title}
                            </h3>
                            {quiz.description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {quiz.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                By {quiz.created_by}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(quiz.created_at).toLocaleDateString()}
                              </span>
                              {quiz.max_attempts && (
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                  Max {quiz.max_attempts} attempt{quiz.max_attempts !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {quiz.assigned_to && quiz.assigned_to.length > 0 && (
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                  Assigned only
                                </Badge>
                              )}
                            </div>
                          </div>
                          {isParent ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedQuiz(quiz)
                                setQuizAction("results")
                              }}
                              className="gap-2"
                            >
                              <BarChart3 className="h-4 w-4" />
                              Results
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedQuiz(quiz)
                                  setQuizAction("results")
                                }}
                                className="gap-2"
                              >
                                <BarChart3 className="h-4 w-4" />
                                Results
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedQuiz(quiz)
                                  setQuizAction("take")
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 gap-2"
                              >
                                <Zap className="h-4 w-4" />
                                Take Quiz
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {isParent && (
              <TabsContent value="create" className="space-y-4">
                <QuizCreator
                  assignmentId={assignmentId}
                  onQuizCreated={handleQuizCreated}
                  supabase={supabase}
                  profile={profile}
                  familyId={familyId}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { BarChart3 } from "lucide-react"
