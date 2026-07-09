import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp } from "lucide-react"

interface LeaderboardEntry {
  rank: number
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
      const interval = setInterval(fetchLeaderboard, 2000)
      return () => clearInterval(interval)
    }
  }, [quizId])

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("is_completed", true)
        .order("percentage_score", { ascending: false })
        .order("time_taken_seconds", { ascending: true })

      if (error) throw error

      const entries: LeaderboardEntry[] = data.map((entry: any, index: number) => ({
        rank: index + 1,
        student_name: entry.student_name,
        percentage_score: entry.percentage_score,
        total_points: entry.total_points,
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
    switch (rank) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return null
    }
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

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          🏆 Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No scores yet
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {leaderboard.slice(0, 10).map((entry) => (
              <div
                key={`${entry.rank}-${entry.student_name}`}
                className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                  entry.student_name === currentStudentId
                    ? "bg-blue-100 border-2 border-blue-400"
                    : "bg-white border border-yellow-100"
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-bold w-6 text-center">
                    {getMedalIcon(entry.rank) || `#${entry.rank}`}
                  </span>
                  <span className="font-medium truncate">{entry.student_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {Math.round(entry.percentage_score)}%
                  </Badge>
                  <span className="text-muted-foreground">
                    {Math.round(entry.time_taken_seconds)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
