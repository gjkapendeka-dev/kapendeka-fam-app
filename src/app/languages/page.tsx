
"use client"

import * as React from "react"
import { 
  Languages, 
  Plus, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  Trophy, 
  Loader2,
  MessageCircle,
  PlayCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import Link from "next/link"

const LANGUAGES = [
  "isiZulu", "isiXhosa", "Afrikaans", "French", "Spanish", "German", "Swahili", "Shona"
]

export default function LanguageLearningPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedLang, setSelectedLang] = React.useState("isiZulu")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const progressQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("language_progress").select("*").eq("family_id", profile.family_id).order("last_lesson_date", { ascending: false })
    
  }, [supabase, profile?.family_id])

  const { data: progressList, loading } = useCollection(progressQuery)

  const handleAddLanguage = async () => {
    if (!supabase || !profile?.family_id) return

    setIsSubmitting(true)
    const data = {
      family_id: profile.family_id,
      user_id: profile.id,
      user_name: profile.display_name || profile.displayName,
      language: selectedLang,
      current_level: "Beginner",
      streak_days: 1,
      vocabulary_count: 0,
      last_lesson_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    try {
      const { error } = await supabase.from("language_progress").insert([data])
      if (error) throw error;
      setIsDialogOpen(false)
      toast({ title: "Portal Opened!", description: `Starting your ${selectedLang} journey.` })
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to start language.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Polyglot Universe</h1>
          <p className="text-muted-foreground font-medium">Learn new languages as a family</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Start New Language
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Pick a Language</DialogTitle>
              <DialogDescription>Which universe are we exploring today?</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 py-4">
              {LANGUAGES.map(lang => (
                <Button 
                  key={lang} 
                  variant={selectedLang === lang ? "default" : "outline"}
                  className="rounded-xl justify-start h-12"
                  onClick={() => setSelectedLang(lang)}
                >
                  {lang}
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={handleAddLanguage} disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Let's Go!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Progress Board */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Family Learning Progress
          </h2>
          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)
            ) : progressList?.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
                <Languages className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No one is learning yet</h3>
                <p className="text-muted-foreground">Pick a language and start your family streak!</p>
              </div>
            ) : (
                            progressList?.map((p) => (
                <Link href={`/languages/${p.language.toLowerCase()}`} key={p.id}>
                  <Card className="rounded-2xl border-none shadow-sm group hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                            {p.language.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{p.language}</h4>
                            <p className="text-xs text-muted-foreground font-medium">{p.user_name} • {p.current_level}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                          <Zap className="h-3 w-3 fill-amber-600" />
                          {p.streak_days} Day Streak
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Vocabulary Progress</span>
                          <span>{p.vocabulary_count || 0} words learned</span>
                        </div>
                        <Progress value={Math.min((p.vocabulary_count / 500) * 100, 100)} className="h-2" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold border-primary/20 text-primary">
                          <PlayCircle className="h-4 w-4 mr-2" /> Daily Lesson
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={(e) => e.preventDefault()}>
                          <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )))}
          </div>
        </div>

        {/* Learning Hub & Resources */}
        <div className="space-y-4">
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Language Masters
              </CardTitle>
              <CardDescription className="text-indigo-100">Top learners in the Kapendeka World</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Junior", lang: "isiZulu", xp: 1250 },
                { name: "George", lang: "Afrikaans", xp: 840 },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-white/10 p-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg opacity-50">#{i+1}</span>
                    <div>
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-[10px] opacity-70 uppercase font-bold tracking-tighter">{m.lang}</div>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-none font-bold">{m.xp} XP</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Word of the Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">Sawubona</div>
              <p className="text-sm text-muted-foreground font-medium mb-4">"Hello" (isiZulu)</p>
              <Button variant="link" className="p-0 h-auto text-primary font-bold">Add to my vocab list</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
