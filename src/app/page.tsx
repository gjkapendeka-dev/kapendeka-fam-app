
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
  Clock,
  Sparkles,
  ChevronRight,
  Target,
  Sun,
  Moon,
  Coffee
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
import { format } from "date-fns"
import Link from "next/link"

export default function DashboardPage() {
  const [greeting, setGreeting] = React.useState("Good Morning")
  const [cycle, setCycle] = React.useState<"morning" | "afternoon" | "evening">("morning")
  const { profile } = useUser()
  const db = useFirestore()

  React.useEffect(() => {
    const hours = new Date().getHours()
    if (hours >= 12 && hours < 17) {
      setGreeting("Good Afternoon")
      setCycle("afternoon")
    } else if (hours >= 17) {
      setGreeting("Good Evening")
      setCycle("evening")
    } else {
      setGreeting("Good Morning")
      setCycle("morning")
    }
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

  const ritualsQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null;
    return query(
      collection(db, "rituals"),
      where("familyId", "==", profile.familyId),
      where("timeOfDay", "in", [cycle, "anytime"]),
      limit(4)
    );
  }, [db, profile?.familyId, cycle]);
  const { data: rituals } = useCollection(ritualsQuery);

  // Mock Notifications
  const notifications = [
    { title: "Junior completed: Laundry", time: "2h ago", type: "task" },
    { title: "New Memory posted by Sarah", time: "5h ago", type: "social" },
    { title: "Reminder: Dentist Appointment", time: "Tomorrow", type: "calendar" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-background p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col gap-6 md:pr-0 pr-14">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5">
                Kapendeka Universe Premium
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold tracking-tight text-foreground mt-2">
              {greeting}, {profile?.displayName?.split(' ')[0] || "Explorer"}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(new Date(), "EEEE, MMMM do yyyy")}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Card className="hidden lg:flex items-center gap-4 px-5 py-3 bg-white shadow-xl shadow-primary/5 border-none rounded-2xl">
              <div className={`p-2 rounded-xl ${cycle === 'morning' ? 'bg-amber-50 text-amber-500' : cycle === 'afternoon' ? 'bg-sky-50 text-sky-500' : 'bg-indigo-50 text-indigo-500'}`}>
                {cycle === 'morning' ? <Sun className="h-5 w-5" /> : cycle === 'afternoon' ? <CloudSun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Joburg</span>
                <span className="text-lg font-black">24°C</span>
              </div>
            </Card>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-12 w-12 rounded-2xl bg-white border-none shadow-lg shadow-primary/5 group">
                  <Bell className="h-6 w-6 group-hover:animate-swing text-primary" />
                  <span className="absolute top-3 right-3 h-3 w-3 bg-accent rounded-full border-4 border-white" />
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-[3rem] w-full sm:max-w-md border-none shadow-2xl">
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-3xl font-black flex items-center gap-3">
                    <Bell className="h-8 w-8 text-primary" />
                    Activity
                  </SheetTitle>
                  <SheetDescription className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Recent Kapendeka updates</SheetDescription>
                </SheetHeader>
                <div className="space-y-4">
                  {notifications.map((n, i) => (
                    <div key={i} className="p-5 bg-muted/30 rounded-[2rem] flex items-start gap-4 hover:bg-muted/50 transition-all cursor-pointer group">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Info className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="text-sm font-bold text-foreground leading-tight">{n.title}</div>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <Clock className="h-3 w-3" />
                          {n.time}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-primary font-black uppercase tracking-widest text-[10px] mt-4">Clear Logs</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="xl:col-span-8 space-y-8">
          <FamilyAIBrief />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-xl shadow-primary/5 bg-white p-8 group hover:shadow-primary/10 transition-all cursor-default relative overflow-hidden">
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <Award className="h-4 w-4 text-primary" />
                Hub Influence
              </div>
              <div className="text-5xl font-black text-primary tracking-tighter">{profile?.points || 0}</div>
              <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase">Total points earned</p>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-xl shadow-accent/5 bg-white p-8 group hover:shadow-accent/10 transition-all cursor-default relative overflow-hidden">
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-accent" />
                Continuity
              </div>
              <div className="text-5xl font-black text-accent tracking-tighter">{profile?.streakDays || 0}d</div>
              <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase">Family streak active</p>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-xl shadow-indigo-500/5 bg-white p-8 group hover:shadow-indigo-500/10 transition-all cursor-default relative overflow-hidden">
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-indigo-500" />
                Mission
              </div>
              <div className="text-lg font-black text-foreground leading-tight line-clamp-2">
                {events?.[0]?.title || "Awaiting Next Directive"}
              </div>
              <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase">Priority Event</p>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight uppercase">Universe Timeline</h2>
              <Link href="/calendar">
                <Button variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest gap-2">
                  Expand Access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(events || []).length > 0 ? (
                events?.map((item) => (
                  <Card key={item.id} className="group relative hover:shadow-2xl hover:-translate-y-1 transition-all border-none shadow-lg shadow-primary/5 bg-white rounded-[2rem] overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                    <CardContent className="p-6 ml-1.5 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                            {item.startTime ? format(new Date(item.startTime), "HH:mm") : "TBD"}
                          </span>
                          <h3 className="text-xl font-bold mt-1 group-hover:text-primary transition-colors">{item.title}</h3>
                        </div>
                        <Badge className="bg-muted text-muted-foreground border-none font-black text-[8px] uppercase tracking-widest">
                          {item.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-auto pt-4 border-t border-muted/50">
                        <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Scheduled</div>
                        {item.location && <div className="truncate flex items-center gap-1"><Info className="h-3.5 w-3.5" /> {item.location}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-20 bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-muted flex flex-col items-center justify-center space-y-4">
                  <div className="h-16 w-16 bg-muted/20 rounded-[2rem] flex items-center justify-center">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">The Timeline is Clear</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Rituals */}
        <div className="xl:col-span-4 space-y-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
              Daily Rituals
              <Badge className="bg-accent text-white border-none text-[8px] font-black tracking-[0.2em]">{cycle}</Badge>
            </h2>
            <Card className="rounded-[2.5rem] shadow-2xl shadow-primary/10 border-none overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-[1.5rem] bg-white shadow-lg flex items-center justify-center">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter">Consistency Hub</CardTitle>
                    <CardDescription className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Daily family syncs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {(rituals || []).length > 0 ? (
                  rituals?.map((ritual) => (
                    <div key={ritual.id} className="space-y-3 group cursor-pointer">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{ritual.title}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{ritual.description}</span>
                        </div>
                        <Button size="icon" className="rounded-2xl h-10 w-10 bg-primary/5 text-primary hover:bg-primary hover:text-white shadow-none group-hover:scale-110 transition-all">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/20" style={{ width: '10%' }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <Coffee className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">No Rituals Defined</p>
                    <Link href="/rituals">
                      <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase border-primary/20 text-primary">Setup Rituals</Button>
                    </Link>
                  </div>
                )}
                
                <div className="pt-6 border-t border-muted/50">
                  <Link href="/rituals">
                    <Button className="w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl shadow-xl shadow-primary/20">Manage Rituals</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <h2 className="text-2xl font-black tracking-tight uppercase">Quick Portal</h2>
             <AIQuickAdd />
          </div>

          <Card className="rounded-[2rem] bg-gradient-to-br from-indigo-900 to-black p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="h-8 w-8 text-white/10" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Universe Command</h3>
            <p className="text-sm font-medium text-white/70 leading-relaxed mb-6">
              Your Kapendeka Universe is currently operating with 99% continuity. All family nodes are aligned.
            </p>
            <div className="flex gap-4">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Nodes</span>
                  <span className="text-lg font-black">5 Live</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Uptime</span>
                  <span className="text-lg font-black">365d</span>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
