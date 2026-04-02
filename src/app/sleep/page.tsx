"use client"

import * as React from "react"
import { 
  Moon, 
  Plus, 
  CloudMoon, 
  Bed, 
  Coffee, 
  Battery, 
  Clock, 
  Calendar as CalendarIcon,
  Loader2,
  TrendingUp,
  Info
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
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format, subDays, startOfDay } from "date-fns"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const SLEEP_QUALITIES = [
  { value: "excellent", label: "Excellent", color: "text-emerald-500" },
  { value: "good", label: "Good", color: "text-blue-500" },
  { value: "fair", label: "Fair", color: "text-amber-500" },
  { value: "poor", label: "Poor", color: "text-rose-500" },
]

export default function SleepPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isLogOpen, setIsLogOpen] = React.useState(false)
  const [sleepHours, setSleepHours] = React.useState("")
  const [sleepQuality, setSleepQuality] = React.useState("good")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Fetch Sleep Logs
  const sleepQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(
      collection(db, "sleepLogs"),
      where("familyId", "==", profile.familyId),
      orderBy("date", "desc"),
      limit(30)
    )
  }, [db, profile?.familyId])

  const { data: logs, loading } = useCollection(sleepQuery)

  // Chart Data Preparation (Hours over last 7 days)
  const chartData = React.useMemo(() => {
    if (!logs) return []
    const days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "EEE")).reverse()
    return days.map(day => {
      const dayLog = logs.find(l => {
        if (!l.date) return false
        const d = l.date.seconds ? new Date(l.date.seconds * 1000) : new Date(l.date)
        return format(d, "EEE") === day
      })
      return { day, hours: dayLog ? parseFloat(dayLog.hours || "0") : 0 }
    })
  }, [logs])

  const handleAddLog = () => {
    if (!db || !profile?.familyId || !sleepHours) return

    setIsSubmitting(true)
    const logData = {
      familyId: profile.familyId,
      userId: profile.id,
      userName: profile.displayName,
      hours: parseFloat(sleepHours),
      quality: sleepQuality,
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    addDoc(collection(db, "sleepLogs"), logData)
      .then(() => {
        setIsLogOpen(false)
        setSleepHours("")
        toast({ 
          title: "Rest Logged", 
          description: `Sweet dreams recorded! ${sleepHours} hours added to your log.` 
        })
      })
      .catch((err) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: "sleepLogs",
          operation: "create",
          requestResourceData: logData
        }))
      })
      .finally(() => setIsSubmitting(false))
  }

  const averageSleep = React.useMemo(() => {
    if (!logs || logs.length === 0) return 0
    const total = logs.reduce((sum, l) => sum + parseFloat(l.hours || "0"), 0)
    return (total / logs.length).toFixed(1)
  }, [logs])

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Rest & Sleep</h1>
          <p className="text-muted-foreground font-medium">Tracking the recovery of the Kapendeka Universe</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Log Sleep
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Morning Check-in</DialogTitle>
                <DialogDescription>How did you sleep last night?</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="hours">Hours Slept</Label>
                  <Input 
                    id="hours" 
                    type="number" 
                    step="0.5"
                    placeholder="e.g. 7.5" 
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Sleep Quality</Label>
                  <Select value={sleepQuality} onValueChange={setSleepQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLEEP_QUALITIES.map(q => (
                        <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddLog} disabled={!sleepHours || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Log
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-none shadow-xl bg-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Avg. Sleep Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageSleep} hrs</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium bg-white/10 w-fit px-2 py-1 rounded-full">
              <Battery className="h-3 w-3" /> Optimal: 7-9h
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center">Last Night</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {logs?.[0]?.hours || 0} hrs
            </div>
            <Badge variant="secondary" className="mt-2 font-bold bg-muted text-muted-foreground uppercase text-[10px]">
              {logs?.[0]?.quality || "No log"}
            </Badge>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Sleep Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{profile?.sleepStreak || 0} Days</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Consistent rest earns bonus points!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Sleep Chart */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-indigo-50/50 pb-2 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Sleep Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ChartContainer config={{ hours: { label: "Hours", color: "hsl(226 70% 55%)" } }}>
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="hours" fill="var(--color-hours)" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Recent Rest Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)
                ) : logs?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground font-medium">No sleep logs found. Start tracking your rest!</div>
                ) : (
                  logs?.map((log) => {
                    const qualityInfo = SLEEP_QUALITIES.find(q => q.value === log.quality) || SLEEP_QUALITIES[1]
                    return (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600`}>
                            <Moon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{log.userName || "Family Member"}</div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                              {log.date ? format(new Date(log.date.seconds * 1000), "MMM dd, yyyy") : "..."}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{log.hours}h</div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${qualityInfo.color}`}>
                            {qualityInfo.label}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Wind-down Suggestions */}
          <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-indigo-300" />
                Wind-down Routine
              </CardTitle>
              <CardDescription className="text-indigo-200 font-medium italic">Pre-sleep habits for the universe</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { title: "No Screens", time: "30m before", icon: Coffee },
                { title: "Journal Moment", time: "10m before", icon: CalendarIcon },
                { title: "Dim the Lights", time: "1h before", icon: CloudMoon },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{item.title}</div>
                    <div className="text-xs text-indigo-300 font-medium">{item.time}</div>
                  </div>
                </div>
              ))}
              <Button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl h-11 mt-4">
                Explore More Tips
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-indigo-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                <Info className="h-5 w-5" />
                Sleep Science
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Regular sleep schedules improve mood, cognitive function, and long-term health. The Kapendeka family aims for an average of 7.5 hours per night.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
