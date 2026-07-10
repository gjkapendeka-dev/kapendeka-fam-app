"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase, useUser } from "@/supabase"
import { Loader2, CheckCircle2, Edit2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function PlayerRemotePage() {
  const { id: sessionId } = useParams()
  const router = useRouter()
  const supabase = useSupabase()
  const { profile } = useUser()
  const { toast } = useToast()

  const [session, setSession] = React.useState<any>(null)
  const [questions, setQuestions] = React.useState<any[]>([])
  const [quizAttempt, setQuizAttempt] = React.useState<any>(null)

  const [loading, setLoading] = React.useState(true)
  const [joined, setJoined] = React.useState(false)

  // Guest name from sessionStorage (set on join page)
  const [playerName, setPlayerName] = React.useState<string>("")
  const [playerId, setPlayerId] = React.useState<string>("")
  const [playerAvatar, setPlayerAvatar] = React.useState<string>("")
  
  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = React.useState(false)
  const [tempName, setTempName] = React.useState("")
  const [tempSeed, setTempSeed] = React.useState("")

  // Local question state
  const [hasAnswered, setHasAnswered] = React.useState(false)
  const [textAnswer, setTextAnswer] = React.useState("")
  const [sliderValue, setSliderValue] = React.useState(50)
  const [questionStartTime, setQuestionStartTime] = React.useState<number>(Date.now())

  // ─── INITIALIZATION ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!supabase || !sessionId) return

    // Resolve player identity: profile OR guest
    const guestName = typeof window !== "undefined" ? sessionStorage.getItem("kapendeka_guest_name") : null
    const name = profile?.display_name || guestName || "Guest"
    // Use profile id if available, else generate a stable guest id from sessionStorage
    let id = profile?.id
    if (!id) {
      let guestId = sessionStorage.getItem("kapendeka_guest_id")
      if (!guestId) {
        guestId = crypto.randomUUID()
        sessionStorage.setItem("kapendeka_guest_id", guestId)
      }
      id = guestId
    }
    setPlayerName(name)
    setPlayerId(id)

    joinSession(name, id)
  }, [supabase, sessionId])

  const joinSession = async (name: string, id: string) => {
    try {
      const { data: sessionData, error: sErr } = await supabase
        .from("quiz_sessions").select("*").eq("id", sessionId).single()
      if (sErr || !sessionData) throw new Error("Session not found")
      
      // If locked and not already joined, reject
      if (sessionData.is_locked && !joined) {
        toast({ title: "Game Locked", description: "The host has locked this game.", variant: "destructive" })
        return
      }
      
      setSession(sessionData)

      const { data: qData } = await supabase
        .from("quiz_questions").select("*").eq("quiz_id", sessionData.quiz_id).order("question_number")
      setQuestions(qData || [])

      const avatar = profile?.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${name}`
      setPlayerAvatar(avatar)
      
      const teamName = typeof window !== "undefined" ? sessionStorage.getItem("kapendeka_team_name") : null

      // Upsert player row
      await supabase.from("quiz_session_players").upsert({
        session_id: sessionId,
        student_id: id,
        student_name: name,
        avatar_url: avatar,
        team_name: teamName,
        is_active: true,
        score: 0
      }, { onConflict: 'session_id, student_id' })

      // Upsert attempt row for permanent record (only for real profiles, not guests)
      if (profile?.id) {
        const { data: attemptData } = await supabase.from("quiz_attempts").insert({
          quiz_id: sessionData.quiz_id,
          session_id: sessionId,
          student_id: id,
          student_name: name,
          max_points: (qData || []).reduce((s: number, q: any) => s + (q.points || 0), 0),
          started_at: new Date().toISOString()
        }).select().single()
        if (attemptData) setQuizAttempt(attemptData)
      }

      setJoined(true)
    } catch (e: any) {
      toast({ title: "Failed to join", description: e.message, variant: "destructive" })
      router.push("/games/join")
    } finally {
      setLoading(false)
    }
  }

  // ─── REALTIME SYNC ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!supabase || !sessionId || !joined) return

    const channel = supabase.channel(`quiz_session_${sessionId}`)

    channel.on('broadcast', { event: 'host_state_update' }, (payload) => {
      const newSession = payload.payload
      if (session && newSession.current_question_index !== session.current_question_index) {
        setHasAnswered(false)
        setTextAnswer("")
        setQuestionStartTime(Date.now())
        const nextQ = questions[newSession.current_question_index]
        if (nextQ?.question_type === "slider") {
          setSliderValue(Math.round(((nextQ.min_value ?? 0) + (nextQ.max_value ?? 100)) / 2))
        }
      }
      setSession(newSession)
    })

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, sessionId, joined, session, questions])

  // ─── POLLING FALLBACK ──────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!supabase || !sessionId || !joined) return
    const iv = setInterval(async () => {
      const { data } = await supabase.from("quiz_sessions").select("*").eq("id", sessionId).single()
      if (data) {
        if (session && data.current_question_index !== session.current_question_index) {
          setHasAnswered(false)
          setTextAnswer("")
          setQuestionStartTime(Date.now())
        }
        setSession(data)
      }
    }, 2000)
    return () => clearInterval(iv)
  }, [supabase, sessionId, joined, session?.current_question_index])

  // ─── SUBMIT ANSWER ─────────────────────────────────────────────────────────
  const submitAnswer = async (answer: string) => {
    if (hasAnswered || !session || session.status !== "active") return
    setHasAnswered(true)

    const currentQ = questions[session.current_question_index]
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)

    try {
      if (quizAttempt && currentQ) {
        await supabase.from("quiz_responses").insert({
          quiz_id: session.quiz_id,
          question_id: currentQ.id,
          student_id: playerId,
          student_name: playerName,
          attempt_id: quizAttempt.id,
          answer_text: answer
        })
      }

      supabase.channel(`quiz_session_${sessionId}`).send({
        type: 'broadcast',
        event: 'submit_answer',
        payload: { student_id: playerId, answer, timeSpent }
      })
    } catch (e: any) {
      toast({ title: "Error submitting answer", description: e.message, variant: "destructive" })
      setHasAnswered(false)
    }
  }

  // ─── UPDATE PROFILE ────────────────────────────────────────────────────────
  const openEditProfile = () => {
    setTempName(playerName)
    // Extract seed from current avatar or use a random one
    const currentSeed = playerAvatar.includes("seed=") 
      ? playerAvatar.split("seed=")[1].split("&")[0] 
      : Math.random().toString(36).substring(7)
    setTempSeed(currentSeed)
    setIsEditingProfile(true)
  }

  const handleUpdateProfile = async () => {
    if (!tempName.trim()) return
    const newAvatar = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${tempSeed}`
    
    setPlayerName(tempName.trim())
    setPlayerAvatar(newAvatar)
    setIsEditingProfile(false)
    
    if (!profile?.id) {
       sessionStorage.setItem("kapendeka_guest_name", tempName.trim())
    }
    
    try {
      await supabase.from("quiz_session_players").update({
        student_name: tempName.trim(),
        avatar_url: newAvatar
      }).eq("session_id", sessionId).eq("student_id", playerId)
      
      // Notify host via realtime that our avatar/name changed by re-sending join info (or the host's polling will catch it)
    } catch (e: any) {
      toast({ title: "Failed to update profile", description: e.message, variant: "destructive" })
    }
  }

  // ─── RENDERERS ────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-indigo-600">
      <Loader2 className="h-12 w-12 animate-spin text-white" />
    </div>
  )
  if (!session || !joined) return null

  // LOBBY / FINISHED
  if (session.status === "waiting" || session.status === "finished") {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-emerald-500 to-emerald-700">
        {/* Minimal header: just the player name */}
        <div className="flex items-center justify-end px-5 py-3">
          <span className="text-emerald-100/70 text-sm font-bold">{playerName}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 space-y-8">
          {session.status === "waiting" ? (
            <>
              <h1 className="text-4xl font-black text-white drop-shadow-lg">You're in!</h1>
              <p className="text-xl text-emerald-100 font-medium">See your nickname on screen</p>
              
              {isEditingProfile ? (
                <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm space-y-6 animate-in zoom-in">
                  <div className="flex flex-col items-center gap-4">
                    <img src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${tempSeed}`} alt="Avatar preview" className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-200" />
                    <Button variant="outline" size="sm" onClick={() => setTempSeed(Math.random().toString(36).substring(7))} className="rounded-full">
                      <RefreshCw className="w-4 h-4 mr-2" /> Randomize Avatar
                    </Button>
                  </div>
                  <Input 
                    value={tempName} 
                    onChange={e => setTempName(e.target.value.slice(0, 20))}
                    placeholder="Your Nickname"
                    className="text-center font-bold text-xl h-14 rounded-2xl"
                  />
                  <Button onClick={handleUpdateProfile} className="w-full h-12 rounded-xl font-bold">Save Profile</Button>
                </div>
              ) : (
                <div 
                  className="bg-white px-8 py-6 rounded-[2rem] shadow-2xl animate-in zoom-in cursor-pointer hover:scale-105 transition-transform group flex flex-col items-center gap-4"
                  onClick={openEditProfile}
                >
                  <img src={playerAvatar} alt={playerName} className="w-20 h-20 rounded-full bg-slate-100" />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-black text-emerald-700">{playerName}</span>
                    <Edit2 className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </div>
              )}
              
              <p className="text-emerald-200/60 text-sm animate-pulse">Waiting for the host to start...</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-black text-white">Game Over!</h1>
              <p className="text-xl text-emerald-100 font-medium">Check the big screen for results 🏆</p>
              <div className="bg-white px-10 py-5 rounded-full shadow-2xl">
                <span className="text-3xl font-black text-emerald-700">{playerName}</span>
              </div>
              {profile?.id && (
                <Button 
                  onClick={() => router.push("/")} 
                  variant="secondary" 
                  className="mt-8 rounded-xl font-bold bg-white text-emerald-700 hover:bg-emerald-50"
                  size="lg"
                >
                  Back to Dashboard
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ANSWERED — waiting for next question
  if (hasAnswered) {
    return (
      <div className="flex flex-col h-screen bg-slate-100">
        <div className="flex items-center justify-end px-5 py-3 bg-white shadow-sm">
          <span className="text-slate-500 text-sm font-bold">{playerName}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in space-y-4">
          <CheckCircle2 className="h-28 w-28 text-emerald-400" />
          <h2 className="text-3xl font-black text-slate-700">Answer Sent!</h2>
          <p className="text-xl text-slate-400 font-medium">Waiting for others...</p>
        </div>
      </div>
    )
  }

  // ACTIVE QUESTION
  const currentQ = questions[session.current_question_index]
  if (!currentQ) return (
    <div className="flex h-screen bg-slate-100 items-center justify-center text-xl font-bold">
      Loading...
    </div>
  )

  const qType = currentQ.question_type

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Minimal header — just player name + question number */}
      <header className="bg-white px-5 py-3 shadow-sm flex items-center justify-between flex-none">
        <span className="font-bold text-slate-500 uppercase tracking-widest text-sm">Q{session.current_question_index + 1}</span>
        <span className="font-bold text-slate-600 text-sm">{playerName}</span>
      </header>

      <main className="flex-1 flex flex-col p-4 justify-center max-w-lg mx-auto w-full gap-4">

        {qType === "slide" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-blue-50 rounded-3xl border-4 border-blue-200">
            <span className="text-6xl mb-4">👀</span>
            <p className="text-2xl font-bold text-blue-900">Look at the big screen</p>
          </div>
        )}

        {/* MULTIPLE CHOICE & POLL */}
        {["multiple_choice", "poll"].includes(qType) && (
          <div className="flex-1 grid grid-cols-2 gap-3 pb-4">
            {(currentQ.options || []).map((opt: string, i: number) => {
              const bgColors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500"]
              const shapes = ["▲", "◆", "●", "■", "★", "♥"]
              return (
                <button
                  key={i}
                  onClick={() => submitAnswer(opt)}
                  className={`${bgColors[i % bgColors.length]} rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center justify-center text-white h-full max-h-[280px]`}
                >
                  <span className="text-6xl opacity-80 drop-shadow-md mb-2">{shapes[i % shapes.length]}</span>
                  {qType === "poll" && <span className="text-base font-bold px-3 text-center break-words leading-tight">{opt}</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* TRUE OR FALSE */}
        {qType === "true_false" && (
          <div className="flex-1 grid grid-cols-1 gap-4 pb-4">
            <button onClick={() => submitAnswer("true")} className="bg-emerald-500 rounded-3xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center justify-center text-white min-h-[140px]">
              <span className="text-7xl opacity-80 mb-2">▲</span>
              <span className="text-3xl font-black">True</span>
            </button>
            <button onClick={() => submitAnswer("false")} className="bg-red-500 rounded-3xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center justify-center text-white min-h-[140px]">
              <span className="text-7xl opacity-80 mb-2">◆</span>
              <span className="text-3xl font-black">False</span>
            </button>
          </div>
        )}

        {/* SHORT ANSWER / WORD CLOUD */}
        {["short_answer", "word_cloud"].includes(qType) && (
          <div className="flex flex-col bg-white rounded-3xl p-6 shadow-md gap-4">
            <p className="text-center font-bold text-lg text-slate-700">
              {qType === "word_cloud" ? "Type one word" : "Type your answer"}
            </p>
            <Input
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              className="h-16 text-2xl font-bold text-center border-4 rounded-2xl focus-visible:ring-0 focus-visible:border-primary"
              autoFocus
            />
            <Button
              onClick={() => submitAnswer(textAnswer.trim())}
              disabled={!textAnswer.trim()}
              size="lg"
              className="h-14 text-xl font-bold rounded-2xl"
            >
              Submit Answer
            </Button>
          </div>
        )}

        {/* SLIDER */}
        {qType === "slider" && (
          <div className="flex flex-col bg-white rounded-3xl p-8 shadow-md gap-6 justify-center min-h-[280px]">
            <div className="text-center">
              <span className="text-7xl font-black text-primary">{sliderValue}</span>
            </div>
            <input
              type="range"
              min={currentQ.min_value ?? 0}
              max={currentQ.max_value ?? 100}
              step={1}
              value={sliderValue}
              onChange={e => setSliderValue(parseInt(e.target.value))}
              className="w-full h-8 rounded-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-400 font-bold px-1">
              <span>{currentQ.min_value ?? 0}</span>
              <span>{currentQ.max_value ?? 100}</span>
            </div>
            <Button onClick={() => submitAnswer(String(sliderValue))} size="lg" className="h-14 text-xl font-bold rounded-2xl">
              Submit Number
            </Button>
          </div>
        )}

        {/* PUZZLE / DROP PIN / OPEN ENDED */}
        {["puzzle", "drop_pin", "open_ended", "brainstorm"].includes(qType) && (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-amber-50 rounded-3xl border-4 border-amber-200 px-6 py-8">
            <span className="text-5xl mb-4">💻</span>
            <p className="text-xl font-bold text-amber-900 mb-2">Use the big screen</p>
            <p className="font-medium text-amber-700/70 mb-6">This type needs a larger device to answer.</p>
            <Button variant="outline" className="border-amber-400 text-amber-800" onClick={() => submitAnswer("")}>
              Skip this one
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
