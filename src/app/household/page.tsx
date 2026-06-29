"use client"

import * as React from "react"
import { 
  CheckSquare, 
  Plus, 
  RotateCw, 
  Trash2, 
  User, 
  Calendar as CalendarIcon,
  Star,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Filter
} from "lucide-react"
import { format, isAfter, startOfToday } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
export default function HouseholdPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Form State
  const [newTitle, setNewTitle] = React.useState("")
  const [newType, setNewType] = React.useState("chore")
  const [newAssignedTo, setNewAssignedTo] = React.useState("")
  const [newPoints, setNewPoints] = React.useState("50")
  const [newPriority, setNewPriority] = React.useState("medium")

  // Fetch Chores
  const choresQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("chores")
      .select("*")
      .eq("family_id", profile.family_id).order("due_date", { ascending: true })
  }, [supabase, profile?.family_id])
  const { data: chores, loading: choresLoading } = useCollection(choresQuery)

  // Fetch Todos
  const todosQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("todos")
      .select("*")
      .eq("family_id", profile.family_id).eq("is_shared", true)
  }, [supabase, profile?.family_id])
  const { data: todos } = useCollection(todosQuery)

  const handleCompleteChore = async (choreId: string, currentPoints: number) => {
    if (!supabase || !profile) return
    
    const { error: choreError } = await supabase.from("chores").update({
      status: "done",
      completed_at: new Date().toISOString(),
      completed_by: profile.id
    }).eq("id", choreId)

    if (!choreError) {
      // Award points (in a real app, this should be an RPC to ensure atomicity)
      const newPoints = (profile.points || 0) + currentPoints
      await supabase.from("profiles").update({ points: newPoints }).eq("id", profile.id)
      
      toast({
        title: "Chore Completed!",
        description: `You earned ${currentPoints} points for the Kapendeka rewards!`,
      })
    }
  }

  const handleAddTask = async () => {
    if (!supabase || !profile?.family_id || !newTitle) return

    const collectionName = newType === "chore" ? "chores" : "todos"
    const data = newType === "chore" ? {
      family_id: profile.family_id,
      title: newTitle,
      assigned_to: newAssignedTo || profile.id,
      points: parseInt(newPoints) || 50,
      priority: newPriority,
      status: "pending",
      due_date: new Date(Date.now() + 86400000).toISOString()
    } : {
      family_id: profile.family_id,
      title: newTitle,
      is_shared: true,
      status: "pending",
      assigned_to: newAssignedTo || profile.id,
      priority: newPriority,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase.from(collectionName).insert([data])
    if (!error) {
      setIsDialogOpen(false)
      setNewTitle("")
      toast({
        title: "Added Successfully",
        description: `${newTitle} has been added to the family hub.`,
      })
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Household Tasks</h1>
          <p className="text-muted-foreground font-medium">Keep the Kapendeka World running smoothly</p>
        </div>
        {profile?.role === 'parent' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Quick Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Family Task</DialogTitle>
                <DialogDescription>
                  Create a new chore or todo for the family.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Name</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Wash the car" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chore">Household Chore</SelectItem>
                        <SelectItem value="todo">General Todo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newType === "chore" ? (
                    <div className="grid gap-2">
                      <Label>Points</Label>
                      <Input type="number" value={newPoints} onChange={(e) => setNewPoints(e.target.value)} />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label>Priority</Label>
                      <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask} disabled={!newTitle}>Add to Hub</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="chores" className="w-full">
            <div className="flex items-center justify-between mb-3">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="chores" className="rounded-lg font-bold px-6">Chores</TabsTrigger>
                <TabsTrigger value="todos" className="rounded-lg font-bold px-6">Todos</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" className="font-bold text-muted-foreground">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </div>

            <TabsContent value="chores" className="space-y-4">
              {choresLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
                </div>
              ) : chores?.filter(c => c.status !== 'done').length === 0 ? (
                <Card className="border-2 border-dashed border-muted bg-transparent rounded-[2rem] p-12 text-center">
                  <div className="bg-white h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold">All caught up!</h3>
                  <p className="text-muted-foreground font-medium">No pending household chores. Rest up!</p>
                </Card>
              ) : (
                chores?.filter(c => c.status !== 'done').map((chore) => (
                  <Card key={chore.id} className="group hover:shadow-lg transition-all border-none shadow-sm ring-1 ring-border/50 rounded-2xl overflow-hidden">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider">
                            {chore.points} Points
                          </Badge>
                          {chore.rotation_enabled && (
                            <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-muted/50">
                              <RotateCw className="h-3 w-3 mr-1" /> Rotation
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {chore.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-1">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {chore.due_date ? format(new Date(chore.due_date), "MMM d") : "Today"}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {chore.assigned_to === profile?.id ? "Me" : "Family"}
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleCompleteChore(chore.id, chore.points)}
                        className="rounded-xl h-12 w-12 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
                      >
                        <CheckSquare className="h-6 w-6" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              ))}
            </TabsContent>

            <TabsContent value="todos" className="space-y-4">
              {todos?.map((todo) => (
                <Card key={todo.id} className="border-none shadow-sm ring-1 ring-border/50 rounded-2xl">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${todo.priority === 'high' ? 'bg-rose-100 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{todo.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium capitalize">{todo.priority} Priority • Shared</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground hover:text-emerald-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-indigo-600 to-primary text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                Leaderboard
              </CardTitle>
              <CardDescription className="text-indigo-100 font-medium">Family rankings this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "George", points: 850, level: 12, avatar: "G" },
                { name: "Junior", points: 420, level: 5, avatar: "J" },
                { name: "Sarah", points: 310, level: 3, avatar: "S" }
              ].map((member, i) => (
                <div key={member.name} className="flex items-center gap-4 bg-white/10 p-3 rounded-2xl">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{member.name}</span>
                      <span className="text-sm font-bold">{member.points} pts</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400" style={{ width: `${(member.points / 1000) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold rounded-xl h-11">
                View All Rewards
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Smart Rotation</CardTitle>
              <CardDescription className="font-medium text-xs">Fair task division for the household</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  <span>Upcoming Duty</span>
                  <span>April 12</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    <RotateCw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Laundry Day</div>
                    <div className="text-[10px] font-medium text-muted-foreground">Rotates to Junior next</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
