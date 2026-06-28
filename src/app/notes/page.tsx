"use client"

import * as React from "react"
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Pin, 
  PinOff, 
  Search,
  MoreVertical,
  Loader2,
  Palette
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

const COLORS = [
  { name: "Yellow", value: "bg-yellow-100 border-yellow-200" },
  { name: "Blue", value: "bg-blue-100 border-blue-200" },
  { name: "Rose", value: "bg-rose-100 border-rose-200" },
  { name: "Emerald", value: "bg-emerald-100 border-emerald-200" },
  { name: "Purple", value: "bg-purple-100 border-purple-200" },
]

export default function NotesPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0].value)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const notesQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("notes").select("*").eq("familyId", profile.familyId).order("isPinned", { ascending: false })
    
  }, [supabase, profile?.familyId])

  const { data: notes, loading } = useCollection(notesQuery)

  const handleAddNote = () => {
    if (!supabase || !profile?.familyId || !title) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      title,
      content,
      color: selectedColor,
      isPinned: false,
      createdBy: profile.id,
      createdAt: new Date().toISOString(),
    }

    supabase.from("notes").insert([data])
      .then(() => {
        setIsDialogOpen(false)
        setTitle("")
        setContent("")
        toast({ title: "Note Stuck!", description: "Sticky note added to the hub." })
      })
      .then(() => setIsSubmitting(false))
  }

  const togglePin = (noteId: string, current: boolean) => {
    if (!supabase) return
    supabase.from("notes").update({ isPinned: !current }).eq("id", noteId)
  }

  const handleDelete = (noteId: string) => {
    if (!supabase) return
    supabase.from("notes").delete().eq("id", noteId)
      .then(() => toast({ title: "Note removed" }))
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Notes & Memos</h1>
          <p className="text-muted-foreground font-medium">Quick sticky notes for the Kapendeka Universe</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Stick a Memo</DialogTitle>
              <DialogDescription>Quickly share a thought or reminder.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input placeholder="e.g. WiFi Password" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Content</Label>
                <Textarea placeholder="Details, ..." value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button 
                      key={c.name}
                      onClick={() => setSelectedColor(c.value)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${c.value.split(' ')[0]} ${selectedColor === c.value ? 'border-primary scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddNote} disabled={!title || isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post to Hub
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)
        ) : notes?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <StickyNote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg">Empty notice board</h3>
            <p className="text-muted-foreground">Add some notes or memos for the family!</p>
          </div>
        ) : (
          notes?.map((note) => (
            <Card key={note.id} className={`rounded-2xl border shadow-sm group hover:shadow-md transition-all overflow-hidden ${note.color}`}>
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-bold truncate pr-2">{note.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => togglePin(note.id, note.isPinned)}
                    className={`p-1 rounded-full hover:bg-black/5 transition-colors ${note.isPinned ? 'text-primary' : 'text-muted-foreground/40'}`}
                  >
                    {note.isPinned ? <Pin className="h-4 w-4 fill-primary" /> : <PinOff className="h-4 w-4" />}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-black/5 text-muted-foreground/40"><MoreVertical className="h-4 w-4" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => handleDelete(note.id)} className="text-destructive font-bold">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-4 text-[10px] font-bold text-muted-foreground/60 uppercase">
                  {note.createdAt ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>
    </div>
  )
}
