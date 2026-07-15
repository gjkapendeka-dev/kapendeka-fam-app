"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase, useUser } from "@/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Play, Lock, Unlock, X, ChevronRight, ArrowLeft, MonitorSmartphone, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import confetti from "canvas-confetti"

export default function HostGamePage() {
  const { id: sessionId } = useParams()
  const router = useRouter()
  const supabase = useSupabase()
  const { profile } = useUser()
  const { toast } = useToast()

  const [session, setSession] = React.useState<any>(null)
  const [quiz, setQuiz] = React.useState<any>(null)
  const [questions, setQuestions] = React.useState<any[]>([])
  const [players, setPlayers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  
  // Live answers
  const [answersThisRound, setAnswersThisRound] = React.useState<any[]>([])
  
  // Lobby YouTube Player
  const [youtubeUrl, setYoutubeUrl] = React.useState("")
  const [youtubeId, setYoutubeId] = React.useState("")
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null)
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [showScoreboard, setShowScoreboard] = React.useState(false)

  // Fast answers tracking (for "1st to answer")
  const [fastestPlayerId, setFastestPlayerId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (session?.lobby_music_url) {
      const match = session.lobby_music_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      if (match) setYoutubeId(match[1]);
      else setYoutubeId("");
    } else {
      setYoutubeId("");
    }
  }, [session?.lobby_music_url])

  // ─── INITIAL FETCH ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!supabase || !sessionId) return
    fetchInitialData()
  }, [supabase, sessionId])

  const fetchInitialData = async () => {
    try {
      const { data: sessionData, error: sErr } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("id", sessionId)
        .single()
      
      if (sErr) throw sErr

      setSession(sessionData)

      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", sessionData.quiz_id)
        .single()
      setQuiz(quizData)

      const { data: qData } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", sessionData.quiz_id)
        .order("question_number")
      setQuestions(qData || [])

      const { data: pData } = await supabase
        .from("quiz_session_players")
        .select("*")
        .eq("session_id", sessionId)
      setPlayers(pData || [])

    } catch (e: any) {
      toast({ title: "Error loading session", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // ─── REALTIME SYNC ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!supabase || !sessionId || !session) return

    const channel = supabase.channel(`quiz_session_${sessionId}`)

    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_session_players', filter: `session_id=eq.${sessionId}` }, (payload) => {
      setPlayers(prev => {
         if (prev.find(p => p.id === payload.new.id)) return prev
         return [...prev, payload.new]
      })
    })

    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_session_players', filter: `session_id=eq.${sessionId}` }, (payload) => {
      setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
    })

    channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'quiz_session_players', filter: `session_id=eq.${sessionId}` }, (payload) => {
      setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
    })

    channel.on('broadcast', { event: 'submit_answer' }, (payload) => {
      setAnswersThisRound(prev => {
        if (prev.find(a => a.student_id === payload.payload.student_id)) return prev
        const updated = [...prev, payload.payload]
        // If this is the very first correct answer in this round, mark them
        return updated
      })
    })

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, sessionId, session])

  // ─── LOBBY POLLING FALLBACK ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (!supabase || !sessionId || !session || session.status !== 'waiting') return
    const iv = setInterval(async () => {
      const { data } = await supabase.from('quiz_session_players').select('*').eq('session_id', sessionId)
      if (data) {
        // Quick diff check to avoid unnecessary re-renders
        if (JSON.stringify(data.map(p => p.id).sort()) !== JSON.stringify(players.map(p => p.id).sort())) {
            setPlayers(data)
        }
      }
    }, 2000)
    return () => clearInterval(iv)
  }, [supabase, sessionId, session?.status, players])

  // ─── FULLSCREEN ─────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // ─── TIMER LOGIC ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (session?.status !== "active" || session?.current_question_index < 0 || showAnswer || showScoreboard) {
      setTimeRemaining(null)
      return
    }

    const currentQ = questions[session.current_question_index]
    if (!currentQ || currentQ.question_type === "slide") {
      setTimeRemaining(null)
      return
    }

    const limit = currentQ.time_limit || quiz?.question_timer || 30
    setTimeRemaining(limit)

    const iv = setInterval(() => {
      setTimeRemaining(t => {
        if (t === null) return null
        if (t <= 1) {
          clearInterval(iv)
          handleTimeUp()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(iv)
  }, [session?.current_question_index, session?.status, showAnswer, showScoreboard, questions])

  React.useEffect(() => {
    if (session?.status === "active" && !showAnswer && !showScoreboard && players.length > 0 && answersThisRound.length >= players.length) {
      handleTimeUp()
    }
  }, [answersThisRound.length, players.length, session?.status, showAnswer, showScoreboard])

  // ─── ACTIONS ──────────────────────────────────────────────────────────────
  const updateSessionState = async (updates: any) => {
    try {
      await supabase.from("quiz_sessions").update(updates).eq("id", sessionId)
      setSession({ ...session, ...updates })
      
      supabase.channel(`quiz_session_${sessionId}`).send({
        type: 'broadcast',
        event: 'host_state_update',
        payload: { ...session, ...updates }
      })
    } catch (e: any) {
      toast({ title: "Failed to update state", description: e.message, variant: "destructive" })
    }
  }

  const handleStartGame = () => {
    updateSessionState({ status: "active", current_question_index: 0 })
    setAnswersThisRound([])
    setShowAnswer(false)
    setShowScoreboard(false)
  }

  const handleNextAction = () => {
    if (showAnswer) {
      // Transition to scoreboard
      setShowScoreboard(true)
      setShowAnswer(false)
    } else if (showScoreboard) {
      // Transition to next question
      const nextIdx = session.current_question_index + 1
      if (nextIdx >= questions.length) {
        updateSessionState({ status: "finished" })
        triggerFinalConfetti()
      } else {
        updateSessionState({ current_question_index: nextIdx })
        setAnswersThisRound([])
        setShowScoreboard(false)
        setFastestPlayerId(null)
      }
    } else if (questions[session.current_question_index]?.question_type === "slide") {
        // From slide, go directly to next question
        const nextIdx = session.current_question_index + 1
        if (nextIdx >= questions.length) {
            updateSessionState({ status: "finished" })
            triggerFinalConfetti()
        } else {
            updateSessionState({ current_question_index: nextIdx })
            setAnswersThisRound([])
        }
    }
  }

  const triggerFinalConfetti = () => {
    const end = Date.now() + 3 * 1000;
    const colors = ['#bb0000', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  const handleTimeUp = () => {
    setShowAnswer(true)
    
    const currentQ = questions[session.current_question_index]
    if (!currentQ || ["poll", "word_cloud", "open_ended", "brainstorm", "slide"].includes(currentQ.question_type)) return

    let firstCorrectAns: any = null;

    answersThisRound.forEach(async (ans) => {
      let isCorrect = false
      if (currentQ.question_type === "multiple_choice" || currentQ.question_type === "true_false") {
        isCorrect = ans.answer?.trim().toLowerCase() === currentQ.correct_answer?.trim().toLowerCase()
      } else if (currentQ.question_type === "puzzle") {
        const correctOrder = currentQ.correct_answer || (currentQ.items || []).join("|||")
        isCorrect = ans.answer === correctOrder
      } else if (currentQ.question_type === "slider") {
        const cv = currentQ.correct_value ?? parseFloat(currentQ.correct_answer || "0")
        isCorrect = Math.abs(parseFloat(ans.answer) - cv) <= 1
      }
      
      if (isCorrect) {
        // Track the fastest correct answer
        if (!firstCorrectAns || ans.timeSpent < firstCorrectAns.timeSpent) {
          firstCorrectAns = ans;
        }

        // Calculate speed bonus (Kahoot style)
        // 50% base points for correct, up to 50% more based on speed
        const timeLimit = currentQ.time_limit || quiz?.question_timer || 30
        const timeLeft = Math.max(0, timeLimit - (ans.timeSpent || timeLimit))
        
        let earned = 0;
        if (quiz?.time_bonus_enabled !== false) {
           const timeRatio = timeLeft / timeLimit;
           // Max points = base * 2 if double points
           const maxPoints = currentQ.points * (currentQ.is_double_points ? 2 : 1)
           earned = Math.round((maxPoints / 2) + ((maxPoints / 2) * timeRatio));
        } else {
           earned = currentQ.points * (currentQ.is_double_points ? 2 : 1);
        }

        const player = players.find(p => p.student_id === ans.student_id)
        if (player) {
          const newScore = player.score + earned
          // Also track streak logic in a real app, omitted for brevity here
          await supabase.from("quiz_session_players").update({ score: newScore }).eq("id", player.id)
        }
      }
    })

    if (firstCorrectAns) {
       setFastestPlayerId(firstCorrectAns.student_id);
    }
  }

  const handleEndSession = async () => {
    try {
      await supabase.from("quiz_sessions").update({ status: "finished" }).eq("id", sessionId)
      router.push("/games")
    } catch (e: any) {
      toast({ title: "Failed to end session", description: e.message, variant: "destructive" })
    }
  }

  const handleKickPlayer = async (playerId: string) => {
    try {
      await supabase.from("quiz_session_players").delete().eq("id", playerId)
    } catch (e: any) {
      toast({ title: "Failed to kick player", description: e.message, variant: "destructive" })
    }
  }

  const handleToggleDeviceQuestions = () => {
    updateSessionState({ show_questions_on_devices: !session.show_questions_on_devices })
  }

  // ─── RENDERERS ────────────────────────────────────────────────────────────

  const THEME_BG: Record<string, string> = {
    indigo:   "bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950",
    crimson:  "bg-gradient-to-br from-red-600 via-rose-700 to-red-950",
    emerald:  "bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-900",
    sunset:   "bg-gradient-to-br from-orange-500 via-pink-600 to-rose-800",
    midnight: "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950",
    ocean:    "bg-gradient-to-br from-cyan-600 via-blue-700 to-blue-900",
  }
  const themeBg = THEME_BG[quiz?.theme || "indigo"] || THEME_BG.indigo

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  if (!session) return <div>Session not found</div>

  // LOBBY
  if (session.status === "waiting") {
    return (
      <div className={`min-h-screen ${themeBg} flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-3 bg-black/30">
          <div className="flex items-center gap-4">
            <Link href="/games" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-bold transition-colors group">
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> K-Games
            </Link>
          </div>
          <button onClick={toggleFullscreen} className="text-white/40 hover:text-white text-sm font-medium transition-colors">
            {isFullscreen ? "Exit Fullscreen ✕" : "⛶ Fullscreen"}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
          <h1 className="text-4xl font-black text-white mb-2">{quiz?.title}</h1>
          
          <Card className="max-w-2xl w-full mx-auto bg-white/10 border-none shadow-2xl backdrop-blur-md">
            <CardContent className="p-12 space-y-8">
              {session.require_pin ? (
                <div className="space-y-4">
                  <p className="text-xl font-medium text-white/80">Join at <strong className="text-white">kapendeka.co.za/games/join</strong> with PIN:</p>
                  <div className="text-8xl font-black text-white tracking-widest bg-black/20 py-6 rounded-3xl border-4 border-white/10">
                    {session.join_pin}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-2xl font-medium text-white/80">Join from your Dashboard!</p>
                </div>
              )}

              {youtubeId && (
                <div className="w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&loop=1&playlist=${youtubeId}`}
                    title="Lobby Music"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              )}
              
                <div className="pt-8 border-t border-white/10">
                  <div className="flex flex-col gap-6 mb-8">
                    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/10">
                      <Input
                        placeholder="Paste YouTube Link for Lobby Music..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="bg-white/10 border-none text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-white/20"
                      />
                      <Button 
                        variant="secondary" 
                        className="bg-white text-black hover:bg-white/90 rounded-xl px-8 font-bold"
                        onClick={() => updateSessionState({ lobby_music_url: youtubeUrl })}
                      >Play</Button>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="h-6 w-6" /> Players ({players.length})
                      </h2>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
                          <Switch id="team-mode" checked={session.team_mode || false} onCheckedChange={(c) => updateSessionState({ team_mode: c })} />
                          <Label htmlFor="team-mode" className="text-white font-bold cursor-pointer text-sm">Team Mode</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="open-mode" checked={!session.is_locked} onCheckedChange={(c) => updateSessionState({ is_locked: !c })} />
                          <Label htmlFor="open-mode" className="text-white font-bold cursor-pointer text-sm">{session.is_locked ? 'Locked' : 'Open'}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="device-q" checked={session.show_questions_on_devices} onCheckedChange={handleToggleDeviceQuestions} />
                          <Label htmlFor="device-q" className="text-white font-bold cursor-pointer flex items-center gap-1 text-sm">
                            <MonitorSmartphone className="h-4 w-4" /> Show Q&A
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                
                {players.length === 0 ? (
                  <div className="py-12 text-white/40 font-medium text-lg animate-pulse">Waiting for players...</div>
                ) : (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {players.map(p => (
                      <div key={p.id} className={`bg-white text-slate-900 border-2 font-bold pr-2 pl-2 py-2 rounded-full text-xl shadow-lg animate-in zoom-in flex items-center gap-3 relative group`}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.student_name} className="w-10 h-10 rounded-full bg-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm">{p.student_name.charAt(0).toUpperCase()}</div>
                        )}
                        <span className="pr-4">{p.student_name}</span>
                        <button onClick={() => handleKickPlayer(p.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="h-16 px-12 text-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl" disabled={players.length === 0} onClick={handleStartGame}>
            Start Game <Play className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    )
  }

  // FINAL SCOREBOARD (FINISHED)
  if (session.status === "finished") {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    const podiumHeights = ["h-full", "h-3/4", "h-2/4"]
    const podiumColors = ["bg-yellow-400", "bg-slate-300", "bg-amber-600"]

    return (
      <div className={`min-h-screen ${themeBg} p-8 flex flex-col items-center justify-center`}>
        <h1 className="text-5xl font-black text-white mb-12 drop-shadow-lg">Final Podium</h1>

        <div className="flex items-end justify-center gap-4 h-96 w-full max-w-4xl animate-in slide-in-from-bottom-32 duration-1000">
          {sortedPlayers.slice(0, 3).map((p, i) => {
            const orderIndex = i === 0 ? 1 : i === 1 ? 0 : 2
            return (
              <div key={p.id} className={`flex flex-col items-center justify-end w-1/3 order-${orderIndex}`}>
                <div className="text-center mb-4 animate-in fade-in zoom-in duration-1000 delay-500">
                  <div className="text-2xl font-black text-white truncate w-48 drop-shadow-md">{p.student_name}</div>
                  <Badge variant="outline" className="text-white border-white/20 mt-2 bg-black/40 text-lg">{p.score} pts</Badge>
                </div>
                <div className={`w-full ${podiumHeights[i]} ${podiumColors[i]} rounded-t-xl shadow-2xl flex items-start justify-center pt-6 relative overflow-hidden transition-all duration-1000 transform origin-bottom hover:scale-105`}>
                  <div className="absolute inset-0 bg-white/20"></div>
                  <span className="text-6xl font-black text-black/40 drop-shadow-sm">{i + 1}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex items-center justify-center gap-4">
          <Button size="lg" variant="outline" className="text-white border-white/20 bg-white/10 hover:bg-white/20" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </div>
    )
  }

  // INTERMEDIATE SCOREBOARD
  if (showScoreboard) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 5)
    return (
      <div className={`min-h-screen ${themeBg} p-8 flex flex-col items-center justify-center`}>
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h2 className="text-5xl font-black text-white mb-12 drop-shadow-lg">Scoreboard</h2>
          
          <div className="w-full space-y-4">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center shadow-xl animate-in slide-in-from-right" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="text-3xl font-black text-slate-400 w-16 text-center">{i + 1}</span>
                <span className="text-2xl font-bold text-slate-800 flex-1 truncate">{p.student_name}</span>
                {fastestPlayerId === p.student_id && (
                   <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mr-4">
                     🔥 Fastest
                   </span>
                )}
                <span className="text-2xl font-black text-indigo-600">{p.score}</span>
              </div>
            ))}
          </div>

          <Button size="lg" onClick={handleNextAction} className="mt-12 bg-white text-slate-900 hover:bg-slate-100 font-bold px-12 h-14 rounded-full text-xl shadow-2xl">
            Next <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    )
  }

  // ACTIVE QUESTION OR ANSWER REVEAL
  const currentQ = questions[session.current_question_index]
  if (!currentQ) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  const isMC = currentQ.question_type === "multiple_choice" || currentQ.question_type === "poll"
  const isTF = currentQ.question_type === "true_false"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-black text-slate-800 text-xl tracking-tight">K-Games</span>
          <Badge variant="secondary" className="text-sm px-3 py-1 font-bold">Question {session.current_question_index + 1} of {questions.length}</Badge>
          {currentQ.is_double_points && (
             <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-black uppercase tracking-widest">Double Points</Badge>
          )}
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            <span className="font-bold text-slate-600 text-lg">{answersThisRound.length} Answers</span>
          </div>
          {timeRemaining !== null && !showAnswer && (
             <div className={`font-black text-3xl tabular-nums ${timeRemaining <= 5 ? "text-red-600" : "text-slate-800"}`}>
               {timeRemaining}
             </div>
          )}
        </div>
      </header>

      {/* Main Content Area (Question + Image) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-6xl mx-auto text-center gap-6">
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-md w-full border-t-8 border-indigo-600">
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
             {currentQ.question_text}
           </h2>
        </div>

        {currentQ.youtube_video_id ? (
          <div className="w-full max-w-3xl aspect-video rounded-xl shadow-xl overflow-hidden bg-black shrink-0 relative">
            {!showAnswer ? (
                <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${currentQ.youtube_video_id}?autoplay=1&controls=0`} 
                title="YouTube video" 
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                allowFullScreen
                ></iframe>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white/50 font-bold">Video Hidden</div>
            )}
          </div>
        ) : currentQ.question_image_url ? (
          <img src={currentQ.question_image_url} alt="Question" className="max-h-64 object-contain rounded-xl shadow-lg shrink-0" />
        ) : null}
        
        {/* KAHOOT STYLE ANSWER GRID */}
        {(isMC || isTF) && (
           <div className={`w-full grid gap-4 mt-auto pb-4 ${isTF ? 'grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-2 md:grid-cols-2'}`}>
              {(currentQ.options || (isTF ? [{text:"True", id:"true"}, {text:"False", id:"false"}] : [])).map((opt: any, i: number) => {
                 const bgColors = ["bg-red-600", "bg-blue-600", "bg-amber-500", "bg-emerald-600", "bg-purple-600", "bg-cyan-600"]
                 const shapes = ["▲", "◆", "●", "■", "★", "♥"]
                 
                 // Determine if this is the correct answer
                 let isCorrect = false;
                 if (isMC && currentQ.question_type !== "poll") {
                    isCorrect = currentQ.correct_answer?.split(",").includes(opt.id) || currentQ.correct_answer === String(i);
                 } else if (isTF) {
                    isCorrect = currentQ.correct_answer === opt.id;
                 }
                 
                 // Count how many people picked this answer
                 const answerCount = answersThisRound.filter(a => {
                     if (isTF) return a.answer === opt.id;
                     return a.answer === opt.text;
                 }).length;

                 // Logic for Answer Reveal styling
                 const isDimmed = showAnswer && !isCorrect && currentQ.question_type !== "poll";
                 const isRevealedCorrect = showAnswer && isCorrect;

                 return (
                   <div 
                     key={opt.id || i}
                     className={`relative flex items-center p-4 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] min-h-[100px] transition-all duration-500
                       ${bgColors[i % bgColors.length]} 
                       ${isDimmed ? 'opacity-30 grayscale saturate-0' : 'opacity-100'}
                     `}
                   >
                     {/* Shape Icon */}
                     <div className="w-16 h-16 flex items-center justify-center shrink-0">
                       <span className="text-white text-5xl opacity-90 drop-shadow-md">{shapes[i % shapes.length]}</span>
                     </div>
                     {/* Answer Text */}
                     <div className="flex-1 px-4 text-left">
                       <span className="text-white font-bold text-2xl md:text-3xl break-words leading-tight drop-shadow-sm">
                         {opt.text}
                       </span>
                     </div>
                     
                     {/* Reveal States */}
                     {isRevealedCorrect && (
                        <div className="absolute top-2 right-2 bg-white/20 rounded-full p-1 animate-in zoom-in bounce">
                           <CheckCircle className="text-white w-8 h-8 drop-shadow-md" />
                        </div>
                     )}
                     
                     {showAnswer && (
                         <div className="absolute bottom-2 right-4 text-white/90 font-black text-2xl drop-shadow-md">
                           {answerCount} <Users className="inline h-5 w-5 opacity-70 ml-1" />
                         </div>
                     )}
                   </div>
                 )
              })}
           </div>
        )}
        
        {/* NON-MC QUESTIONS REVEAL */}
        {showAnswer && !isMC && !isTF && currentQ.question_type !== "slide" && (
           <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 animate-in slide-in-from-bottom-8">
              <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-4">Correct Answer</h3>
              <div className="text-4xl font-black text-emerald-600">{currentQ.correct_answer || currentQ.correct_value}</div>
              
              <div className="mt-8 flex flex-wrap gap-2 justify-center">
                 {answersThisRound.map((a, i) => (
                    <span key={i} className="bg-slate-100 border text-slate-800 font-bold px-4 py-2 rounded-lg text-lg">
                      {a.answer}
                    </span>
                 ))}
              </div>
           </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="bg-white border-t p-4 flex justify-between items-center z-10 shrink-0">
        <div className="text-slate-400 font-bold tracking-widest uppercase text-xs">
          Kapendeka Live
        </div>
        <div className="flex gap-4">
          {!showAnswer && currentQ.question_type !== "slide" && (
            <Button size="lg" variant="secondary" onClick={handleTimeUp} className="font-bold">
              Skip Timer
            </Button>
          )}
          
          {(showAnswer || currentQ.question_type === "slide") && (
            <Button size="lg" onClick={handleNextAction} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-12 rounded-full shadow-lg hover:shadow-xl transition-all">
              Next <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
