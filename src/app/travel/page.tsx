"use client"

import * as React from "react"
import { 
  Plane, 
  Plus, 
  MapPin, 
  Calendar as CalendarIcon, 
  Backpack, 
  CheckCircle2, 
  Circle, 
  ChevronRight,
  Loader2,
  Briefcase
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
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function TravelPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [destination, setDestination] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  const tripsQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(
      collection(db, "trips"),
      where("familyId", "==", profile.familyId),
      orderBy("dates.start", "asc")
    )
  }, [db, profile?.familyId])

  const { data: trips, loading } = useCollection(tripsQuery)

  const handleAddTrip = () => {
    if (!db || !profile?.familyId || !destination) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      destination,
      dates: {
        start: startDate,
        end: endDate
      },
      packingList: [
        { item: "Passports", packed: false },
        { item: "Sunscreen", packed: false },
        { item: "Chargers", packed: false }
      ],
      createdAt: serverTimestamp(),
    }

    addDoc(collection(db, "trips"), data)
      .then(() => {
        setIsDialogOpen(false)
        setDestination("")
        toast({ title: "Trip Planned!", description: `Packing lists for ${destination} generated.` })
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Travel & Vacations</h1>
          <p className="text-muted-foreground font-medium">Planning the next Kapendeka family adventure</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Plan Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>New Family Voyage</DialogTitle>
              <DialogDescription>Where is the Universe heading next?</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Destination</Label>
                <Input placeholder="e.g. Cape Town" value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTrip} disabled={!destination || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Itinerary
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Upcoming Journeys
          </h2>

          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-[2.5rem]" />)
            ) : trips?.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                <Plane className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No trips planned</h3>
                <p className="text-muted-foreground">Start planning your next holiday or weekend getaway!</p>
              </div>
            ) : (
              trips?.map((trip) => (
                <Card key={trip.id} className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-muted">
                      <img 
                        src={`https://picsum.photos/seed/${trip.id}/600/400`} 
                        alt={trip.destination} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    <CardContent className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{trip.destination}</h3>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {trip.dates?.start ? format(new Date(trip.dates.start), "MMM dd") : "TBD"} - {trip.dates?.end ? format(new Date(trip.dates.end), "MMM dd, yyyy") : "TBD"}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-bold">Upcoming</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Packing Progress</span>
                          <span>{trip.packingList?.filter((i:any) => i.packed).length || 0} / {trip.packingList?.length || 0}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: '20%' }} />
                        </div>
                      </div>

                      <div className="mt-6 flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9">
                          <Backpack className="h-4 w-4 mr-2" /> Packing List
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl font-bold h-9">
                          Itinerary
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-primary to-blue-800 text-white p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-accent" />
              Travel Hacks
            </h3>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-sm font-medium leading-relaxed">
                  "Always carry a universal adapter when flying from OR Tambo. ZAR plugs vary!"
                </p>
              </div>
              <Button className="w-full bg-white text-primary font-bold rounded-xl h-11 hover:bg-white/90">
                Explore More Tips
              </Button>
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-muted/30 p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent Destinations</h4>
            <div className="space-y-3">
              {["Durban", "Kruger Park", "London"].map((d) => (
                <div key={d} className="flex items-center justify-between text-sm font-bold">
                  <span>{d}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
