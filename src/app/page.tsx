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
  Mic,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AIQuickAdd } from "@/components/ai-quick-add"

export default function DashboardPage() {
  const [greeting, setGreeting] = React.useState("Good Morning")

  React.useEffect(() => {
    const hours = new Date().getHours()
    if (hours >= 12 && hours < 17) setGreeting("Good Afternoon")
    else if (hours >= 17) setGreeting("Good Evening")
    else setGreeting("Good Morning")
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground">{greeting}, Kapendeka Family!</h1>
            <p className="text-muted-foreground font-medium">It's a beautiful day in Johannesburg. You have 3 chores left today.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Card className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-primary/10 shadow-none">
            <CloudSun className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <span className="font-bold">24°C</span>
              <span className="text-muted-foreground ml-1">Sunny</span>
            </div>
          </Card>
          <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl bg-card border shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-accent rounded-full border-2 border-background" />
          </Button>
        </div>
      </header>

      {/* AI Quick Add Bar */}
      <AIQuickAdd />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl shadow-sm border-primary/5 bg-gradient-to-br from-white to-primary/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Family Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">1,250</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-accent/5 bg-gradient-to-br from-white to-accent/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">7 Days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up, George!</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-indigo-500" />
              Next Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">Church Service</div>
            <p className="text-sm text-muted-foreground">Sunday, 09:00 AM</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Budget Left
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">R 4,250.00</div>
            <p className="text-xs text-muted-foreground mt-1">Daily limit: R 500</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold">Upcoming Agenda</h2>
            <Button variant="link" className="text-primary font-bold">View Full Calendar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
          <div className="grid gap-4">
            {[
              { time: "Today, 15:30", title: "Soccer Practice", person: "Junior", color: "bg-blue-500" },
              { time: "Today, 19:00", title: "Dinner: Chicken Stir-Fry", person: "Family", color: "bg-orange-500" },
              { time: "Tomorrow, 08:00", title: "Morning Prayer", person: "All", color: "bg-primary" }
            ].map((item, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow group cursor-pointer overflow-hidden border-none shadow-sm ring-1 ring-border/50">
                <div className={`h-full w-1 absolute left-0 top-0 ${item.color}`} />
                <CardContent className="p-5 flex items-center justify-between ml-1">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground mb-1">{item.time}</div>
                    <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-muted text-[10px] font-bold px-1.5 py-0 uppercase">{item.person}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chores & Household Tasks */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold">Chores</h2>
            <Button size="sm" variant="outline" className="rounded-lg h-9 font-bold">Assign <Plus className="h-4 w-4 ml-1" /></Button>
          </div>
          <Card className="rounded-2xl shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                Today's Rotation
              </CardTitle>
              <CardDescription className="text-xs font-medium">Earn points for the Family Ice Cream night!</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { title: "Take out Trash", assigned: "Junior", points: 50, progress: 0 },
                { title: "Wash the Car", assigned: "George", points: 100, progress: 100 },
                { title: "Dog Feeding", assigned: "Junior", points: 20, progress: 0 }
              ].map((chore, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`font-bold ${chore.progress === 100 ? 'line-through text-muted-foreground' : ''}`}>{chore.title}</span>
                      <span className="text-xs text-muted-foreground font-medium">Assigned to {chore.assigned}</span>
                    </div>
                    <Badge variant={chore.progress === 100 ? "outline" : "default"} className="font-bold text-[10px] bg-primary/10 text-primary border-none">
                      +{chore.points} pts
                    </Badge>
                  </div>
                  <Progress value={chore.progress} className="h-1.5" />
                </div>
              ))}
              <Button className="w-full mt-4 font-bold rounded-xl h-11 shadow-lg shadow-primary/20">View All Tasks</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}