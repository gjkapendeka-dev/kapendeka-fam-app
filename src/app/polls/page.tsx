
"use client"

import * as React from "react"
import { BarChart4, Plus, CheckCircle2, Loader2, Trash2, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

export default function PollsPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [question, setQuestion] = React.useState("")
  const [option1, setOption1] = React.useState("")
  const [option2, setOption2] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const pollsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("polls").select("*").eq("familyId", profile.familyId).order("createdAt", { ascending: false })
  }, [supabase, profile?.familyId])

  const { data: polls, loading } = useCollection(pollsQuery)

  const handleCreate = () => {
    if (!supabase || !profile?.familyId || !question) return
    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      question,
      options: [option1 || "Yes", option2 || "No"],
      votes: {},
      status: "open",
      createdBy: profile.displayName,
      createdAt: new Date().toISOString()
    }
    supabase.from("polls").insert([data])
      .then(() => {
        setIsAddOpen(false)
        setQuestion(""); setOption1(""); setOption2("")
        toast({ title: "Poll Launched" })
      })
      .then(() => setIsSubmitting(false))
  }

  const handleVote = (pollId: string, optionIndex: number) => {
    if (!supabase || !profile) return
    supabase.from("polls").update({
      [`votes.${profile.id}`]: optionIndex
    }).eq("id", pollId)
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-4xl mx-auto pb-24 pr-14">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-primary tracking-tighter">Family Polls</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Settle Universe Decisions Quickly</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-primary shadow-xl">
              <Plus className="h-4 w-4 mr-2" /> New Decision
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase">Start a Vote</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="font-bold text-[10px] uppercase opacity-50">Question</Label>
                <Input placeholder="What are we watching?" value={question} onChange={(e) => setQuestion(e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Option 1" value={option1} onChange={(e) => setOption1(e.target.value)} className="rounded-xl" />
                <Input placeholder="Option 2" value={option2} onChange={(e) => setOption2(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!question || isSubmitting} className="w-full rounded-xl h-12">Broadcast Poll</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-[2rem]" />)}
          </div>
        ) : polls?.length === 0 ? (
          <Card className="rounded-[2.5rem] border-none bg-muted/20 py-20 text-center">
            <BarChart4 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No active decisions</p>
          </Card>
        ) : (
          polls?.map((poll) => {
            const votesArray = Object.values(poll.votes || {})
            const total = votesArray.length
            return (
              <Card key={poll.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase">{poll.status}</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">By {poll.createdBy}</span>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight mt-4">{poll.question}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  {poll.options.map((opt: string, i: number) => {
                    const count = votesArray.filter(v => v === i).length
                    const pct = total > 0 ? (count / total) * 100 : 0
                    const hasVoted = poll.votes?.[profile?.id || ""] === i
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleVote(poll.id, i)}
                        className={`w-full relative h-14 rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.98] ${hasVoted ? 'border-primary' : 'border-muted'}`}
                      >
                        <div className="absolute inset-0 bg-primary/5 transition-all" style={{ width: `${pct}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-6">
                          <span className="font-black uppercase text-xs">{opt}</span>
                          <span className="font-black text-primary text-sm">{pct.toFixed(0)}%</span>
                        </div>
                        {hasVoted && <div className="absolute right-14 top-1/2 -translate-y-1/2"><CheckCircle2 className="h-4 w-4 text-primary" /></div>}
                      </button>
                    )
                  })}
                  <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase pt-4">
                    <Users className="h-3 w-3" />
                    {total} Family Nodes Responded
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
