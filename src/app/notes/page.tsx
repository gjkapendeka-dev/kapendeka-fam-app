"use client"

import * as React from "react"
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Pin, 
  PinOff, 
  MoreVertical,
  Loader2,
  Book,
  Wifi,
  ChefHat,
  ShieldAlert,
  FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

const COLORS = [
  { name: "Yellow", value: "bg-yellow-100 border-yellow-200" },
  { name: "Blue", value: "bg-blue-100 border-blue-200" },
  { name: "Rose", value: "bg-rose-100 border-rose-200" },
  { name: "Emerald", value: "bg-emerald-100 border-emerald-200" },
  { name: "Purple", value: "bg-purple-100 border-purple-200" },
]

const WIKI_CATEGORIES = [
  { id: "Tech & WiFi", icon: Wifi, color: "text-blue-500 bg-blue-100" },
  { id: "Recipes", icon: ChefHat, color: "text-orange-500 bg-orange-100" },
  { id: "Rules & Routines", icon: ShieldAlert, color: "text-rose-500 bg-rose-100" },
  { id: "Manuals", icon: Book, color: "text-emerald-500 bg-emerald-100" },
  { id: "General", icon: FileText, color: "text-slate-500 bg-slate-100" },
]

export default function NotesPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  // Sticky Note State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0].value)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Wiki State
  const [isWikiDialogOpen, setIsWikiDialogOpen] = React.useState(false)
  const [wikiTitle, setWikiTitle] = React.useState("")
  const [wikiContent, setWikiContent] = React.useState("")
  const [wikiCategory, setWikiCategory] = React.useState("General")

  const notesQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null // Note: Using family_id for consistency
    return supabase.from("notes").select("*").eq("familyId", profile.family_id).order("isPinned", { ascending: false })
  }, [supabase, profile?.family_id])
  const { data: notes, loading } = useCollection(notesQuery)

  const wikiQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("wiki_articles").select("*").eq("family_id", profile.family_id).order("created_at", { ascending: false })
  }, [supabase, profile?.family_id])
  const { data: wikiArticles, loading: wikiLoading } = useCollection(wikiQuery)

  const handleAddNote = () => {
    if (!supabase || !profile?.family_id || !title) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.family_id,
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
      .finally(() => setIsSubmitting(false))
  }

  const handleAddWiki = () => {
    if (!supabase || !profile?.family_id || !wikiTitle) return

    setIsSubmitting(true)
    const data = {
      family_id: profile.family_id,
      title: wikiTitle,
      content: wikiContent,
      category: wikiCategory,
      created_by: profile.id,
    }

    supabase.from("wiki_articles").insert([data])
      .then(() => {
        setIsWikiDialogOpen(false)
        setWikiTitle("")
        setWikiContent("")
        setWikiCategory("General")
        toast({ title: "Article Published!", description: "Wiki article added to the library." })
      })
      .finally(() => setIsSubmitting(false))
  }

  const togglePin = (noteId: string, current: boolean) => {
    if (!supabase) return
    supabase.from("notes").update({ isPinned: !current }).eq("id", noteId)
  }

  const handleDeleteNote = (noteId: string) => {
    if (!supabase) return
    supabase.from("notes").delete().eq("id", noteId)
      .then(() => toast({ title: "Note removed" }))
  }

  const handleDeleteWiki = (articleId: string) => {
    if (!supabase) return
    supabase.from("wiki_articles").delete().eq("id", articleId)
      .then(() => toast({ title: "Article removed" }))
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Wiki & Notes</h1>
          <p className="text-muted-foreground font-medium">Family knowledge base and quick memos</p>
        </div>
      </header>

      <Tabs defaultValue="wiki" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 rounded-xl p-1 mb-6 h-12">
          <TabsTrigger value="wiki" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Book className="h-4 w-4 mr-2" /> Family Wiki
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <StickyNote className="h-4 w-4 mr-2" /> Sticky Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wiki" className="mt-0 space-y-4">
          <div className="flex justify-end">
            <Dialog open={isWikiDialogOpen} onOpenChange={setIsWikiDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4 mr-2" /> New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create Wiki Article</DialogTitle>
                  <DialogDescription>Document important family knowledge.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input placeholder="e.g. Guest WiFi Password" value={wikiTitle} onChange={(e) => setWikiTitle(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={wikiCategory} onValueChange={setWikiCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {WIKI_CATEGORIES.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <c.icon className="h-4 w-4" /> {c.id}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Content</Label>
                    <Textarea 
                      placeholder="Write the article content here..." 
                      className="min-h-[200px]"
                      value={wikiContent} 
                      onChange={(e) => setWikiContent(e.target.value)} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddWiki} disabled={!wikiTitle || !wikiContent || isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Publish Article
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wikiLoading ? (
               [1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)
            ) : wikiArticles?.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
                <Book className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-lg">Knowledge Base is Empty</h3>
                <p className="text-muted-foreground">Start documenting family rules, recipes, and tech info!</p>
              </div>
            ) : (
              wikiArticles?.map(article => {
                const categoryDef = WIKI_CATEGORIES.find(c => c.id === article.category) || WIKI_CATEGORIES[4]
                const Icon = categoryDef.icon
                return (
                  <Card key={article.id} className="rounded-[2rem] border shadow-sm group hover:shadow-md transition-all bg-white overflow-hidden flex flex-col">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className={`p-2 rounded-xl ${categoryDef.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 -mr-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleDeleteWiki(article.id)} className="text-destructive font-bold">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-xl font-bold leading-tight">{article.title}</CardTitle>
                      <CardDescription className="text-xs font-bold uppercase tracking-wider mt-1">{article.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                      <div className="text-sm text-muted-foreground line-clamp-4 flex-1 whitespace-pre-wrap">
                        {article.content}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border text-xs font-medium text-muted-foreground/70">
                        Updated {new Date(article.updated_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-0 space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4 mr-2" /> New Sticky Note
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
                    <Input placeholder="e.g. Groceries" value={title} onChange={(e) => setTitle(e.target.value)} />
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
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                          <DropdownMenuItem onClick={() => handleDeleteNote(note.id)} className="text-destructive font-bold">
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
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
