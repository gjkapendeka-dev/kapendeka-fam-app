"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser, useSupabase, useCollection } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Plus, Play, Trophy, ChevronRight, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TournamentPage() {
  const router = useRouter()
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [view, setView] = React.useState<"list" | "create">("list")
  const [creating, setCreating] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [selectedQuizIds, setSelectedQuizIds] = React.useState<string[]>([])

  // Fetch published quizzes for selection
  const quizzesQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("quizzes").select("id, title, quiz_questions(id)").eq("family_id", profile.familyId).eq("is_draft", false).order("created_at", { ascending: false })
  }, [supabase, profile?.familyId])
  const { data: publishedQuizzes } = useCollection(quizzesQuery)

  // Fetch tournaments
  const tournamentsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("tournaments").select("*").eq("family_id", profile.familyId).order("created_at", { ascending: false })
  }, [supabase, profile?.familyId])
  const { data: tournaments, loading: tournamentsLoading, refresh } = useCollection(tournamentsQuery)

  const handleCreateTournament = async () => {
    if (!newTitle.trim()) { toast({ title: "Enter a tournament title", variant: "destructive" }); return }
    if (selectedQuizIds.length < 2) { toast({ title: "Select at least 2 quizzes", variant: "destructive" }); return }
    setCreating(true)
    try {
      const { error } = await supabase.from("tournaments").insert({
        family_id: profile?.familyId,
        title: newTitle.trim(),
        quiz_ids: selectedQuizIds,
        status: "waiting",
        created_by: profile?.id,
        current_quiz_index: 0,
      })
      if (error) throw error
      toast({ title: "Tournament created!", description: `\"${newTitle}\" is ready to go.` })
      setNewTitle(""); setSelectedQuizIds([]); setView("list"); refresh()
    } catch (e: any) {
      toast({ title: "Failed to create", description: e.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleStartRound = async (tournament: any) => {
    if (!profile) return
    const quizIds: string[] = tournament.quiz_ids || []
    const idx = tournament.current_quiz_index || 0
    if (idx >= quizIds.length) {
      toast({ title: "Tournament complete!", description: "All rounds have been played." })
      return
    }
    const quizId = quizIds[idx]
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString()
      const { data, error } = await supabase.from("quiz_sessions").insert({
        quiz_id: quizId,
        host_id: profile.id,
        join_pin: pin,
        require_pin: true,
        status: "waiting",
        family_id: profile.familyId,
      }).select().single()
      if (error) throw error

      // Advance the tournament round counter
      await supabase.from("tournaments").update({
        status: "active",
        current_quiz_index: idx + 1,
      }).eq("id", tournament.id)

      router.push(`/games/host/${data.id}`)
    } catch (e: any) {
      toast({ title: "Failed to start round", description: e.message, variant: "destructive" })
    }
  }

  const toggleQuiz = (id: string) => {
    setSelectedQuizIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const getQuizTitle = (id: string) => {
    return (publishedQuizzes || []).find((q: any) => q.id === id)?.title || id
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => view === "create" ? setView("list") : router.push("/games")} className="h-10 w-10 bg-white rounded-full shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-amber-700">
            {view === "create" ? "Create Tournament" : "🏆 Tournaments"}
          </h1>
          <p className="text-muted-foreground font-medium">Chain multiple quizzes into one epic event</p>
        </div>
        {view === "list" && profile?.role === "parent" && (
          <Button className="font-black bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20" onClick={() => setView("create")}>
            <Plus className="h-4 w-4 mr-2" /> New Tournament
          </Button>
        )}
      </div>

      {/* Create View */}
      {view === "create" && (
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-2 border-amber-100 shadow-none">
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-bold text-sm">Tournament Name</Label>
                <Input
                  placeholder="e.g. Family Science Championship"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="mt-1 h-12 text-base font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-2 border-amber-100 shadow-none">
            <CardHeader>
              <CardTitle>Select Quizzes (min. 2, played in order)</CardTitle>
              <CardDescription>{selectedQuizIds.length} selected</CardDescription>
            </CardHeader>
            <CardContent>
              {(!publishedQuizzes || publishedQuizzes.length === 0) ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No published quizzes found. Publish some quizzes first!</p>
              ) : (
                <div className="space-y-2">
                  {(publishedQuizzes || []).map((quiz: any) => {
                    const selected = selectedQuizIds.includes(quiz.id)
                    const order = selectedQuizIds.indexOf(quiz.id)
                    return (
                      <button
                        key={quiz.id}
                        onClick={() => toggleQuiz(quiz.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          selected ? "border-amber-400 bg-amber-50" : "border-slate-100 hover:border-amber-200 hover:bg-amber-50/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          selected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
                        }`}>
                          {selected ? order + 1 : <Check className="h-4 w-4 opacity-0" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 truncate">{quiz.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{quiz.quiz_questions?.length || 0} questions</p>
                        </div>
                        {selected && <Badge className="bg-amber-100 text-amber-800 border-none font-bold">Round {order + 1}</Badge>}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full h-14 text-lg font-black bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-500/20"
            onClick={handleCreateTournament}
            disabled={creating || selectedQuizIds.length < 2 || !newTitle.trim()}
          >
            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Tournament 🏆</>}
          </Button>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-4">
          {tournamentsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-amber-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="font-bold uppercase tracking-widest text-xs">Loading Tournaments...</span>
            </div>
          ) : tournaments && tournaments.length > 0 ? (
            (tournaments as any[]).map((t) => {
              const quizIds: string[] = t.quiz_ids || []
              const idx = t.current_quiz_index || 0
              const isComplete = idx >= quizIds.length
              const progress = quizIds.length > 0 ? (idx / quizIds.length) * 100 : 0

              return (
                <Card key={t.id} className="rounded-[2rem] border-2 border-amber-100 shadow-none hover:border-amber-300 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl font-black text-slate-800">{t.title}</CardTitle>
                        <CardDescription className="font-medium mt-1">
                          {quizIds.length} rounds •{" "}
                          {isComplete ? (
                            <span className="text-emerald-600 font-bold">✅ Complete</span>
                          ) : (
                            <span className="text-amber-600 font-bold">Round {idx + 1} of {quizIds.length}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={`font-black text-xs uppercase tracking-wider border-none ${
                        isComplete ? "bg-emerald-100 text-emerald-800" :
                        t.status === "active" ? "bg-amber-100 text-amber-800" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {isComplete ? "Finished" : t.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Progress</span>
                        <span>{idx}/{quizIds.length} rounds</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    {/* Round list */}
                    <div className="flex flex-col gap-1.5">
                      {quizIds.map((qid, i) => (
                        <div key={qid} className={`flex items-center gap-3 text-sm font-bold rounded-xl p-2.5 ${
                          i < idx ? "bg-emerald-50 text-emerald-700" :
                          i === idx ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "text-slate-400"
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            i < idx ? "bg-emerald-500 text-white" :
                            i === idx ? "bg-amber-500 text-white" :
                            "bg-slate-200 text-slate-500"
                          }`}>
                            {i < idx ? "✓" : i + 1}
                          </div>
                          <span className="truncate">{getQuizTitle(qid)}</span>
                          {i === idx && <Badge className="ml-auto bg-amber-400 text-white border-none text-xs font-black">Next</Badge>}
                        </div>
                      ))}
                    </div>

                    {!isComplete && profile?.role === "parent" && (
                      <Button
                        className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                        onClick={() => handleStartRound(t)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Round {idx + 1}: {getQuizTitle(quizIds[idx])}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-5 border-2 border-dashed border-amber-200 rounded-[3rem] bg-amber-50/50">
              <div className="text-5xl">🏆</div>
              <div className="text-center">
                <h3 className="text-xl font-black text-amber-900">No Tournaments Yet</h3>
                <p className="text-amber-700/70 font-medium max-w-xs mt-1">Create your first tournament to chain multiple quizzes together!</p>
              </div>
              {profile?.role === "parent" && (
                <Button className="font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl" onClick={() => setView("create")}>
                  <Plus className="h-4 w-4 mr-2" /> Create First Tournament
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
