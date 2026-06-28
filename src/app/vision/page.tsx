"use client"

import * as React from "react"
import { Lightbulb, Plus, Image as ImageIcon, Target, Calendar, Loader2, Sparkles, Star, Maximize } from "lucide-react"
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
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

export default function VisionBoardPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [targetYear, setTargetYear] = React.useState("2027")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const visionQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("visionBoard").select("*").eq("familyId", profile.familyId).order("targetYear", { ascending: true })
  }, [supabase, profile?.familyId])

  const { data: visions, loading } = useCollection(visionQuery)

  const toggleLandscape = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape')
        }
      } else {
        document.exitFullscreen()
      }
    } catch (e) {
      console.warn("Fullscreen failed:", e)
    }
  }

  const handleAdd = () => {
    if (!supabase || !profile?.familyId || !title) return
    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      title,
      targetYear: parseInt(targetYear),
      imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
      createdAt: new Date().toISOString()
    }
    supabase.from("visionBoard").insert([data])
      .then(() => {
        setIsAddOpen(false); setTitle("")
        toast({ title: "Vision Anchored" })
      })
      .then(() => setIsSubmitting(false))
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-24 pr-14">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-2xl bg-yellow-400 text-white flex items-center justify-center shadow-xl">
              <Lightbulb className="h-6 w-6" />
           </div>
           <div>
              <h1 className="text-3xl font-black uppercase italic text-primary">Vision Board</h1>
              <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Designing the Family Future</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleLandscape}
            className="rounded-xl font-bold border-primary/20 text-primary h-11 px-4 shadow-sm"
          >
            <Maximize className="h-4 w-4 mr-2" /> 
            Full View
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-6 bg-primary shadow-xl font-black uppercase text-[10px] tracking-widest text-white">
                <Plus className="h-4 w-4 mr-2" /> New Vision
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem]">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase">Dream Big</DialogTitle></DialogHeader>
              <div className="grid gap-6 py-6">
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase opacity-50">What is the Vision?</Label>
                    <Input placeholder="e.g. New Family Home" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl h-12" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase opacity-50">Target Year</Label>
                    <Input type="number" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="rounded-xl h-12" />
                  </div>
              </div>
              <DialogFooter><Button onClick={handleAdd} disabled={!title || isSubmitting} className="w-full h-12 rounded-xl">Anchor Vision</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-[2.5rem]" />)
        ) : (visions || []).length === 0 ? (
          <div className="col-span-full py-24 text-center bg-muted/20 rounded-[3rem] border-4 border-dashed">
             <Star className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
             <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">The Board is Waiting for Dreams</p>
          </div>
        ) : (
          visions?.map((vision) => (
            <Card key={vision.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white group hover:-translate-y-2 transition-all cursor-pointer">
              <div className="aspect-square relative overflow-hidden">
                <img src={vision.imageUrl} alt={vision.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <Badge className="bg-yellow-400 text-black border-none font-black text-[9px] uppercase tracking-widest mb-2">BY {vision.targetYear}</Badge>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">{vision.title}</h3>
                </div>
              </div>
            </Card>
          )
        ))}
      </div>
    </div>
  )
}
