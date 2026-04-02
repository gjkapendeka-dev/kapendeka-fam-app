"use client"

import * as React from "react"
import { 
  Newspaper, 
  Plus, 
  Globe, 
  Users, 
  TrendingUp, 
  Clock, 
  Bookmark, 
  Share2, 
  Search,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function NewsPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newContent, setNewContent] = React.useState("")
  const [category, setCategory] = React.useState("announcement")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const newsQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(
      collection(db, "news"),
      where("familyId", "==", profile.familyId),
      orderBy("date", "desc"),
      limit(20)
    )
  }, [db, profile?.familyId])

  const { data: articles, loading } = useCollection(newsQuery)

  const handlePostNews = () => {
    if (!db || !profile?.familyId || !newTitle) return

    setIsSubmitting(true)
    const newsData = {
      familyId: profile.familyId,
      title: newTitle,
      content: newContent,
      authorId: profile.id,
      authorName: profile.displayName,
      category: category,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    }

    addDoc(collection(db, "news"), newsData)
      .then(() => {
        setIsDialogOpen(false)
        setNewTitle("")
        setNewContent("")
        toast({ title: "News Published", description: "The family has been updated!" })
      })
      .finally(() => setIsSubmitting(false))
  }

  // Mock Global News for the Global tab
  const globalNews = [
    { title: "Economic Shift in SADC Regions", source: "African Business", time: "2h ago" },
    { title: "New Tech Hub Opens in Sandton", source: "Joburg Times", time: "5h ago" },
    { title: "Bafana Bafana Qualify for Finals", source: "Supersport", time: "1d ago" },
  ]

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Kapendeka News</h1>
          <p className="text-muted-foreground font-medium">Internal updates and global context</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-accent shadow-lg shadow-accent/20">
              <Plus className="h-4 w-4 mr-2" /> Post Update
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Broadcast to the Family</DialogTitle>
              <DialogDescription>Share an important achievement or announcement.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Headline</Label>
                <Input placeholder="e.g. Junior wins the Debate Club trophy!" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Details</Label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-accent" 
                  placeholder="Tell the story..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePostNews} disabled={isSubmitting || !newTitle}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="family" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full max-w-[400px]">
          <TabsTrigger value="family" className="flex-1 rounded-lg font-bold">Universe News</TabsTrigger>
          <TabsTrigger value="global" className="flex-1 rounded-lg font-bold">Global Brief</TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="space-y-6 mt-8">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-[2rem]" />)
          ) : articles?.length === 0 ? (
            <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed">
              <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg">No News is Good News?</h3>
              <p className="text-muted-foreground">Post the first family achievement of the month!</p>
            </div>
          ) : (
            articles?.map((article) => (
              <Card key={article.id} className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-muted overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${article.id}/600/400`} 
                      alt="News" 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  <div className="flex-1 flex flex-col p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase tracking-widest px-2">
                        {article.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {article.date ? formatDistanceToNow(new Date(article.date.seconds * 1000), { addSuffix: true }) : "just now"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed flex-1 line-clamp-2">
                      {article.content}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://picsum.photos/seed/${article.authorId}/100/100`} />
                          <AvatarFallback>KP</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold">{article.authorName}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Bookmark className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Share2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="global" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {globalNews.map((news, i) => (
              <Card key={i} className="rounded-2xl border-none shadow-sm bg-muted/10 p-6 flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <Badge className="bg-white text-primary border-primary/20">{news.source}</Badge>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">{news.time}</span>
                </div>
                <h4 className="font-bold text-lg leading-tight flex-1">{news.title}</h4>
                <Button variant="link" className="p-0 h-auto justify-start text-primary font-bold">Read coverage</Button>
              </Card>
            ))}
            <Card className="rounded-2xl border-none bg-primary text-white p-6 flex flex-col justify-center items-center text-center space-y-2">
              <Globe className="h-10 w-10 opacity-50 mb-2" />
              <h4 className="font-bold">More Global Context</h4>
              <p className="text-xs opacity-80 font-medium">Configure your personal news feed in Settings.</p>
              <Button variant="secondary" size="sm" className="rounded-xl font-bold mt-2">Manage Sources</Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
