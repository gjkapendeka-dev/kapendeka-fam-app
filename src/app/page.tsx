"use client"

import * as React from "react"
import { 
  Bell, 
  Calendar as CalendarIcon, 
  ListTodo, 
  CloudSun, 
  TrendingUp,
  Award,
  Zap,
  Plus,
  ArrowRight,
  Info,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AIQuickAdd } from "@/components/ai-quick-add"
import { FamilyAIBrief } from "@/components/family-ai-brief"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, limit, orderBy } from "firebase/firestore"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function DashboardPage() {
  const [greeting, setGreeting] = React.useState("Good Morning")
  const { profile } = useUser()
  const db = useFirestore()

  React.useEffect(() => {
    const hours = new Date().getHours()
    if (hours >= 12 && hours < 17) setGreeting("Good Afternoon")
    else if (hours >= 17) setGreeting("Good Evening")
    else setGreeting("Good Morning")
  }, [])

  const eventsQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null;
    return query(
      collection(db, "events"),
      where("familyId", "==", profile.familyId),
      orderBy("startTime", "asc"),
      limit(3)
    );
  }, [db, profile?.familyId]);
  const { data: events } = useCollection(eventsQuery);

  const choresQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null;
    return query(
      collection(db, "chores"),
      where("familyId", "==", profile.familyId),
      limit(5)
    );
  }, [db, profile?.familyId]);
  const { data: chores } = useCollection(choresQuery);

  // Mock Notifications
  const notifications = [
    { title: "Junior completed: Laundry", time: "2h ago", type: "task" },
    { title: "New Memory posted by Sarah", time: "5h ago", type: "social" },
    { title: "Reminder: Dentist Appointment", time: "Tomorrow", type: "calendar" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-foreground">
              {greeting}, {profile?.displayName?.split(' ')[0] || "Family"}!
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Card className="hidden sm:flex items-center gap-3 px-4 py-2 bg-primary/5 border-primary/10 shadow-none rounded-xl">
              <CloudSun className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <span className="font-bold">24°C</span>
              </div>
            </Card>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-card border shadow-sm group">
                  <Bell className="h-5 w-5 group-hover:animate-swing" />
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-accent rounded-full border-2 border-background" />
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-3xl w-full sm:max-w-md">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="h-6 w-6 text-primary" />
                    Universe Activity
                  </SheetTitle>
                  <SheetDescription>Recent updates from the Kapendeka hub</SheetDescription>
                </SheetHeader>
                <div className="space-y-4">
                  {notifications.map((n, i) => (
                    <div key={i} className="p-4 bg-muted/20 rounded-2xl flex items-start gap-4 hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-primary/5">
                      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                        <Info className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground leading-tight">{n.title}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-bold uppercase">
                          <Clock className="h-3 w-3" />
                          {n.time}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-primary font-bold">Clear All Notifications</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <FamilyAIBrief />

      <AIQuickAdd />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="rounded-2xl shadow-sm border-primary/5 bg-gradient-to-br from-white to-primary/[0.02] p-4 md:p-6">
          <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <Award className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            Points
          </div>
          <div className="text-2xl md:text-3xl font-bold text-primary">{profile?.points || 0}</div>
        </Card>
        <Card className="rounded-2xl shadow-sm border-accent/5 bg-gradient-to-br from-white to-accent/[0.02] p-4 md:p-6">
          <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <Zap className="h-3 w-3 md:h-4 md:w-4 text-accent" />
            Streak
          </div>
          <div className="text-2xl md:text-3xl font-bold text-accent">{profile?.streakDays || 0}d</div>
        </Card>
        <Card className="col-span-2 sm:col-span-1 rounded-2xl shadow-sm p-4 md:p-6">
          <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 text-indigo-500" />
            Next Event
          </div>
          <div className="text-sm md:text-base font-bold truncate">{events?.[0]?.title || "Clear agenda"}</div>
        </Card>
        <Card className="col-span-2 sm:col-span-1 rounded-2xl shadow-sm p-4 md:p-6">
          <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
            Budget
          </div>
          <div className="text-sm md:text-base font-bold">R 4,250.00</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-headline font-bold">Upcoming</h2>
            <Button variant="link" className="text-primary font-bold text-sm h-auto p-0">Full Calendar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
          <div className="grid gap-3">
            {(events || []).map((item) => (
              <Card key={item.id} className="relative hover:shadow-md transition-shadow group cursor-pointer overflow-hidden border-none shadow-sm ring-1 ring-border/50">
                <div className={`h-full w-1 absolute left-0 top-0 bg-primary`} />
                <CardContent className="p-4 flex items-center justify-between ml-1">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-muted-foreground mb-0.5">
                      {item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}
                    </div>
                    <div className="text-base font-bold text-foreground truncate">{item.title}</div>
                  </div>
                  <Badge variant="secondary" className="bg-muted text-[9px] font-bold px-1.5 py-0 uppercase shrink-0">{item.type}</Badge>
                </CardContent>
              </Card>
            ))}
            {(!events || events.length === 0) && (
              <div className="text-center py-10 bg-muted/20 rounded-2xl border-2 border-dashed">
                <p className="text-sm text-muted-foreground font-medium">Your agenda is clear.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-headline font-bold">Daily Tasks</h2>
            <Button size="sm" variant="outline" className="rounded-lg h-8 font-bold text-xs">Assign <Plus className="h-3 w-3 ml-1" /></Button>
          </div>
          <Card className="rounded-2xl shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                Rotation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-5">
              {(chores || []).map((chore) => (
                <div key={chore.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-bold truncate ${chore.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{chore.title}</span>
                      <span className="text-[10px] text-muted-foreground font-medium truncate">For {chore.assignedTo || "All"}</span>
                    </div>
                    <Badge variant={chore.status === 'done' ? "outline" : "default"} className="font-bold text-[9px] bg-primary/10 text-primary border-none shrink-0">
                      +{chore.pointsReward || 50}
                    </Badge>
                  </div>
                  <Progress value={chore.status === 'done' ? 100 : 0} className="h-1" />
                </div>
              ))}
              <Button className="w-full mt-2 font-bold rounded-xl h-10 text-sm shadow-lg shadow-primary/20">View Hub Tasks</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
