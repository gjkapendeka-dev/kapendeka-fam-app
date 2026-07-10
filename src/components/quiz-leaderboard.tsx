import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  student_id: string
  student_name: string
  percentage_score: number
  total_points: number
  time_taken_seconds: number
}

interface QuizLeaderboardProps {
  quizId: string
  supabase: any
  currentStudentId?: string
  showLive?: boolean
}

export function QuizLeaderboard({
  quizId,
  supabase,
  currentStudentId,
  showLive = true,
}: QuizLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()

    if (showLive) {
      const interval = setInterval(fetchLeaderboard, 3000)
      return () => clearInterval(interval)
    }
  }, [quizId])

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("student_id, student_name, percentage_score, total_points, max_points, completed_at, started_at")
        .eq("quiz_id", quizId)
        .order("percentage_score", { ascending: false })

      if (error) {
        console.error("Failed to load leaderboard:", error?.message || error?.code || JSON.stringify(error))
        setLoading(false)
        return
      }

      const attemptCounts: Record<string, number> = {}
      const processedData = (data || []).map((entry: any) => {
        attemptCounts[entry.student_id] = (attemptCounts[entry.student_id] || 0) + 1
        const timeTaken = entry.completed_at && entry.started_at
          ? Math.round((new Date(entry.completed_at).getTime() - new Date(entry.started_at).getTime()) / 1000)
          : 0
        return {
          ...entry,
          time_taken_seconds: timeTaken,
          attempt_number: attemptCounts[entry.student_id],
        }
      })

      // Mark multi-attempt students
      processedData.forEach((entry: any) => {
        entry.has_multiple = (attemptCounts[entry.student_id] || 0) > 1
      })

      // Sort by score desc, then time asc (faster = better)
      processedData.sort((a: any, b: any) => {
        if (b.percentage_score !== a.percentage_score) {
          return b.percentage_score - a.percentage_score
        }
        return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0)
      })

      const entries: LeaderboardEntry[] = processedData.map((entry: any, index: number) => ({
        rank: index + 1,
        student_id: entry.student_id,
        student_name: entry.has_multiple
          ? `${entry.student_name} (Attempt ${entry.attempt_number})`
          : entry.student_name,
        percentage_score: entry.percentage_score || 0,
        total_points: entry.total_points || 0,
        time_taken_seconds: entry.time_taken_seconds || 0,
      }))

      setLeaderboard(entries)
    } catch (error) {
      console.error("Failed to load leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-slate-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const myEntries = leaderboard.filter((e) => e.student_id === currentStudentId)
  const isSolo = leaderboard.length > 0 && new Set(leaderboard.map((e) => e.student_id)).size === 1 && myEntries.length > 0

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          🏆 Leaderboard
          {isSolo && (
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] ml-auto">
              You're in the lead!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No scores yet — be the first!
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {leaderboard.slice(0, 10).map((entry) => {
              const isMe = entry.student_id === currentStudentId
              return (
                <div
                  key={`${entry.rank}-${entry.student_name}`}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    isMe
                      ? "bg-blue-100 border-2 border-blue-400 font-semibold"
                      : "bg-white border border-yellow-100"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-bold w-6 text-center shrink-0">
                      {getMedalIcon(entry.rank) || `#${entry.rank}`}
                    </span>
                    <span className={`truncate ${isMe ? "text-blue-800" : ""}`}>
                      {entry.student_name}
                      {isMe && <span className="ml-1 text-blue-600">(you)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${isMe ? "bg-blue-200 text-blue-800" : ""}`}
                    >
                      {Math.round(entry.percentage_score)}%
                    </Badge>
                    {entry.time_taken_seconds > 0 && (
                      <span className="text-muted-foreground text-[10px]">
                        {Math.round(entry.time_taken_seconds)}s
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}