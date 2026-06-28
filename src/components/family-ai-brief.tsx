"use client"

import * as React from "react"
import { Sparkles, Loader2, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateDailyBrief, type FamilyBriefOutput } from "@/ai/flows/family-daily-brief"
import { useUser, useCollection, useSupabase } from "@/supabase"

export function FamilyAIBrief() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const [brief, setBrief] = React.useState<FamilyBriefOutput | null>(null)
  const [loading, setLoading] = React.useState(false)

  const eventsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("events").select("*").eq("familyId", profile.familyId).limit(5)
  }, [supabase, profile?.familyId])
  
  const choresQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("chores").select("*").eq("familyId", profile.familyId).eq("status", "pending").limit(5)
  }, [supabase, profile?.familyId])

  const newsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("news").select("*").eq("familyId", profile.familyId).order("date", { ascending: false }).limit(2)
  }, [supabase, profile?.familyId])

  const { data: events } = useCollection(eventsQuery)
  const { data: chores } = useCollection(choresQuery)
  const { data: news } = useCollection(newsQuery)

  const handleGenerate = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const result = await generateDailyBrief({
        userName: profile.displayName,
        events: (events || []).map(e => ({ title: e.title, startTime: e.startTime, type: e.type })),
        chores: (chores || []).map(c => ({ title: c.title, assignedTo: c.assignedTo, points: c.pointsReward || 0 })),
        recentNews: (news || []).map(n => ({ title: n.title, authorName: n.authorName }))
      })
      setBrief(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (profile && !brief && !loading) {
      handleGenerate()
    }
  }, [profile])

  if (!brief && !loading) return null

  return (
    <Card className="rounded-[2rem] border-none bg-gradient-to-br from-indigo-50 to-white shadow-xl shadow-indigo-100/20 overflow-hidden">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-black uppercase tracking-widest">Universe Intelligence</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 rounded-full text-[10px] font-bold" onClick={handleGenerate} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-6 w-3/4 bg-indigo-100 animate-pulse rounded-md" />
            <div className="h-4 w-full bg-slate-100 animate-pulse rounded-md" />
            <div className="h-4 w-5/6 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {brief?.greeting}
              </h2>
              <p className="mt-2 text-slate-600 font-medium leading-relaxed">
                {brief?.summary}
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm">
              <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Today's Highlight</div>
                <p className="text-sm font-bold text-slate-800">{brief?.highlight}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-50">
              <p className="text-xs italic text-indigo-500 font-bold">
                "{brief?.encouragement}"
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
