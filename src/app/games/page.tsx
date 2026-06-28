"use client"

import * as React from "react"
import { 
  Trophy, 
  Award, 
  Zap, 
  Star, 
  TrendingUp, 
  Flame, 
  Gamepad2, 
  Gift, 
  ChevronRight,
  CheckCircle2,
  Loader2,
  Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

export default function GamesRewardsPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  // Fetch Family Rewards
  const rewardsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("familyRewards").select("*").eq("familyId", profile.familyId)
    
  }, [supabase, profile?.familyId])
  const { data: rewards, loading: rewardsLoading } = useCollection(rewardsQuery)

  // Fetch Family Leaderboard
  const leaderboardQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("profiles").select("*").eq("family_id", profile.familyId).order("points", { ascending: false })
  }, [supabase, profile?.familyId])
  const { data: profiles } = useCollection(leaderboardQuery)
  
  const leaderboard = (profiles || []).map(p => ({
    name: p.display_name,
    points: p.points || 0,
    level: Math.floor((p.points || 0) / 200) + 1,
    streak: p.streak_days || 0,
    avatar: p.display_name?.charAt(0) || "?",
    id: p.id,
    avatar_url: p.avatar_url
  }))

  const handleRedeem = (rewardName: string, cost: number) => {
    if ((profile?.points || 0) < cost) {
      toast({ variant: "destructive", title: "Not enough points!", description: `Keep completing chores to earn ${cost} points.` })
      return
    }
    toast({ title: "Reward Redeemed!", description: `Enjoy your ${rewardName}! George has been notified.` })
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Rewards & Levels</h1>
        <p className="text-muted-foreground font-medium">Gamifying the Kapendeka Universe Hub</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Stats & Leaderboard */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Current Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{profile?.points || 0}</div>
                <div className="flex items-center gap-1.5 mt-2 bg-white/20 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <TrendingUp className="h-3 w-3" /> +120 this week
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-indigo-500 to-primary text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Hub Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">Lvl {Math.floor((profile?.points || 0) / 200) + 1}</div>
                <div className="mt-3 space-y-1">
                  <Progress value={((profile?.points || 0) % 200) / 2} className="h-1.5 bg-white/20" />
                  <div className="text-[9px] font-bold text-right opacity-70 uppercase tracking-tighter">XP to next level</div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Family Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black flex items-center gap-2">
                  <Flame className="h-8 w-8 text-yellow-300 animate-bounce" />
                  {profile?.streakDays || 0}
                </div>
                <p className="text-[10px] font-bold mt-2 opacity-80">Don't break the cycle!</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Universe Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 group hover:bg-muted/40 transition-colors">
                    <div className="h-10 w-10 flex items-center justify-center font-black text-xl text-muted-foreground/40 shrink-0">
                      #{i + 1}
                    </div>
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={m.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${m.id}`} />
                      <AvatarFallback>{m.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{m.name}</span>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-black">{m.points} PTS</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                        <span>Lvl {m.level}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-rose-500"><Flame className="h-3 w-3" /> {m.streak} Day Streak</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Rewards Shop */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-accent/5 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-accent">
                <Gift className="h-5 w-5" />
                Redeem Rewards
              </CardTitle>
              <CardDescription className="font-medium">Trade your hard-earned points</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { name: "Extra Screen Time", cost: 500, icon: Gamepad2, color: "text-blue-500 bg-blue-50" },
                { name: "Ice Cream Night", cost: 1200, icon: Award, color: "text-amber-500 bg-amber-50" },
                { name: "Family Movie Choice", cost: 800, icon: Star, color: "text-purple-500 bg-purple-50" },
              ].map((reward) => (
                <div key={reward.name} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-transparent hover:border-accent/20 transition-all">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${reward.color}`}>
                    <reward.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{reward.name}</h4>
                    <div className="text-accent font-black text-xs">{reward.cost} PTS</div>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-xl font-bold h-8"
                    onClick={() => handleRedeem(reward.name, reward.cost)}
                  >
                    Redeem
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-primary/5 p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Your Badges</h4>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-white rounded-2xl shadow-sm flex items-center justify-center group cursor-help">
                  <Award className="h-6 w-6 text-primary/20 group-hover:text-primary group-hover:scale-110 transition-all" />
                </div>
              ))}
              <div className="aspect-square bg-muted/50 rounded-2xl border-2 border-dashed flex items-center justify-center">
                <Plus className="h-5 w-5 text-muted-foreground/30" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
