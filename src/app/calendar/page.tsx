"use client"

import * as React from "react"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Users,
  Info,
  Filter,
  Check
} from "lucide-react"
import { format, startOfDay, isSameDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
const EVENT_TYPES = [
  { value: "work", label: "Work", color: "bg-blue-500" },
  { value: "school", label: "School", color: "bg-orange-500" },
  { value: "church", label: "Church", color: "bg-purple-500" },
  { value: "sports", label: "Sports", color: "bg-emerald-500" },
  { value: "medical", label: "Medical", color: "bg-rose-500" },
  { value: "vacation", label: "Vacation", color: "bg-sky-500" },
  { value: "holiday", label: "Holiday", color: "bg-amber-500" },
  { value: "other", label: "Other", color: "bg-slate-500" },
]

export default function CalendarPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Form State
  const [newTitle, setNewTitle] = React.useState("")
  const [newType, setNewType] = React.useState("other")
  const [newLocation, setNewLocation] = React.useState("")
  const [newDesc, setNewDesc] = React.useState("")
  const [newStartTime, setNewStartTime] = React.useState("09:00")

  const eventsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("calendar_events")
      .select("*")
      .eq("familyId", profile.familyId).order("startTime", { ascending: true })
  }, [supabase, profile?.familyId])

  const { data: events, loading } = useCollection(eventsQuery)

  const selectedDateEvents = React.useMemo(() => {
    if (!events || !date) return []
    const start = startOfDay(date)
    return events.filter(event => {
      if (!event.startTime) return false
      const eventDate = startOfDay(new Date(event.startTime))
      return isSameDay(eventDate, start)
    })
  }, [events, date])

  const handleAddEvent = async () => {
    if (!supabase || !profile?.familyId || !date || !newTitle) return

    const [hours, minutes] = newStartTime.split(":").map(Number)
    const startTimeDate = new Date(date)
    startTimeDate.setHours(hours, minutes, 0, 0)
    
    const endTimeDate = new Date(startTimeDate)
    endTimeDate.setHours(startTimeDate.getHours() + 1)

    const eventData = {
      familyId: profile.familyId,
      title: newTitle,
      type: newType,
      location: newLocation,
      description: newDesc,
      startTime: startTimeDate.toISOString(),
      endTime: endTimeDate.toISOString(),
      assignedTo: [profile.id],
      isRecurring: false,
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase.from("calendar_events").insert([eventData])
    if (!error) {
      setIsDialogOpen(false)
      setNewTitle("")
      setNewType("other")
      setNewLocation("")
      setNewDesc("")
      toast({
        title: "Event Added",
        description: `${newTitle} has been scheduled.`,
      })
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:pr-0 pr-14">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Family Calendar</h1>
          <p className="text-muted-foreground font-medium">Coordinate the Kapendeka schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Family Event</DialogTitle>
                <DialogDescription>
                  Add a new activity to the shared family calendar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Sunday Braai" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Start Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="e.g. Grandma's House" 
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Notes</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Any extra details, ..." 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddEvent} disabled={!newTitle}>Save Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar UI */}
        <Card className="lg:col-span-5 rounded-3xl border-none shadow-xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 pb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Pick a Date
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none w-full max-w-[400px]"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold",
                day_today: "bg-accent/10 text-accent font-bold ring-1 ring-accent/30 rounded-xl",
                day: "h-12 w-12 p-0 font-medium aria-selected:opacity-100 hover:bg-muted/50 rounded-xl transition-colors",
              }}
            />
          </CardContent>
          <div className="px-6 py-4 border-t bg-muted/20">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Legend</h4>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.slice(0, 4).map(t => (
                <div key={t.value} className="flex items-center gap-2 text-xs font-medium">
                  <div className={`h-2 w-2 rounded-full ${t.color}`} />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right Column: Day View */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-lg">
                {date ? format(date, "d") : ""}
              </span>
              <span>{date ? format(date, "MMMM yyyy") : "Select a date"}</span>
            </h2>
            <Badge variant="secondary" className="font-bold bg-muted text-muted-foreground border-none">
              {selectedDateEvents.length} Events
            </Badge>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-2xl" />)}
              </div>
            ) : selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => {
                const typeInfo = EVENT_TYPES.find(t => t.value === event.type) || EVENT_TYPES[7]
                return (
                  <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-border/50 rounded-2xl overflow-hidden">
                    <div className={`h-full w-1.5 absolute left-0 top-0 ${typeInfo.color}`} />
                    <CardContent className="p-6 ml-1.5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`${typeInfo.color} border-none font-bold text-[10px] uppercase`}>
                              {typeInfo.label}
                            </Badge>
                            {event.isRecurring && (
                              <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                                Recurring
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium pt-1">
                            {event.startTime && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-primary/60" />
                                {format(new Date(event.startTime), "HH:mm")}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-primary/60" />
                                {event.location}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-primary/60" />
                              Family Members
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5">
                          <Info className="h-5 w-5" />
                        </Button>
                      </div>
                      {event.description && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-xl text-sm font-medium text-muted-foreground leading-relaxed">
                          {event.description}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground">Quiet day ahead!</h4>
                  <p className="text-muted-foreground font-medium max-w-[250px] mx-auto mt-1">
                    No events scheduled for this date. Time for some spontaneous family fun?
                  </p>
                </div>
                <Button variant="outline" className="rounded-xl border-primary/20 text-primary font-bold" onClick={() => setIsDialogOpen(true)}>
                  Schedule Something
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
