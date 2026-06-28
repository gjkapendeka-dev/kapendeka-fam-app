
"use client"

import * as React from "react"
import { 
  PartyPopper, 
  Plus, 
  Cake, 
  Gift, 
  Heart, 
  Star, 
  Calendar as CalendarIcon,
  Search,
  Loader2,
  ChevronRight
} from "lucide-react"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"

export default function CelebrationsPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState("birthday")
  const [date, setDate] = React.useState("")

  const celebrationsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("celebrations").select("*").eq("familyId", profile.familyId).order("date", { ascending: true })
    
  }, [supabase, profile?.familyId])

  const { data: celebrations, loading } = useCollection(celebrationsQuery)

  const handleAddCelebration = () => {
    if (!supabase || !profile?.familyId || !name) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      name,
      type,
      date, // Recurring date string YYYY-MM-DD
      createdAt: new Date().toISOString(),
    }

    supabase.from("celebrations").insert([data])
      .then(() => {
        setIsDialogOpen(false)
        setName("")
        toast({ title: "Celebration Added", description: `Marked ${name}'s ${type} in the hub.` })
      })
      .then(() => setIsSubmitting(false))
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Celebrations & Milestones</h1>
          <p className="text-muted-foreground font-medium">Never miss a beat in the Kapendeka Universe</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-accent shadow-lg shadow-accent/20">
              <Plus className="h-4 w-4 mr-2" /> Add Date
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Mark a Special Occasion</DialogTitle>
              <DialogDescription>Add a birthday, anniversary, or family milestone.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Event/Person Name</Label>
                <Input placeholder="e.g. George's Birthday" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Occasion Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="other">Other Milestone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCelebration} disabled={!name || isSubmitting} className="bg-accent hover:bg-accent/90">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Hub
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-primary" />
            Upcoming Joy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-3xl" />)
            ) : celebrations?.length === 0 ? (
              <div className="col-span-full py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed text-center">
                <PartyPopper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No celebrations marked</h3>
                <p className="text-muted-foreground">Start marking important dates to get reminders!</p>
              </div>
            ) : (
              celebrations?.map((celeb) => (
                <Card key={celeb.id} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white hover:shadow-lg transition-all group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${celeb.type === 'birthday' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                        {celeb.type === 'birthday' ? <Cake className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase border-muted/50 text-muted-foreground">
                        {celeb.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <h4 className="text-xl font-bold group-hover:text-primary transition-colors">{celeb.name}</h4>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      {celeb.date ? format(new Date(celeb.date), "MMMM dd") : "TBD"}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="font-bold text-accent h-8 rounded-lg px-2">
                        <Gift className="h-4 w-4 mr-1.5" /> Gift Ideas
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-accent to-blue-600 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Next Big Event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {celebrations?.[0] ? (
                <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{celebrations[0].type}</div>
                  <h3 className="text-2xl font-bold">{celebrations[0].name}</h3>
                  <p className="text-sm font-medium mt-2">Coming up on {format(new Date(celebrations[0].date), "MMMM dd")}</p>
                </div>
              ) : (
                <p className="text-sm font-medium opacity-70">Add a date to see the countdown!</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Family Motto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-md font-bold text-primary leading-tight italic">
                "{profile?.familyMotto || "One Family, One Universe"}"
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
