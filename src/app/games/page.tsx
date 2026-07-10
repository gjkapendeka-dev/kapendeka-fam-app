"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser, useSupabase, useCollection } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Zap, Play, Plus, Clock, Users, Trophy, Copy, Edit, FileText, Download, Upload, BarChart2, BookOpen } from "lucide-react"
import { QuizCreator } from "@/components/quiz-creator"
import { useToast } from "@/hooks/use-toast"

export default function GamesHubPage() {
  const router = useRouter()
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [hostingState, setHostingState] = React.useState<Record<string, boolean>>({})
  const [duplicatingId, setDuplicatingId] = React.useState<string | null>(null)
  const [editingQuizId, setEditingQuizId] = React.useState<string | null>(null)
  const importInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch all quizzes for this family
  const quizzesQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("quizzes").select("*, quiz_questions(*)").eq("family_id", profile.familyId).order("created_at", { ascending: false })
  }, [supabase, profile?.familyId])
  
  const { data: quizzes, loading: quizzesLoading, refresh } = useCollection(quizzesQuery)

  const sessionsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("quiz_sessions").select("*, quizzes(title)").eq("family_id", profile.familyId).eq("status", "finished").order("created_at", { ascending: false })
  }, [supabase, profile?.familyId])
  const { data: sessions, loading: sessionsLoading } = useCollection(sessionsQuery)

  const publishedQuizzes = (quizzes || []).filter((q: any) => !q.is_draft)
  const draftQuizzes = (quizzes || []).filter((q: any) => q.is_draft)

  const handleHostGame = async (quizId: string) => {
    if (!profile) return
    setHostingState(prev => ({ ...prev, [quizId]: true }))
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString()
      
      const { data, error } = await supabase.from("quiz_sessions").insert({
        quiz_id: quizId,
        host_id: profile.id,
        join_pin: pin,
        require_pin: true,
        status: "waiting",
        family_id: profile.familyId
      }).select().single()

      if (error) throw error

      window.open(`/games/host/${data.id}`, "_blank")
    } catch (e: any) {
      toast({ title: "Failed to host game", description: e.message, variant: "destructive" })
      setHostingState(prev => ({ ...prev, [quizId]: false }))
    }
  }

  const handleDuplicate = async (quiz: any) => {
    if (!profile) return
    setDuplicatingId(quiz.id)
    try {
      // Create new quiz
      const { data: newQuiz, error: err1 } = await supabase.from("quizzes").insert({
        ...quiz,
        id: undefined,
        created_at: undefined,
        title: `${quiz.title} (Copy)`,
        is_draft: true, // Always duplicate as draft
        quiz_questions: undefined
      }).select().single()
      if (err1) throw err1

      // Duplicate questions
      const questionsToInsert = (quiz.quiz_questions || []).map((q: any) => ({
        ...q,
        id: undefined,
        quiz_id: newQuiz.id,
        created_at: undefined
      }))

      if (questionsToInsert.length > 0) {
        const { error: err2 } = await supabase.from("quiz_questions").insert(questionsToInsert)
        if (err2) throw err2
      }

      toast({ title: "Quiz duplicated!", description: "Check your Drafts tab to edit it." })
      refresh()
    } catch (e: any) {
      toast({ title: "Failed to duplicate", description: e.message, variant: "destructive" })
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleExport = async (quiz: any) => {
    try {
      const { data: questions } = await supabase
        .from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("question_number")
      const exportData = { quiz: { ...quiz, quiz_questions: undefined, id: undefined, family_id: undefined, created_at: undefined }, questions }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `${quiz.title.replace(/\s+/g, "_")}.kapendeka.json`; a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Quiz exported!", description: `${quiz.title}.kapendeka.json downloaded.` })
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" })
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    try {
      const text = await file.text()
      const { quiz, questions } = JSON.parse(text)
      const { data: newQuiz, error: err1 } = await supabase.from("quizzes").insert({
        ...quiz, family_id: profile.familyId, is_draft: true,
        title: `${quiz.title} (Imported)`, created_by: profile.display_name
      }).select().single()
      if (err1) throw err1
      if (questions?.length > 0) {
        const toInsert = questions.map((q: any) => ({ ...q, id: undefined, quiz_id: newQuiz.id, created_at: undefined }))
        const { error: err2 } = await supabase.from("quiz_questions").insert(toInsert)
        if (err2) throw err2
      }
      toast({ title: "Quiz imported!", description: `"${newQuiz.title}" added to your Drafts.` })
      refresh()
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" })
    } finally {
      if (importInputRef.current) importInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-black tracking-tight text-indigo-600">Kapendeka Games</h1>
          <p className="text-muted-foreground font-medium text-lg mt-1">Host live interactive Kahoot-style quizzes</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button size="sm" variant="outline" className="rounded-xl font-bold border-2 text-slate-600" onClick={() => importInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl font-bold border-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50" onClick={() => router.push("/games/progress")}>
            <BarChart2 className="h-4 w-4 mr-1" /> My Progress
          </Button>
          <Button size="lg" variant="secondary" className="rounded-xl font-bold border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50" onClick={() => router.push("/games/join")}>
            Join a Game
          </Button>
          <QuizCreator 
            supabase={supabase} 
            profile={profile} 
            familyId={profile?.familyId || ""} 
            onQuizCreated={() => refresh()} 
            quizId={editingQuizId || undefined}
          />
        </div>
      </header>

      <Tabs defaultValue="published" className="w-full">
        <TabsList className="bg-indigo-50/50 p-1 rounded-2xl mb-6">
          <TabsTrigger value="published" className="rounded-xl font-bold py-2">Published ({publishedQuizzes.length})</TabsTrigger>
          <TabsTrigger value="drafts" className="rounded-xl font-bold py-2">Drafts ({draftQuizzes.length})</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl font-bold py-2">Reports</TabsTrigger>
          <TabsTrigger value="tournaments" className="rounded-xl font-bold py-2">🏆 Tournaments</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzesLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="font-bold uppercase tracking-widest text-xs">Loading Quizzes...</span>
              </div>
            ) : publishedQuizzes.length > 0 ? (
              publishedQuizzes.map((quiz: any) => (
                <Card key={quiz.id} className="rounded-[2rem] border-none shadow-xl shadow-indigo-500/5 group hover:shadow-indigo-500/20 transition-all flex flex-col overflow-hidden">
                  <CardHeader className="pb-3 bg-indigo-500/5 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-white font-black tracking-wider text-[10px] uppercase border-indigo-200 text-indigo-600">
                        {quiz.category || "General"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400 hover:text-indigo-600 z-10" onClick={() => handleExport(quiz)} title="Export as JSON">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400 hover:text-indigo-600 z-10" onClick={() => handleDuplicate(quiz)}>
                          {duplicatingId === quiz.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-black leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-2 font-medium">
                      {quiz.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {quiz.question_timer}s</span>
                      <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> {quiz.quiz_questions?.length || 0} Qs</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleHostGame(quiz.id)}
                        disabled={hostingState[quiz.id]}
                        className="flex-1 h-12 rounded-xl font-black text-sm uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                      >
                        {hostingState[quiz.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Play className="h-4 w-4 mr-2" />Host Game</>}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/games/attempt/${quiz.id}`)}
                        className="h-12 px-4 rounded-xl font-black text-sm border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        title="Attempt Solo — play like an assignment"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-indigo-100 rounded-[3rem] bg-indigo-50/50">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/10 mb-2">
                  <Zap className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-indigo-900">No Published Quizzes</h3>
                <p className="text-indigo-600/70 font-medium max-w-sm text-center">
                  Create a new quiz or publish one from your drafts.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {draftQuizzes.map((quiz: any) => (
              <Card key={quiz.id} className="rounded-[2rem] border-2 border-dashed border-slate-200 shadow-none flex flex-col overflow-hidden bg-slate-50/50">
                <CardHeader className="pb-3 relative overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-slate-200 text-slate-500 border-none font-black tracking-wider text-[10px] uppercase">
                      Draft
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-black leading-tight text-slate-700 line-clamp-2">
                    {quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex-1 flex flex-col justify-end">
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> {quiz.quiz_questions?.length || 0} Qs</span>
                  </div>
                  
                  <QuizCreator 
                    supabase={supabase} 
                    profile={profile} 
                    familyId={profile?.familyId || ""} 
                    onQuizCreated={() => refresh()} 
                    quizId={quiz.id}
                    customTrigger={
                      <Button className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-none">
                        <Edit className="h-4 w-4 mr-2" /> Edit Draft
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ))}
            {draftQuizzes.length === 0 && (
               <div className="col-span-full py-12 text-center text-muted-foreground font-medium">No drafts found.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionsLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="font-bold uppercase tracking-widest text-xs">Loading Reports...</span>
              </div>
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session: any) => (
                <Card key={session.id} className="rounded-[2rem] border-none shadow-xl shadow-slate-200 flex flex-col overflow-hidden bg-white hover:shadow-indigo-500/20 transition-all cursor-pointer" onClick={() => router.push(`/games/reports/${session.id}`)}>
                  <CardHeader className="pb-3 bg-slate-50 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none font-black tracking-wider text-[10px] uppercase">
                        Finished
                      </Badge>
                      <span className="text-xs font-bold text-slate-400">{new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="text-xl font-black leading-tight text-slate-800 line-clamp-2">
                      {session.quizzes?.title || "Unknown Quiz"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col justify-end">
                    <Button variant="outline" className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                      <FileText className="h-4 w-4 mr-2" /> View Report
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground font-medium border-2 border-dashed rounded-[3rem] bg-slate-50/50">
                No past sessions found.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tournaments">
          <div className="flex flex-col items-center justify-center py-16 gap-6 border-2 border-dashed border-amber-200 rounded-[3rem] bg-amber-50/50">
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-amber-500/10 text-4xl">🏆</div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-amber-900">Multi-Quiz Tournaments</h3>
              <p className="text-amber-700/70 font-medium max-w-sm mt-2">Chain multiple quizzes into one epic tournament with a cumulative leaderboard.</p>
            </div>
            <Button
              className="h-14 px-8 text-lg font-black bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-500/20"
              onClick={() => router.push("/games/tournament")}
            >
              Manage Tournaments
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
