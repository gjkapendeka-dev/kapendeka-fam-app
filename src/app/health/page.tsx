"use client"

import * as React from "react"
import { 
  HeartPulse, 
  Plus, 
  Activity, 
  Droplets, 
  Moon, 
  Stethoscope, 
  Thermometer, 
  Smartphone,
  TrendingUp,
  Loader2
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { useUser, useCollection, useSupabase, useDoc } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import { format, subDays } from "date-fns"
const LOG_TYPES = [
  { value: "steps", label: "Steps", icon: Activity, color: "text-emerald-500" },
  { value: "water", label: "Water (L)", icon: Droplets, color: "text-blue-500" },
  { value: "sleep", label: "Sleep (Hrs)", icon: Moon, color: "text-indigo-500" },
  { value: "mood", label: "Mood", icon: HeartPulse, color: "text-rose-500" },
  { value: "screenTime", label: "Screen Time (Hrs)", icon: Smartphone, color: "text-orange-500" },
]

export default function HealthPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isLogOpen, setIsLogOpen] = React.useState(false)
  const [logType, setLogType] = React.useState("steps")
  const [logValue, setLogValue] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Fetch Health Profile
  const profileQuery = React.useMemo(() => {
    if (!supabase || !profile?.id) return null
    return supabase.from("healthProfiles")
      .select("*")
      .eq("id", profile.id)
  }, [supabase, profile?.id])
  const { data: healthProfiles } = useCollection(profileQuery)
  const healthProfile = healthProfiles?.[0] || null

  // Fetch Health Logs (last 30)
  const logsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("health_logs")
      .select("*")
      .eq("familyId", profile.familyId).order("date", { ascending: false }).limit(30)
  }, [supabase, profile?.familyId])
  const { data: logs, loading: logsLoading } = useCollection(logsQuery)

  // Chart Data Preparation (Steps over last 7 days)
  const chartData = React.useMemo(() => {
    if (!logs) return []
    const days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), "EEE")).reverse()
    return days.map(day => {
      const dayLogs = logs.filter(l => l.type === "steps" && format(new Date(l.date?.seconds * 1000), "EEE") === day)
      const totalSteps = dayLogs.reduce((sum, l) => sum + parseInt(l.value || "0"), 0)
      return { day, steps: totalSteps }
    })
  }, [logs])

  const handleAddLog = async () => {
    if (!supabase || !profile?.familyId || !logValue) return

    setIsSubmitting(true)
    const logData = {
      familyId: profile.familyId,
      userId: profile.id,
      userName: profile.displayName,
      type: logType,
      value: logValue,
      date: new Date().toISOString(),
    }

    const { error } = await supabase.from("health_logs").insert([logData])
    setIsSubmitting(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    setIsLogOpen(false)
    setLogValue("")
    toast({ title: "Wellness Logged", description: `${logType} updated in your universe hub.` })
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Health & Wellness</h1>
          <p className="text-muted-foreground font-medium">Tracking the vitality of the Kapendeka Universe</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Wellness Check-in</DialogTitle>
                <DialogDescription>Add a daily health metric to your profile.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Activity Type</Label>
                  <Select value={logType} onValueChange={setLogType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOG_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="log-value">Value</Label>
                  <Input 
                    id="log-value" 
                    type="number" 
                    placeholder="e.g. 10000" 
                    value={logValue}
                    onChange={(e) => setLogValue(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddLog} disabled={!logValue || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save to Hub
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Activity Chart */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Weekly Step Counter
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ChartContainer config={{ steps: { label: "Steps", color: "hsl(var(--primary)" } }}>
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="steps" fill="var(--color-steps)" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Logs Table */}
          <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Recent Wellness Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logsLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)
                ) : logs?.length === 0 ? (
                  <div className="text-center py-5 text-muted-foreground font-medium">No health logs found. Start tracking today!</div>
                ) : (
                  logs?.map((log) => {
                    const typeInfo = LOG_TYPES.find(t => t.value === log.type) || LOG_TYPES[0]
                    return (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${typeInfo.color}`}>
                            <typeInfo.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{log.userName || "Family Member"}</div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{typeInfo.label}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{log.value}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {log.date ? format(new Date(log.date.seconds * 1000), "HH:mm") : ", ..."}
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

        <div className="space-y-4">
          {/* Medical Profile Card */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical Profile
              </CardTitle>
              <CardDescription className="text-rose-100 font-medium">Quick reference for {profile?.displayName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest opacity-80">Allergies</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {healthProfile?.allergies?.length > 0 ? (
                    healthProfile.allergies.map((a: string) => (
                      <Badge key={a} className="bg-white/20 text-white border-none font-bold">
                        {a}
                      </Badge>
                    )
                  )) : (
                    <span className="text-sm font-medium opacity-60">None listed</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest opacity-80">Current Medications</Label>
                <div className="space-y-2 mt-2">
                  {healthProfile?.medications?.length > 0 ? (
                    healthProfile.medications.map((m: string) => (
                      <div key={m} className="flex items-center gap-2 text-sm font-bold bg-white/10 p-2 rounded-xl">
                        <Thermometer className="h-4 w-4" />
                        {m}
                      </div>
                    )
                  )) : (
                    <span className="text-sm font-medium opacity-60">No active medications</span>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Blood Type</span>
                  <Badge className="bg-white text-rose-600 font-bold text-lg px-3">{healthProfile?.bloodType || "O+"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wellness Tips Card */}
          <Card className="rounded-2xl border-none shadow-sm bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-accent">
                <Activity className="h-5 w-5" />
                Daily Wellness Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-muted-foreground italic">
                "Take a 10-minute walk after lunch to boost your afternoon focus and digestion."
              </p>
              <Button variant="link" className="p-0 h-auto mt-4 text-accent font-bold">Read more wellness tips</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
