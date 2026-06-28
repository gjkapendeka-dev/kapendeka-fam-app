
"use client"

import * as React from "react"
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Send,
  Plus,
  MoreHorizontal,
  History,
  Sparkles,
  Award,
  Camera
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
export default function SocialPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newPostContent, setNewPostContent] = React.useState("")
  const [postType, setPostType] = React.useState("memory")

  const postsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("posts")
      .select("*")
      .eq("familyId", profile.familyId).order("createdAt", { ascending: false }).limit(20)
  }, [supabase, profile?.familyId])

  const { data: posts, loading } = useCollection(postsQuery)

  const handleCreatePost = async () => {
    if (!supabase || !profile?.familyId || !newPostContent) return

    const postData = {
      familyId: profile.familyId,
      authorId: profile.id,
      authorName: profile.displayName,
      authorAvatar: profile.avatarUrl || "",
      type: postType,
      content: newPostContent,
      mediaUrls: [],
      createdAt: new Date().toISOString(),
      likes: []
    }

    const { error } = await supabase.from("posts").insert([postData])
    if (error) {
      toast({ title: "Error creating post", description: error.message, variant: "destructive" })
      return
    }

    setIsDialogOpen(false)
    setNewPostContent("")
    toast({
      title: "Memory Saved",
      description: "Your post has been shared with the family universe.",
    })
  }

  const handleLike = async (postId: string, currentLikes: string[] = []) => {
    if (!supabase || !profile) return
    const isLiked = currentLikes.includes(profile.id)
    const newLikes = isLiked ? currentLikes.filter(id => id !== profile.id) : [...currentLikes, profile.id]
    
    await supabase.from("posts").update({
      likes: newLikes
    }).eq("id", postId)
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Family Journal & Social</h1>
          <p className="text-muted-foreground font-medium">Capturing the Kapendeka Universe, one memory at a time</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-accent shadow-lg shadow-accent/20">
              <Plus className="h-4 w-4 mr-2" /> New Memory
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Share a Family Moment</DialogTitle>
              <DialogDescription>Announce an achievement, share a photo, or just say hi.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex gap-2">
                {["memory", "achievement", "announcement"].map((t) => (
                  <Button
                    key={t}
                    variant={postType === t ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-[10px] font-bold uppercase px-4"
                    onClick={() => setPostType(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="What's happening in the family today?"
                className="min-h-[120px] rounded-xl"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl border-dashed">
                  <Camera className="h-4 w-4 mr-2" /> Add Photo
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePost} disabled={!newPostContent} className="rounded-xl w-full sm:w-auto">
                Post to Hub
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed flex flex-col items-center">
            <div className="h-20 w-20 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mb-4">
              <History className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold">The Universe is quiet, ...</h3>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto mt-2">
              Start the Kapendeka Journal by sharing the first memory of the week!
            </p>
            <Button variant="outline" className="mt-3 rounded-xl border-primary/20 text-primary font-bold" onClick={() => setIsDialogOpen(true)}>
              Create First Post
            </Button>
          </div>
        ) : (
          posts?.map((post, idx) => {
            const isLiked = profile && post.likes?.includes(profile.id)
            return (
              <Card key={post.id} className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={`https://picsum.photos/seed/${post.authorId}/100/100`} />
                    <AvatarFallback>{post.authorName?.substring(0, 2).toUpperCase() || "KP"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{post.authorName || "Family Member"}</span>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase tracking-widest px-2">
                        {post.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true }) : "Just now"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg leading-relaxed font-medium">
                    {post.content}
                  </p>
                  {idx % 3 === 0 && (
                    <div className="rounded-2xl overflow-hidden aspect-video bg-muted relative">
                      <img
                        src={`https://picsum.photos/seed/${post.id}/800/450`}
                        alt="Memory"
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 flex items-center gap-3">
                  <button 
                    onClick={() => handleLike(post.id, post.likes)}
                    className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500' : ''}`} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span>Comment</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-accent ml-auto transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
