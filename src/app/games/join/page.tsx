"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSupabase, useUser } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function JoinGamePage() {
  const router = useRouter()
  const supabase = useSupabase()
  const { profile } = useUser()
  const { toast } = useToast()

  const [pin, setPin] = React.useState("")
  const [guestName, setGuestName] = React.useState("")
  const [teamName, setTeamName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [activeSessions, setActiveSessions] = React.useState<any[]>([])
  const [isGuestModeSession, setIsGuestModeSession] = React.useState(false)
  const [pendingSession, setPendingSession] = React.useState<any>(null)

  // Determine if user has a profile already
  const hasProfile = !!profile

  React.useEffect(() => {
    if (!supabase || !profile?.familyId) return

    const fetchActive = async () => {
      const { data } = await supabase
        .from("quiz_sessions")
        .select("id, status, require_pin, quiz_id, quizzes(title)")
        .eq("family_id", profile.familyId)
        .in("status", ["waiting", "active"])

      if (data) setActiveSessions(data)
    }
    fetchActive()
  }, [supabase, profile?.familyId])

  const handleJoinWithPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin || pin.length < 6) return
    if (!hasProfile && !guestName.trim()) {
      toast({ title: "Enter your name", description: "Guests need a nickname to join.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("id, status, is_locked, team_mode, quiz_id")
        .eq("join_pin", pin)
        .in("status", ["waiting", "active"])
        .single()

      if (error || !data) {
        toast({ title: "Invalid PIN", description: "No active game found with this PIN.", variant: "destructive" })
        setLoading(false)
        return
      }

      let isGuest = false
      if (data.quiz_id) {
        const { data: quizData } = await supabase.from("quizzes").select("guest_mode").eq("id", data.quiz_id).single()
        isGuest = quizData?.guest_mode ?? false
        setIsGuestModeSession(isGuest)
      }

      if (isGuest && hasProfile && !guestName.trim()) {
        toast({ title: "Nickname required", description: "This game is in Guest Mode. Please enter a nickname to play.", variant: "default" })
        setLoading(false)
        return
      }

      if (data.is_locked) {
        toast({ title: "Game Locked", description: "The host has locked this game. No new players can join.", variant: "destructive" })
        setLoading(false)
        return
      }

      if (data.team_mode && !teamName) {
        setPendingSession(data)
        setLoading(false)
        return
      }

      // Save guest name to sessionStorage
      const effectiveName = isGuest ? guestName.trim() : (!hasProfile ? guestName.trim() : "")
      if (effectiveName) {
        sessionStorage.setItem("kapendeka_guest_name", effectiveName)
      }
      if (data.team_mode && teamName) {
        sessionStorage.setItem("kapendeka_team_name", teamName)
      }

      router.push(`/games/play/${data.id}`)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
      setLoading(false)
    }
  }

  const handleJoinTeam = (color: string) => {
    if (!pendingSession) return
    setTeamName(color)
    sessionStorage.setItem("kapendeka_team_name", color)
    if (!hasProfile && guestName.trim()) {
      sessionStorage.setItem("kapendeka_guest_name", guestName.trim())
    }
    router.push(`/games/play/${pendingSession.id}`)
  }

  const handleJoinDirect = (sessionId: string) => {
    router.push(`/games/play/${sessionId}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl">Kapendeka!</h1>
          <p className="text-indigo-200 mt-2 font-medium">Enter a game PIN to join</p>
        </div>

        {/* PIN Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-4">
          {pendingSession ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-center font-black text-2xl text-slate-800">Choose Your Team</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleJoinTeam("Red")} className="h-24 text-2xl font-black bg-red-500 hover:bg-red-600">Red</Button>
                <Button onClick={() => handleJoinTeam("Blue")} className="h-24 text-2xl font-black bg-blue-500 hover:bg-blue-600">Blue</Button>
                <Button onClick={() => handleJoinTeam("Green")} className="h-24 text-2xl font-black bg-green-500 hover:bg-green-600">Green</Button>
                <Button onClick={() => handleJoinTeam("Yellow")} className="h-24 text-2xl font-black bg-yellow-500 hover:bg-yellow-600">Yellow</Button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleJoinWithPin} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Game PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="h-16 text-center text-3xl font-black tracking-[0.2em] bg-slate-100 border-2 border-slate-200 rounded-2xl focus-visible:ring-0 focus-visible:border-indigo-500"
                  autoFocus
                />

                {/* Guest name field — shown for guests always, or for everyone in guest mode */}
                {(!hasProfile || isGuestModeSession) && (
                  <div className="space-y-1">
                    <Input
                      type="text"
                      placeholder={isGuestModeSession && hasProfile ? "Play as guest (enter a nickname)" : "Your nickname"}
                      value={guestName}
                      onChange={e => setGuestName(e.target.value.slice(0, 20))}
                      className="h-12 text-center text-lg font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus-visible:ring-0 focus-visible:border-indigo-500"
                    />
                    {isGuestModeSession && (
                      <p className="text-[11px] text-center text-amber-600 font-bold">🎮 Guest Mode — enter any name to play!</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 text-xl font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                  disabled={pin.length < 6 || loading}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Join Game"}
                </Button>
              </form>

              {hasProfile && !isGuestModeSession && (
                <p className="text-xs text-center text-slate-400 font-medium">
                  Joining as <strong className="text-slate-600">{profile?.display_name}</strong>
                </p>
              )}
            </>
          )}
        </div>

        {/* Open games in family (no PIN required) */}
        {activeSessions.filter(s => !s.require_pin).length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest text-center">Open games — tap to join</p>
            {activeSessions.filter(s => !s.require_pin).map((s) => (
              <Button
                key={s.id}
                variant="outline"
                className="w-full h-auto py-4 text-left justify-between rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                onClick={() => handleJoinDirect(s.id)}
              >
                <span className="font-bold text-lg">{s.quizzes?.title || "Live Game"}</span>
                <span className="text-xs text-indigo-200 bg-white/10 px-2 py-1 rounded-full capitalize">{s.status}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Guest disclaimer */}
        {!hasProfile && (
          <p className="text-center text-indigo-200/60 text-xs font-medium">
            Joining as a guest — your score won't be saved to a profile.
          </p>
        )}
      </div>
    </div>
  )
}
