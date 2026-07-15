"use client"

import * as React from "react"
import { 
  Church, 
  Plus, 
  HandHeart, 
  BookOpen, 
  Heart, 
  Calendar as CalendarIcon,
  Search,
  Loader2,
  Bookmark,
  ClipboardList
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import ChurchWorkTab from "@/components/church-work-tab"

export default function FaithPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [mainTab, setMainTab] = React.useState("faith")
  const [isEntryOpen, setIsEntryOpen] = React.useState(false)
  const [isPrayerOpen, setIsPrayerOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [isDevoOpen, setIsDevoOpen] = React.useState(false)
  const [devoTitle, setDevoTitle] = React.useState("")
  const [devoVerse, setDevoVerse] = React.useState("")
  const [devoRef, setDevoRef] = React.useState("")
  const [devoReflection, setDevoReflection] = React.useState("")
  
  // Fetch Latest Devotional
  const devoQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("devotionals")
      .select("*")
      .eq("family_id", profile.familyId).order("created_at", { ascending: false }).limit(1)
  }, [supabase, profile?.familyId])
  const { data: devotionals } = useCollection(devoQuery)
  const currentDevo = devotionals?.[0] || null

  const handleAddDevo = async () => {
    if (!supabase || !profile?.familyId || !devoTitle || !devoVerse) return

    setIsSubmitting(true)
    const devoData = {
      family_id: profile.familyId,
      title: devoTitle,
      author_id: profile.id,
      author_name: profile.displayName,
      reference: devoRef,
      verse: devoVerse,
      reflection: devoTitle + "\n\n" + devoReflection,
    }

    const { error } = await supabase.from("devotionals").insert([devoData])
    setIsSubmitting(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    setIsDevoOpen(false)
    setDevoTitle("")
    setDevoVerse("")
    setDevoRef("")
    setDevoReflection("")
    toast({ title: "Devotional Published", description: "Shared with the family." })
  }

  // Form States - Service Entry
  const [entryTitle, setEntryTitle] = React.useState("")
  const [entryNotes, setEntryNotes] = React.useState("")

  // Form States - Prayers
  const [prayerText, setPrayerText] = React.useState("")
  const [prayerCategory, setPrayerCategory] = React.useState("Family")

  // Fetch Faith Entries
  const faithQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("faith_entries")
      .select("*")
      .eq("familyId", profile.familyId).order("date", { ascending: false }).limit(20)
  }, [supabase, profile?.familyId])
  const { data: entries, loading } = useCollection(faithQuery)

  // Fetch Prayers
  const prayersQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("prayers")
      .select("*")
      .eq("family_id", profile.familyId).order("created_at", { ascending: false })
  }, [supabase, profile?.familyId])
  const { data: realPrayers, refresh: refreshPrayers } = useCollection(prayersQuery)

  const handleAddEntry = async () => {
    if (!supabase || !profile?.familyId || !entryTitle) return

    setIsSubmitting(true)
    const entryData = {
      familyId: profile.familyId,
      title: entryTitle,
      notes: entryNotes,
      date: new Date().toISOString(),
      prayerPoints: [],
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

  const handleAddPrayer = async () => {
    if (!supabase || !profile?.familyId || !prayerText) return
    setIsSubmitting(true)
    const { error } = await supabase.from("prayers").insert([{
      family_id: profile.familyId,
      text: prayerText,
      category: prayerCategory,
      created_at: new Date().toISOString()
    }])
    setIsSubmitting(false)
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })
    setIsPrayerOpen(false)
    setPrayerText("")
    if (refreshPrayers) refreshPrayers()
    toast({ title: "Prayer Added", description: "Added to the Family Prayer Wall." })
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Church & Faith</h1>
          <p className="text-muted-foreground font-medium">Tracking the spiritual growth of the Kapendeka World</p>
        </div>
        {mainTab === "faith" && (
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
                  <DialogDescription>Record key takeaways from today&apos;s service or study.</DialogDescription>
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
        )}
      </header>

      {/* ══════ Top-Level Tab Bar ══════ */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl w-full max-w-md flex h-auto">
          <TabsTrigger value="faith" className="rounded-xl font-bold py-2.5 flex-1 data-[state=active]:shadow-lg gap-2">
            <BookOpen className="h-4 w-4" /> Faith & Devotion
          </TabsTrigger>
          <TabsTrigger value="church-work" className="rounded-xl font-bold py-2.5 flex-1 data-[state=active]:shadow-lg gap-2">
            <ClipboardList className="h-4 w-4" /> Church Work
          </TabsTrigger>
        </TabsList>

        {/* ══════ TAB 1: Church & Faith ══════ */}
        <TabsContent value="faith" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Faith Journal Entries */}
            <div className="lg:col-span-8 space-y-4">
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
                                {entry.date ? format(new Date(entry.date), "MMM dd, yyyy") : "..."}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground">
                                Service
                              </Badge>
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{entry.title}</h3>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3 whitespace-pre-wrap">
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
            <div className="lg:col-span-4 space-y-4">
              {/* Real Family Prayer Wall */}
              <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-primary to-indigo-700 text-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HandHeart className="h-5 w-5 text-accent" />
                    Family Prayer Wall
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/70 font-medium">Interceding for the Kapendeka World</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    {(realPrayers || []).length > 0 ? (
                      realPrayers?.map((prayer) => (
                        <div key={prayer.id} className="bg-white/10 p-3 rounded-xl border border-white/10 group cursor-pointer hover:bg-white/20 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">{prayer.category}</span>
                            <Heart className="h-3 w-3 text-accent/50 group-hover:fill-accent group-hover:text-accent transition-all" />
                          </div>
                          <p className="text-sm font-medium leading-tight">{prayer.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm text-primary-foreground/70">No prayer requests active.</p>
                      </div>
                    )}
                  </div>
                  
                  <Dialog open={isPrayerOpen} onOpenChange={setIsPrayerOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-11 mt-2">
                        <Plus className="h-4 w-4 mr-2" /> Add Prayer Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl sm:max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle>Add to Prayer Wall</DialogTitle>
                        <DialogDescription>Share what you need prayer for with the family.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Category</Label>
                          <Select value={prayerCategory} onValueChange={setPrayerCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Family">Family</SelectItem>
                              <SelectItem value="Health">Health</SelectItem>
                              <SelectItem value="Education">Education</SelectItem>
                              <SelectItem value="Finances">Finances</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Prayer Request</Label>
                          <Textarea 
                            value={prayerText} 
                            onChange={e => setPrayerText(e.target.value)} 
                            placeholder="e.g. Please pray for my upcoming test..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddPrayer} disabled={!prayerText || isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post Prayer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Daily Devotional */}
              <Card className="rounded-2xl border-none shadow-sm bg-accent/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between text-accent">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-5 w-5" />
                      Daily Devotional
                    </div>
                    {profile?.role === 'parent' && (
                      <Dialog open={isDevoOpen} onOpenChange={setIsDevoOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-bold"><Plus className="h-3 w-3 mr-1" /> Add</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Post a Daily Devotional</DialogTitle>
                            <DialogDescription>Share an encouraging verse with the family.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-3 py-2">
                            <div className="grid gap-1">
                              <Label>Theme/Title</Label>
                              <Input value={devoTitle} onChange={e => setDevoTitle(e.target.value)} placeholder="e.g. Strength in Stillness" />
                            </div>
                            <div className="grid gap-1">
                              <Label>Reference</Label>
                              <Input value={devoRef} onChange={e => setDevoRef(e.target.value)} placeholder="e.g. Psalm 46:10" />
                            </div>
                            <div className="grid gap-1">
                              <Label>Verse Text</Label>
                              <Textarea value={devoVerse} onChange={e => setDevoVerse(e.target.value)} placeholder="Be still, and know that I am God..." className="min-h-[80px]" />
                            </div>
                            <div className="grid gap-1">
                              <Label>Your Reflection</Label>
                              <Textarea value={devoReflection} onChange={e => setDevoReflection(e.target.value)} placeholder="What this means for our family..." className="min-h-[80px]" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddDevo} disabled={!devoTitle || !devoVerse || isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentDevo ? (
                    <>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{format(new Date(currentDevo.created_at), "MMMM do, yyyy")} • by {currentDevo.author_name}</div>
                      <h4 className="font-bold text-md italic">&quot;{currentDevo.reflection?.split('\n\n')[0] || 'Reflection'}&quot;</h4>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        {currentDevo.verse}
                      </p>
                      <p className="text-sm font-medium text-foreground leading-relaxed mt-2">
                        {currentDevo.reflection?.split('\n\n').slice(1).join('\n\n')}
                      </p>
                      <div className="pt-2">
                        <Badge variant="outline" className="text-[10px] font-bold text-accent border-accent/30">
                          {currentDevo.reference}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm font-medium">No devotional posted yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scripture of the Week */}
              <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Family Verse of the Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-md font-bold text-primary leading-tight">
                    &quot;As for me and my house, we will serve the Lord.&quot;
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">Joshua 24:15</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ══════ TAB 2: Church Work ══════ */}
        <TabsContent value="church-work" className="mt-6">
          <ChurchWorkTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
