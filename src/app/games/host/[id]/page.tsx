"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase, useUser } from "@/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, Users, Play, Trophy, CheckCircle, Lock, Unlock, X, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
      // Allow host access — just verify the session belongs to this family
      // (don't block by profile?.id since profiles are PIN-based, not auth-based)

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

    // Listen for new players joining
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_session_players', filter: `session_id=eq.${sessionId}` }, (payload) => {
      setPlayers(prev => [...prev, payload.new])
    })

    // Listen for players updating scores
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_session_players', filter: `session_id=eq.${sessionId}` }, (payload) => {
      setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
    })

    // Listen for answers submitted (broadcast from players)
    channel.on('broadcast', { event: 'submit_answer' }, (payload) => {
      setAnswersThisRound(prev => {
        // Prevent duplicate answers from same student for this round
        if (prev.find(a => a.student_id === payload.payload.student_id)) return prev
        return [...prev, payload.payload]
      })
    })

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, sessionId, session])

  // ─── LOBBY POLLING FALLBACK ─────────────────────────────────────────────────
  // Supabase Realtime postgres_changes may miss upserts. Poll every 2s in lobby.
  React.useEffect(() => {
    if (!supabase || !sessionId || !session || session.status !== 'waiting') return
    const iv = setInterval(async () => {
      const { data } = await supabase.from('quiz_session_players').select('*').eq('session_id', sessionId)
      if (data) setPlayers(data)
    }, 2000)
    return () => clearInterval(iv)
  }, [supabase, sessionId, session?.status])

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
    if (session?.status !== "active" || session?.current_question_index < 0 || showAnswer) {
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
  }, [session?.current_question_index, session?.status, showAnswer, questions])

  // Automatically end round if all players answered
  React.useEffect(() => {
    if (session?.status === "active" && !showAnswer && players.length > 0 && answersThisRound.length >= players.length) {
      handleTimeUp()
    }
  }, [answersThisRound.length, players.length, session?.status, showAnswer])

  // ─── ACTIONS ──────────────────────────────────────────────────────────────
  const updateSessionState = async (updates: any) => {
    try {
      await supabase.from("quiz_sessions").update(updates).eq("id", sessionId)
      setSession({ ...session, ...updates })
      
      // Also broadcast the state change to force fast client sync
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
  }

  const handleNextQuestion = () => {
    const nextIdx = session.current_question_index + 1
    if (nextIdx >= questions.length) {
      updateSessionState({ status: "finished" })
      confetti({ particleCount: 300, spread: 160 })
    } else {
      updateSessionState({ current_question_index: nextIdx })
      setAnswersThisRound([])
      setShowAnswer(false)
    }
  }

  const handleTimeUp = () => {
    setShowAnswer(true)
    // Grade everyone's answers instantly
    const currentQ = questions[session.current_question_index]
    if (!currentQ || ["poll", "word_cloud", "open_ended", "brainstorm", "slide"].includes(currentQ.question_type)) return

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
        // Calculate speed bonus
        const timeLimit = currentQ.time_limit || quiz?.question_timer || 30
        const timeLeft = Math.max(0, timeLimit - (ans.timeSpent || timeLimit))
        const speedBonus = Math.round((timeLeft / timeLimit) * (currentQ.points * 0.5))
        const earned = currentQ.points + speedBonus

        // Update player score
        const player = players.find(p => p.student_id === ans.student_id)
        if (player) {
          const newScore = player.score + earned
          await supabase.from("quiz_session_players").update({ score: newScore }).eq("id", player.id)
        }
      }
    })
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

  const handleToggleLock = async () => {
    try {
      await supabase.from("quiz_sessions").update({ is_locked: !session.is_locked }).eq("id", sessionId)
    } catch (e: any) {
      toast({ title: "Failed to update lock", description: e.message, variant: "destructive" })
    }
  }

  const handleToggleTeamMode = async () => {
    try {
      await supabase.from("quiz_sessions").update({ team_mode: !session.team_mode }).eq("id", sessionId)
    } catch (e: any) {
      toast({ title: "Failed to update team mode", description: e.message, variant: "destructive" })
    }
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
        {/* Top bar with host name + fullscreen */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/30">
          <span className="text-white/60 font-bold text-sm">{profile?.display_name || "Host"} — Kapendeka Live</span>
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
                  <p className="text-lg text-white/60">Or go to <strong className="text-white">kapendeka.co.za/games/join</strong></p>
                </div>
              )}
              
              {/* YouTube Player */}
              <div className="pt-6 border-t border-white/10">
                {!youtubeId ? (
                  <div className="flex gap-2 max-w-sm mx-auto">
                    <Input 
                      placeholder="Paste YouTube Link for Lobby Music..." 
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                    />
                    <Button onClick={() => {
                      const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
                      if (match && match[1]) setYoutubeId(match[1])
                    }} variant="secondary">Play</Button>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden shadow-2xl relative aspect-video w-full max-w-md mx-auto">
                    <iframe 
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0`} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                      className="absolute inset-0 w-full h-full"
                    />
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="absolute top-2 right-2 rounded-full h-8 w-8 p-0" 
                      onClick={() => setYoutubeId("")}
                    >✕</Button>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="h-6 w-6" /> Players ({players.length})
                  </h2>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch id="team-mode" checked={session.team_mode} onCheckedChange={handleToggleTeamMode} />
                      <Label htmlFor="team-mode" className="text-white font-bold cursor-pointer">Team Mode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="lock-game" checked={session.is_locked} onCheckedChange={handleToggleLock} />
                      <Label htmlFor="lock-game" className="text-white font-bold cursor-pointer">
                        {session.is_locked ? <><Lock className="inline h-4 w-4 mr-1" /> Locked</> : <><Unlock className="inline h-4 w-4 mr-1" /> Open</>}
                      </Label>
                    </div>
                  </div>
                </div>
                
                {players.length === 0 ? (
                  <div className="py-12 text-white/40 font-medium text-lg animate-pulse">Waiting for players...</div>
                ) : (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {players.map(p => {
                      const teamColors: Record<string, string> = {
                        "Red": "bg-red-100 text-red-900 border-red-500",
                        "Blue": "bg-blue-100 text-blue-900 border-blue-500",
                        "Green": "bg-green-100 text-green-900 border-green-500",
                        "Yellow": "bg-yellow-100 text-yellow-900 border-yellow-500"
                      }
                      const teamClass = p.team_name ? teamColors[p.team_name] || "bg-white text-slate-900" : "bg-white text-slate-900"
                      
                      return (
                        <div key={p.id} className={`${teamClass} border-2 font-bold pr-2 pl-2 py-2 rounded-full text-xl shadow-lg animate-in zoom-in flex items-center gap-3 relative group`}>
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.student_name} className="w-10 h-10 rounded-full bg-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
                              {p.student_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="pr-4">{p.student_name}</span>
                          <button onClick={() => handleKickPlayer(p.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            className="h-16 px-12 text-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl"
            disabled={players.length === 0}
            onClick={handleStartGame}
          >
            Start Game <Play className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    )
  }

  // LEADERBOARD / FINISHED
  if (session.status === "finished") {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

    // If team mode: aggregate by team
    const isTeamMode = session.team_mode
    const teamColors: Record<string, string> = {
      "Red": "bg-red-500",
      "Blue": "bg-blue-500",
      "Green": "bg-green-500",
      "Yellow": "bg-yellow-400",
    }
    const teamScores = isTeamMode ? Object.entries(
      players.reduce((acc: Record<string, number>, p: any) => {
        const t = p.team_name || "Unknown"
        acc[t] = (acc[t] || 0) + p.score
        return acc
      }, {})
    ).sort(([, a], [, b]) => b - a) : []

    const podiumHeights = ["h-full", "h-3/4", "h-2/4"]
    const podiumColors = ["bg-yellow-400", "bg-slate-300", "bg-amber-600"]

    return (
      <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center">
        <h1 className="text-5xl font-black text-white mb-12">
          {isTeamMode ? "🏆 Team Podium" : "Final Podium"}
        </h1>

        {isTeamMode ? (
          <div className="flex items-end justify-center gap-6 h-96 w-full max-w-4xl">
            {teamScores.slice(0, 3).map(([team, score], i) => {
              const displayOrder = i === 0 ? 1 : i === 1 ? 0 : 2
              const barColor = teamColors[team] || "bg-purple-500"
              return (
                <div key={team} className={`flex flex-col items-center justify-end w-1/3 order-${displayOrder}`}>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-black text-white">{team}</div>
                    <Badge variant="outline" className="text-white border-white/20 mt-2 bg-black/40">{score} pts total</Badge>
                  </div>
                  <div className={`w-full ${podiumHeights[i]} ${barColor} rounded-t-xl shadow-2xl flex items-start justify-center pt-6 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/20"></div>
                    <span className="text-6xl font-black text-black/40">{i + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-end justify-center gap-4 h-96 w-full max-w-4xl">
            {sortedPlayers.slice(0, 3).map((p, i) => {
              const orderIndex = i === 0 ? 1 : i === 1 ? 0 : 2
              return (
                <div key={p.id} className={`flex flex-col items-center justify-end w-1/3 order-${orderIndex}`}>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-black text-white truncate w-48">{p.student_name}</div>
                    <Badge variant="outline" className="text-white border-white/20 mt-2 bg-black/40">{p.score} pts</Badge>
                  </div>
                  <div className={`w-full ${podiumHeights[i]} ${podiumColors[i]} rounded-t-xl shadow-2xl flex items-start justify-center pt-6 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/20"></div>
                    <span className="text-6xl font-black text-black/40">{i + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isTeamMode && (
          <div className="mt-12 w-full max-w-2xl bg-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white/60 uppercase tracking-widest text-center mb-4">Individual Players</h3>
            <div className="space-y-2">
              {sortedPlayers.map((p: any, i: number) => {
                const barC = teamColors[p.team_name] || "bg-purple-500"
                return (
                  <div key={p.id} className="flex items-center gap-3 text-white">
                    <span className="font-black text-slate-400 w-5">#{i+1}</span>
                    <div className={`w-3 h-3 rounded-full ${barC}`}></div>
                    <span className="font-bold flex-1">{p.student_name}</span>
                    <span className="font-black">{p.score} pts</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Button size="lg" variant="outline" className="text-white border-white/20 bg-white/10 hover:bg-white/20" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </div>
    )
  }

  // ACTIVE QUESTION
  const currentQ = questions[session.current_question_index]
  const timeLimit = currentQ.time_limit || quiz?.question_timer || 30
  const timePct = timeLimit > 0 && timeRemaining !== null ? (timeRemaining / timeLimit) * 100 : 100

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm px-3 py-1">Q{session.current_question_index + 1} of {questions.length}</Badge>
          <span className="font-bold text-slate-700">{session.require_pin ? `PIN: ${session.join_pin}` : "Kapendeka Live"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="font-bold">{answersThisRound.length} / {players.length} Answers</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col">
        {/* Question Area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mb-8 max-w-5xl mx-auto w-full">
          {currentQ.question_type !== "slide" && (
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
              {currentQ.question_text}
            </h2>
          )}
          
          {currentQ.youtube_video_id ? (
            <div className="w-full max-w-2xl aspect-video mb-8 rounded-2xl shadow-xl border-4 border-white overflow-hidden bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${currentQ.youtube_video_id}?autoplay=1&controls=0`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          ) : currentQ.question_image_url ? (
            <img src={currentQ.question_image_url} alt="Question" className="max-h-80 w-auto rounded-2xl shadow-xl border-4 border-white mb-8" />
          ) : null}

          {currentQ.question_type === "slide" && (
             <div className="bg-white p-12 rounded-3xl shadow-xl border-4 border-blue-100 min-w-full text-center">
               <span className="text-6xl mb-6 block">📋</span>
               <p className="text-3xl font-medium leading-relaxed whitespace-pre-wrap">{currentQ.slide_content || currentQ.question_text}</p>
             </div>
          )}

          {/* Time & Answers indicator */}
          {!showAnswer && currentQ.question_type !== "slide" && (
            <div className="flex items-center gap-8 mt-4">
              {timeRemaining !== null && (
                <div className="flex flex-col items-center">
                  <div className={`h-24 w-24 rounded-full border-8 flex items-center justify-center ${timeRemaining <= 5 ? "border-red-500 text-red-500 bg-red-50 animate-pulse" : "border-slate-800 text-slate-800 bg-white"}`}>
                    <span className="text-4xl font-black">{timeRemaining}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Word Cloud - visible during question */}
        {!showAnswer && currentQ.question_type === "word_cloud" && answersThisRound.length > 0 && (
          <div className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur rounded-3xl shadow-xl p-6 mb-6 animate-in fade-in">
            <div className="flex flex-wrap gap-3 justify-center items-center min-h-[80px]">
              {(() => {
                const freq: Record<string, number> = {}
                answersThisRound.forEach(a => {
                  const w = (a.answer || "").trim().toLowerCase()
                  if (w) freq[w] = (freq[w] || 0) + 1
                })
                const max = Math.max(...Object.values(freq), 1)
                const colors = ["text-indigo-600", "text-purple-600", "text-blue-600", "text-violet-600", "text-sky-600"]
                return Object.entries(freq).map(([word, count]) => {
                  const size = Math.round(18 + (count / max) * 40)
                  const color = colors[word.charCodeAt(0) % colors.length]
                  return (
                    <span key={word} className={`font-black ${color} transition-all animate-in zoom-in`} style={{ fontSize: `${size}px` }}>
                      {word}
                    </span>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Answers Area */}
        {showAnswer && currentQ.question_type !== "slide" && (
          <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8 animate-in slide-in-from-bottom-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Correct Answer</h3>
            
            {["multiple_choice", "true_false", "short_answer"].includes(currentQ.question_type) && (
              <div className="bg-emerald-50 border-4 border-emerald-500 rounded-2xl p-8 text-center text-emerald-700">
                <span className="text-4xl font-black">{currentQ.correct_answer}</span>
              </div>
            )}

            {currentQ.question_type === "puzzle" && (
              <div className="space-y-3">
                {currentQ.correct_answer?.split("|||").map((item: string, i: number) => (
                  <div key={i} className="bg-slate-50 border-2 rounded-xl p-4 flex items-center gap-4 font-bold text-lg">
                    <span className="bg-slate-200 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center">{i+1}</span>
                    {item}
                  </div>
                ))}
              </div>
            )}

            {currentQ.question_type === "slider" && (
              <div className="text-center space-y-4">
                <div className="text-6xl font-black text-primary">{currentQ.correct_value ?? currentQ.correct_answer}</div>
                <div className="flex justify-between text-muted-foreground font-bold px-12">
                  <span>{currentQ.min_value ?? 0}</span>
                  <span>{currentQ.max_value ?? 100}</span>
                </div>
              </div>
            )}

            {["poll", "brainstorm", "open_ended"].includes(currentQ.question_type) && (
              <div className="text-center p-8 bg-blue-50 border-4 border-blue-200 rounded-2xl">
                <p className="text-xl font-bold text-blue-800">Check the reports for aggregate student answers!</p>
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  {answersThisRound.map((a, i) => (
                    <span key={i} className="bg-white border-2 border-blue-200 text-blue-900 font-bold px-4 py-2 rounded-full text-sm">{a.answer}</span>
                  ))}
                </div>
              </div>
            )}

            {currentQ.question_type === "word_cloud" && (
              <div className="p-6 bg-indigo-50 border-4 border-indigo-200 rounded-2xl">
                <h4 className="text-lg font-bold text-indigo-800 mb-4 text-center">Word Cloud</h4>
                <div className="flex flex-wrap gap-3 justify-center items-center">
                  {(() => {
                    const freq: Record<string, number> = {}
                    answersThisRound.forEach(a => {
                      const w = (a.answer || "").trim().toLowerCase()
                      if (w) freq[w] = (freq[w] || 0) + 1
                    })
                    const max = Math.max(...Object.values(freq), 1)
                    return Object.entries(freq).map(([word, count]) => {
                      const size = Math.round(14 + (count / max) * 36)
                      const colors = ["text-indigo-700", "text-purple-700", "text-blue-700", "text-violet-700"]
                      const color = colors[word.charCodeAt(0) % colors.length]
                      return (
                        <span key={word} className={`font-black ${color}`} style={{ fontSize: `${size}px` }}>
                          {word}
                        </span>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
            
            {currentQ.explanation && (
              <div className="mt-6 bg-slate-50 p-4 rounded-xl border">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Explanation</p>
                <p className="text-lg">{currentQ.explanation}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="bg-slate-900 p-6 flex justify-between items-center shadow-t-xl z-10">
        <div className="text-white/60 font-bold tracking-widest uppercase text-sm">
          Kapendeka Live
        </div>
        <div className="flex gap-4">
          {!showAnswer && currentQ.question_type !== "slide" && (
            <Button size="lg" variant="destructive" onClick={handleTimeUp} className="font-bold px-8">
              Skip Timer
            </Button>
          )}
          
          {(showAnswer || currentQ.question_type === "slide") && (
            <Button size="lg" onClick={handleNextQuestion} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8">
              {session.current_question_index >= questions.length - 1 ? "Show Podium" : "Next Question"} <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
