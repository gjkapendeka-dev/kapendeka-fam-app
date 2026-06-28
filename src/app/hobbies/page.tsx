"use client"

import * as React from "react"
import { 
  Gamepad2, 
  Plus, 
  Palette, 
  Music, 
  Dumbbell, 
  Book, 
  Camera, 
  Target,
  TrendingUp,
  Loader2,
  ChevronRight
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

const HOBBY_ICONS = [
  { label: "Gaming", icon: Gamepad2, color: "text-blue-500 bg-blue-50" },
  { label: "Art", icon: Palette, color: "text-rose-500 bg-rose-50" },
  { label: "Music", icon: Music, color: "text-purple-500 bg-purple-50" },
  { label: "Fitness", icon: Dumbbell, color: "text-emerald-500 bg-emerald-50" },
  { label: "Reading", icon: Book, color: "text-amber-500 bg-amber-50" },
  { label: "Photography", icon: Camera, color: "text-sky-500 bg-sky-50" },
]

export default function HobbiesPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [hobbyName, setHobbyName] = React.useState("")
  const [selectedIcon, setSelectedIcon] = React.useState("Gaming")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const hobbiesQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("hobbies").select("*").eq("familyId", profile.familyId)
    
  }, [supabase, profile?.familyId])

  const { data: hobbies, loading } = useCollection(hobbiesQuery)

  const handleAddHobby = () => {
    if (!supabase || !profile?.familyId || !hobbyName) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      userId: profile.id,
      userName: profile.displayName,
      name: hobbyName,
      type: selectedIcon,
      progress: {
        currentLevel: 1,
        xp: 0,
        streak: 1
      },
      createdAt: new Date().toISOString(),
    }

    supabase.from("hobbies").insert([data])
      .then(() => {
        setIsDialogOpen(false)
        setHobbyName("")
        toast({ title: "Passion Registered", description: `${hobbyName} added to your universe profile.` })
      })
      .then(() => setIsSubmitting(false))
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Hobbies & Hobbies</h1>
          <p className="text-muted-foreground font-medium">Tracking passions and personal growth in the Universe</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> New Hobby
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Start Something New</DialogTitle>
              <DialogDescription>What are you exploring today?</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Hobby Name</Label>
                <Input placeholder="e.g. Urban Gardening" value={hobbyName} onChange={(e) => setHobbyName(e.target.value)} />
              </div>
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {HOBBY_ICONS.map(item => (
                  <Button 
                    key={item.label} 
                    variant={selectedIcon === item.label ? "default" : "outline"}
                    className="h-20 flex-col gap-1 rounded-xl"
                    onClick={() => setSelectedIcon(item.label)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddHobby} disabled={!hobbyName || isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-[2.5rem]" />)
            ) : hobbies?.length === 0 ? (
              <div className="col-span-full py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed text-center">
                <Gamepad2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No hobbies tracked yet</h3>
                <p className="text-muted-foreground">Start tracking your personal projects and growth!</p>
              </div>
            ) : (
              hobbies?.map((hobby) => {
                const iconInfo = HOBBY_ICONS.find(i => i.label === hobby.type) || HOBBY_ICONS[0]
                return (
                  <Card key={hobby.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${iconInfo.color}`}>
                          <iconInfo.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase border-muted/50">
                          Lvl {hobby.progress?.currentLevel || 1}
                        </Badge>
                      </div>
                      <h4 className="text-xl font-bold mb-1">{hobby.name}</h4>
                      <p className="text-xs text-muted-foreground font-medium mb-4">{hobby.userName}'s Journey</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                          <span>Progress</span>
                          <span>XP {hobby.progress?.xp || 0} / 500</span>
                        </div>
                        <Progress value={((hobby.progress?.xp || 0) / 500) * 100} className="h-1.5" />
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <Button variant="ghost" size="sm" className="font-bold text-primary h-8 px-2 rounded-lg">
                          Log Session
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Universe Hobbies
              </CardTitle>
              <CardDescription className="text-indigo-100">Top contributors this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "George", hobby: "Gardening", xp: 120 },
                { name: "Junior", hobby: "Chess", xp: 85 },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-white/10 p-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg opacity-50">#{i+1}</span>
                    <div>
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-[10px] opacity-70 uppercase font-bold">{m.hobby}</div>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-none">+{m.xp} XP</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-muted/30 p-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Daily Inspiration</h4>
            <p className="text-sm font-medium italic leading-relaxed">
              "Every master was once a beginner. Keep practicing your {hobbies?.[0]?.name || 'passion'} today."
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
