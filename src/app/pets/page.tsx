
"use client"

import * as React from "react"
import { 
  Dog, 
  Plus, 
  Cat, 
  Heart, 
  Stethoscope, 
  UtensilsCrossed, 
  Clock, 
  Calendar as CalendarIcon,
  Search,
  Loader2,
  Camera
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

export default function PetsPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState("dog")
  const [feedingSchedule, setFeedingSchedule] = React.useState("Morning & Evening")

  const petsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("pets").select("*").eq("familyId", profile.familyId)
    
  }, [supabase, profile?.familyId])

  const { data: pets, loading } = useCollection(petsQuery)

  const handleAddPet = () => {
    if (!supabase || !profile?.familyId || !name) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      name,
      type,
      feedingSchedule,
      createdAt: new Date().toISOString(),
    }

    supabase.from("pets").insert([data])
      .then(() => {
        setIsDialogOpen(false)
        setName("")
        toast({ title: "Pet Profile Created", description: `${name} is now part of the hub roster.` })
      })
      .then(() => setIsSubmitting(false))
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Pet Care Hub</h1>
          <p className="text-muted-foreground font-medium">Managing the four-legged members of the Universe</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Register Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>New Pet Profile</DialogTitle>
              <DialogDescription>Add a new furry friend to the family hub.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Pet Name</Label>
                <Input placeholder="e.g. Max" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Feeding Schedule</Label>
                  <Input placeholder="Morning & Night" value={feedingSchedule} onChange={(e) => setFeedingSchedule(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPet} disabled={!name || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Pet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-[2.5rem]" />)
        ) : pets?.length === 0 ? (
          <div className="col-span-full py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed text-center">
            <Dog className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg">No pets registered</h3>
            <p className="text-muted-foreground">Add your dogs, cats, or other family pets to the tracker!</p>
          </div>
        ) : (
          pets?.map((pet) => (
            <Card key={pet.id} className="rounded-[2.5rem] border-none shadow-lg bg-white overflow-hidden group">
              <div className="h-48 bg-muted relative">
                <img 
                  src={`https://picsum.photos/seed/${pet.id}/600/400`} 
                  alt={pet.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white/80 backdrop-blur-md">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold">{pet.name}</h4>
                  <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[10px]">
                    {pet.type}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Feeding</div>
                      <div className="text-sm font-bold">{pet.feedingSchedule}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="rounded-xl h-10 font-bold border-primary/20 text-primary">
                      <Stethoscope className="h-4 w-4 mr-2" /> Health
                    </Button>
                    <Button variant="outline" className="rounded-xl h-10 font-bold border-primary/20 text-primary">
                      <Clock className="h-4 w-4 mr-2" /> History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>
    </div>
  )
}
