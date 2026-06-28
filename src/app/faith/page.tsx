"use client"

import * as React from "react"
import { 
  Church, 
  Plus, 
  HandHeart, 
  BookOpen, 
  Heart, 
  MessageSquare, 
  Calendar as CalendarIcon,
  Search,
  Loader2,
  Bookmark
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { format } from "date-fns"
export default function FaithPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isEntryOpen, setIsEntryOpen] = React.useState(false)
  const [isPrayerOpen, setIsPrayerOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form States
  const [entryTitle, setEntryTitle] = React.useState("")
  const [entryNotes, setEntryNotes] = React.useState("")
  const [newPrayer, setNewPrayer] = React.useState("")

  // Fetch Faith Entries
  const faithQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("faith_entries")
      .select("*")
      .eq("familyId", profile.familyId).order("date", { ascending: false }).limit(20)
  }, [supabase, profile?.familyId])

  const { data: entries, loading } = useCollection(faithQuery)

  const handleAddEntry = async () => {
    if (!supabase || !profile?.familyId || !entryTitle) return

    setIsSubmitting(true)
    const entryData = {
      familyId: profile.familyId,
      title: entryTitle,
      notes: entryNotes,
      date: new Date().toISOString(),
      prayerPoints: [], // Can be populated later or from a specific list
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase.from("faith_entries").insert([entryData])
    setIsSubmitting(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    setIsEntryOpen(false)
    setEntryTitle("")
    setEntryNotes("")
    toast({ title: "Faith Entry Added", description: "Your spiritual notes have been saved to the Hub." })
  }

  // Placeholder for collective prayer points (could be a separate collection for MVP, or part of the entry)
  const prayers = [
    { text: "Safety for George's travel next week", category: "Family" },
    { text: "Healing for Grandma's knee", category: "Health" },
    { text: "Wisdom for Junior's exams", category: "Education" },
  ]

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Church & Faith</h1>
          <p className="text-muted-foreground font-medium">Tracking the spiritual growth of the Kapendeka Universe</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isEntryOpen} onOpenChange={setIsEntryOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Log Service
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Sermon/Bible Study Note</DialogTitle>
                <DialogDescription>Record key takeaways from today's service or study.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Topic/Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Sunday Service: Grace & Mercy" 
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes & Reflections</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Write down sermon points or your thoughts, ..." 
                    className="min-h-[150px] rounded-xl"
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddEntry} disabled={!entryTitle || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Notes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Faith Journal Entries */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="h-6 w-6 text-primary" />
              Sermon Notes & Study
            </h2>
            <div className="relative w-full max-w-[200px] hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes, ..." className="pl-9 rounded-xl h-9" />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)
            ) : (entries || []).length > 0 ? (
              entries?.map((entry) => (
                <Card key={entry.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
                  <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20">
                            {entry.date ? format(new Date(entry.date.seconds * 1000), "MMM dd, yyyy") : ", ..."}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground">
                            Service
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{entry.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3">
                          {entry.notes}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center">
                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                  <Church className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="font-bold text-lg">Your Faith Journal is empty</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                  Start logging your church services and personal Bible studies to see your growth.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Prayer Wall & Daily Devotional */}
        <div className="lg:col-span-4 space-y-8">
          {/* Prayer Wall */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-primary to-indigo-700 text-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-accent" />
                Family Prayer Wall
              </CardTitle>
              <CardDescription className="text-primary-foreground/70 font-medium">Interceding for the Kapendeka Universe</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                {prayers.map((prayer, i) => (
                  <div key={i} className="bg-white/10 p-3 rounded-xl border border-white/10 group cursor-pointer hover:bg-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">{prayer.category}</span>
                      <Heart className="h-3 w-3 text-accent group-hover:fill-accent" />
                    </div>
                    <p className="text-sm font-medium leading-tight">{prayer.text}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-11 mt-2">
                <Plus className="h-4 w-4 mr-2" /> Add Prayer Request
              </Button>
            </CardContent>
          </Card>

          {/* Daily Devotional Mock */}
          <Card className="rounded-2xl border-none shadow-sm bg-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-accent">
                <Bookmark className="h-5 w-5" />
                Daily Devotional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">April 12, 2026</div>
              <h4 className="font-bold text-md italic">"Strength in Stillness"</h4>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                In a world that never stops moving, find your center in the quiet moments of the morning.
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="text-[10px] font-bold text-accent border-accent/30">
                  Psalm 46:10
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Scripture of the Week */}
          <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Family Verse of the Week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-md font-bold text-primary leading-tight">
                "As for me and my house, we will serve the Lord."
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-2">Joshua 24:15</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
