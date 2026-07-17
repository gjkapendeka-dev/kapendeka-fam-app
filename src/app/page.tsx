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
  Coffee,
  CloudRain,
  Snowflake,
  Edit3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"

import { useUser, useCollection, useSupabase } from "@/supabase"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format, formatDistanceToNow, isToday } from "date-fns"
import Link from "next/link"

export default function DashboardPage() {
  const [greeting, setGreeting] = React.useState("Good Morning")
  const [cycle, setCycle] = React.useState<"morning" | "afternoon" | "evening">("morning")
  const { profile } = useUser()
  const supabase = useSupabase()

  // Briefing State
  const [weather, setWeather] = React.useState<any>(null)
  const [isVerseModalOpen, setIsVerseModalOpen] = React.useState(false)
  const [tempVerse, setTempVerse] = React.useState("")

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

    // Fetch Weather
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
    if (apiKey) {
      // Defaulting to a common city, ideally this comes from settings
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=Johannesburg&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
           if(data.main) setWeather(data)
        }).catch(e => console.error("Weather fetch error", e))
    }
  }, [])

  const isParent = profile?.role === 'parent' || profile?.role === 'admin'

  const eventsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null;
    return supabase.from("events").select("*").eq("familyId", profile.familyId).order("startTime", { ascending: true }).limit(5);
  }, [supabase, profile?.familyId]);
  const { data: events } = useCollection(eventsQuery);

  const ritualsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null;
    return supabase.from("rituals").select("*").eq("familyId", profile.familyId)
      .in("timeOfDay", [cycle, "anytime"]).limit(4);
  }, [supabase, profile?.familyId, cycle]);
  const { data: rituals } = useCollection(ritualsQuery);

  const notificationsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null;
    return supabase.from("broadcasts").select("*").eq("family_id", profile.familyId).order("created_at", { ascending: false }).limit(6);
  }, [supabase, profile?.familyId]);
  const { data: broadcasts } = useCollection(notificationsQuery);

  const choresQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null;
    return supabase.from("chores").select("*").eq("familyId", profile.familyId).eq("status", "pending").limit(5);
  }, [supabase, profile?.familyId]);
  const { data: chores } = useCollection(choresQuery);

  const settingsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null;
    return supabase.from("family_settings").select("*").eq("family_id", profile.familyId);
  }, [supabase, profile?.familyId]);
  const { data: settingsData, mutate: mutateSettings } = useCollection(settingsQuery);
  const settings = settingsData?.[0] || null;

  const notifications = broadcasts?.map(b => ({
    title: b.message,
    time: formatDistanceToNow(new Date(b.created_at), { addSuffix: true }),
    type: b.type
  })) || []

  // Filter today's items for briefing
  const todaysEvents = events?.filter(e => e.startTime && isToday(new Date(e.startTime))) || [];
  
  const handleSaveVerse = async () => {
    if (!supabase || !profile?.familyId) return
    const payload = {
        family_id: profile.familyId,
        daily_verse: tempVerse,
        updated_by: profile.id
    }
    
    if (settings) {
        await supabase.from("family_settings").update(payload).eq("id", settings.id)
    } else {
        await supabase.from("family_settings").insert([payload])
    }
    
    setIsVerseModalOpen(false)
    if (mutateSettings) mutateSettings()
  }

  const defaultVerse = "I can do all things through Christ who strengthens me. - Philippians 4:13";

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-background p-3 md:p-5 space-y-4 md:space-y-5 max-w-[1600px] mx-auto pb-20 overflow-x-hidden">
      <header className="flex flex-col gap-2 pr-12 md:pr-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5">
                Kapendeka World Premium
              </Badge>
            </div>
            <h1 className="text-xl md:text-4xl font-headline font-bold tracking-tight text-foreground mt-1 leading-tight">
              {greeting}, <span className="text-primary">{profile?.display_name || "Explorer"}</span>
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-1.5 text-xs md:text-sm">
              <CalendarIcon className="h-3 w-3 text-primary/60" />
              {format(new Date(), "EEEE, MMMM do")}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-white border-none shadow-lg shadow-primary/5 group active:scale-95 transition-transform">
                  <Bell className="h-5 w-5 md:h-6 md:w-6 group-hover:animate-swing text-primary" />
                  <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-accent rounded-full border-[3px] border-white" />
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-[2rem] md:rounded-l-[3rem] w-full sm:max-w-md border-none shadow-2xl">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-2xl md:text-3xl font-black flex items-center gap-3">
                    <Bell className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                    Activity
                  </SheetTitle>
                  <SheetDescription className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Recent updates</SheetDescription>
                </SheetHeader>
                <div className="space-y-4">
                  {notifications.map((n, i) => {
                    return (
                      <div key={i} className="p-4 md:p-5 bg-muted/30 rounded-[1.5rem] md:rounded-[2rem] flex items-start gap-4 hover:bg-muted/50 transition-all cursor-pointer group">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Info className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="text-sm font-bold text-foreground leading-tight">{n.title}</div>
                          <div className="flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            <span>{n.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="ghost" className="w-full text-primary font-black uppercase tracking-widest text-[10px] mt-4">Clear Logs</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full mt-4">
        <TabsList className="bg-muted/50 p-1 rounded-2xl mb-2 sm:mb-6 flex max-w-xs mx-auto md:mx-0">
          <TabsTrigger value="overview" className="rounded-xl font-bold py-2 flex-1">Overview</TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-xl font-bold py-2 flex-1">Broadcasts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 md:gap-4">
            
            {/* Main Feed */}
            <div className="xl:col-span-8 space-y-4 md:space-y-5">

              {/* MORNING BRIEFING CARD */}
              <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-background border border-indigo-100 dark:border-indigo-900 rounded-[2rem] p-6 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Coffee className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-indigo-950 dark:text-indigo-50">Daily Briefing</h2>
                    <p className="text-indigo-600/80 text-sm font-bold uppercase tracking-widest">Everything you need today</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weather & Verse */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-white dark:bg-muted/50 p-4 rounded-2xl border shadow-sm">
                      <div className="text-sky-500">
                         {weather ? (
                           weather.weather[0].main === 'Rain' ? <CloudRain className="h-10 w-10" /> :
                           weather.weather[0].main === 'Snow' ? <Snowflake className="h-10 w-10" /> :
                           <Sun className="h-10 w-10" />
                         ) : <CloudSun className="h-10 w-10" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          {weather ? weather.name : "Johannesburg (Mock)"}
                        </div>
                        <div className="text-2xl font-black">
                          {weather ? `${Math.round(weather.main.temp)}°C` : "24°C"}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {weather ? weather.weather[0].description : "Partly Cloudy"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase tracking-widest">Daily Inspiration</Badge>
                        {isParent && (
                           <button 
                             onClick={() => {
                               setTempVerse(settings?.daily_verse || defaultVerse)
                               setIsVerseModalOpen(true)
                             }}
                             className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded-lg"
                           >
                             <Edit3 className="h-4 w-4" />
                           </button>
                        )}
                      </div>
                      <p className="text-sm font-medium italic text-foreground leading-relaxed">
                        "{settings?.daily_verse || defaultVerse}"
                      </p>
                    </div>
                  </div>

                  {/* Agenda & Chores */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3" /> Today's Agenda
                      </h3>
                      {todaysEvents.length > 0 ? (
                        <div className="space-y-2">
                          {todaysEvents.map(e => (
                             <div key={e.id} className="flex items-center gap-3 bg-white dark:bg-muted/30 p-3 rounded-xl border shadow-sm">
                               <div className="h-2 w-2 rounded-full bg-indigo-500" />
                               <div className="flex-1 min-w-0">
                                 <div className="font-bold text-sm truncate">{e.title}</div>
                                 <div className="text-xs text-muted-foreground">{e.startTime ? format(new Date(e.startTime), "HH:mm") : "Anytime"}</div>
                               </div>
                             </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-white dark:bg-muted/30 p-3 rounded-xl border">No events scheduled today.</div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ListTodo className="h-3 w-3" /> Pending Chores
                      </h3>
                      {chores && chores.length > 0 ? (
                        <div className="space-y-2">
                          {chores.map(c => (
                             <div key={c.id} className="flex items-center justify-between gap-3 bg-white dark:bg-muted/30 p-3 rounded-xl border shadow-sm">
                               <div className="font-bold text-sm truncate">{c.title}</div>
                               <Badge variant="outline" className="text-[9px] uppercase">{c.points} pts</Badge>
                             </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-white dark:bg-muted/30 p-3 rounded-xl border">All caught up on chores!</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Original Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl shadow-primary/5 bg-white p-4 md:p-5 group hover:shadow-primary/10 transition-all cursor-default relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Award className="h-4 w-4 text-primary" />
                    Influence
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-primary tracking-tighter">{profile?.points || 0}</div>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-2 uppercase">Total XP</p>
                </Card>

                <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl shadow-accent/5 bg-white p-4 md:p-5 group hover:shadow-accent/10 transition-all cursor-default relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 h-24 w-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-accent" />
                    Continuity
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-accent tracking-tighter">{profile?.streakDays || 0}d</div>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-2 uppercase">Active Streak</p>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transform hover:scale-[1.01] transition-transform cursor-pointer" onClick={() => window.location.href='/games'}>
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                    <span className="text-4xl">🎮</span>
                  </div>
                  <div className="text-left text-white">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">Kapendeka Games</h2>
                    <p className="text-indigo-100 font-medium text-sm mt-1">Host live quizzes or join a session</p>
                  </div>
                </div>
                <Button size="lg" className="rounded-2xl h-14 px-8 text-lg font-black bg-white text-indigo-600 hover:bg-slate-50 shadow-xl self-stretch md:self-center">
                  Play Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4 md:space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Universe Timeline</h2>
                  <Link href="/calendar">
                    <Button variant="ghost" className="text-primary font-black uppercase text-[9px] md:text-[10px] tracking-widest gap-2 h-auto py-2">
                      View All <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(events || []).length > 0 ? (
                    events?.map((item) => (
                      <Card key={item.id} className="group relative hover:shadow-2xl hover:-translate-y-1 transition-all border-none shadow-lg shadow-primary/5 bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                        <CardContent className="p-5 md:p-6 ml-1 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">
                                {item.startTime ? format(new Date(item.startTime), "MMM d 'at' HH:mm") : "TBD"}
                              </span>
                              <h3 className="text-lg md:text-xl font-bold mt-1 group-hover:text-primary transition-colors">{item.title}</h3>
                            </div>
                            <Badge className="bg-muted text-muted-foreground border-none font-black text-[7px] md:text-[8px] uppercase tracking-widest">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-auto pt-4 border-t border-muted/50">
                            <div className="flex items-center gap-1 shrink-0"><Clock className="h-3 w-3" /> Scheduled</div>
                            {item.location && <div className="truncate flex items-center gap-1 min-w-0"><Info className="h-3 w-3" /> {item.location}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-16 bg-white rounded-[2rem] shadow-sm border-2 border-dashed border-muted flex flex-col items-center justify-center space-y-4">
                      <div className="h-14 w-14 bg-muted/20 rounded-2xl flex items-center justify-center">
                        <CalendarIcon className="h-7 w-7 text-muted-foreground/30" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center px-4">The Timeline is Clear</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar / Rituals */}
            <div className="xl:col-span-4 space-y-4 md:space-y-5">
              <div className="space-y-4 md:space-y-4">
                <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                  Daily Rituals
                  <Badge className="bg-accent text-white border-none text-[8px] font-black tracking-[0.2em]">{cycle}</Badge>
                </h2>
                <Card className="rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-primary/10 border-none overflow-hidden bg-white">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 p-4 md:p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl md:rounded-[1.5rem] bg-white shadow-lg flex items-center justify-center">
                        <Target className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tighter">Consistency</CardTitle>
                        <CardDescription className="font-bold text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Daily Syncs</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-5 space-y-4">
                    {(rituals || []).length > 0 ? (
                      rituals?.map((ritual) => (
                        <div key={ritual.id} className="space-y-3 group cursor-pointer active:scale-[0.98] transition-all">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors truncate">{ritual.title}</span>
                              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider truncate">{ritual.description}</span>
                            </div>
                            <Button size="icon" className="rounded-xl md:rounded-2xl h-9 w-9 md:h-10 md:w-10 bg-primary/5 text-primary hover:bg-primary hover:text-white shadow-none group-hover:scale-110 transition-all shrink-0">
                              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                          </div>
                          <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/20" style={{ width: '10%' }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 space-y-4">
                        <Coffee className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                        <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-[0.2em]">No Rituals Defined</p>
                        <Link href="/rituals">
                          <Button variant="outline" className="rounded-xl font-black text-[9px] uppercase border-primary/20 text-primary h-8">Setup Portal</Button>
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

              <Card className="rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-indigo-900 to-black p-4 md:p-5 text-white relative overflow-hidden shadow-2xl mt-4">
                <div className="absolute top-0 right-0 p-4">
                  <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-white/10" />
                </div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-4">Command Center</h3>
                <p className="text-xs md:text-sm font-medium text-white/70 leading-relaxed mb-3">
                  The Kapendeka World is operating with 99% continuity. All nodes aligned.
                </p>
                <div className="flex gap-4">
                   <div className="flex flex-col">
                      <span className="text-[7px] md:text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Nodes</span>
                      <span className="text-base md:text-lg font-black">5 Live</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[7px] md:text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Uptime</span>
                      <span className="text-base md:text-lg font-black">365d</span>
                   </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="broadcasts">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            <div className="bg-primary/5 rounded-[2rem] p-6 md:p-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tight">Family Broadcasts</h2>
                <p className="text-muted-foreground font-bold text-sm mt-1">Announcements, Reminders, and Alerts</p>
              </div>
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="grid gap-4">
              {broadcasts && broadcasts.length > 0 ? (
                broadcasts.map(b => (
                  <Card key={b.id} className="rounded-3xl border-none shadow-md overflow-hidden">
                    <div className="h-2 w-full bg-primary" />
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                          {b.type === "reminder" ? <Clock className="h-6 w-6 text-primary" /> : <Info className="h-6 w-6 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <Badge variant="outline" className="mb-2 font-bold text-[10px] uppercase">{b.type}</Badge>
                          <h4 className="text-lg md:text-xl font-black leading-tight text-foreground">{b.message}</h4>
                          <p className="text-xs text-muted-foreground font-bold mt-2 flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(b.created_at), "PPP 'at' p")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm">
                  <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-black text-xl uppercase text-primary">No Broadcasts</h3>
                  <p className="text-muted-foreground font-bold text-sm">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Daily Verse Modal */}
      <Dialog open={isVerseModalOpen} onOpenChange={setIsVerseModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Daily Inspiration</DialogTitle>
            <DialogDescription>Share a Bible verse or quote with the family for today.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={tempVerse}
              onChange={e => setTempVerse(e.target.value)}
              placeholder="Enter verse or quote here..."
              className="min-h-[100px] rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVerse}>Save Inspiration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}