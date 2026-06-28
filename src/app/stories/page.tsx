
"use client"

import * as React from "react"
import { Library, Sparkles, Plus, Loader2, BookOpen, ChevronRight, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generateFamilyStory, type StoryOutput } from "@/ai/flows/ai-story-studio-flow"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function StoryStudioPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isGenerating, setIsGenerating] = React.useState(false)
  const [genre, setGenre] = React.useState("Space Adventure")
  const [theme, setTheme] = React.useState("Teamwork")
  const [activeStory, setActiveStory] = React.useState<StoryOutput | null>(null)

  const storiesQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(collection(db, "stories"), where("familyId", "==", profile.familyId), orderBy("createdAt", "desc"))
  }, [db, profile?.familyId])

  const { data: savedStories } = useCollection(storiesQuery)

  const handleGenerate = async () => {
    if (!profile) return
    setIsGenerating(true)
    try {
      const result = await generateFamilyStory({
        characters: [profile.displayName, "George", "Junior", "Sarah"],
        genre,
        theme
      })
      setActiveStory(result)
      
      // Save to Firebase
      await addDoc(collection(db, "stories"), {
        familyId: profile.familyId,
        ...result,
        createdAt: serverTimestamp()
      })
      
      toast({ title: "New Epic Created!", description: "Check out your family's latest adventure." })
    } catch (e) {
      console.error(e)
      toast({ variant: "destructive", title: "Storytelling Failed" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-24 pr-14">
      <header>
        <div className="flex items-center gap-4 mb-2">
           <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl">
              <Library className="h-6 w-6" />
           </div>
           <div>
              <h1 className="text-3xl font-black uppercase italic text-primary">Story Studio</h1>
              <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Co-create family legends with AI</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-8">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-black uppercase">Setup Adventure</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest">Universe Genre</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Fantasy", "Space", "Detective", "Cyberpunk"].map(g => (
                    <Button 
                      key={g} 
                      variant={genre === g ? "default" : "outline"}
                      className="rounded-xl h-10 text-[10px] font-bold"
                      onClick={() => setGenre(g)}
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                 <Label className="font-black text-[10px] uppercase tracking-widest">Lesson/Theme</Label>
                 <Input value={theme} onChange={(e) => setTheme(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 shadow-xl font-black uppercase tracking-widest"
              >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                Generate Story
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Legacy Archive</h3>
             <div className="space-y-3">
                {savedStories?.map((s) => (
                  <Card key={s.id} className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-all cursor-pointer group bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                         </div>
                         <div className="font-black text-sm truncate max-w-[150px]">{s.title}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeStory ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <Card className="rounded-[3rem] border-none shadow-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <Sparkles className="h-32 w-32" />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">{activeStory.title}</h2>
                  <Badge className="bg-accent text-white border-none font-black text-[9px] uppercase tracking-widest px-4 mb-8">Adventure Unfolding</Badge>
                  
                  <div className="space-y-12">
                    {activeStory.segments.map((seg, i) => (
                      <div key={i} className="space-y-6">
                        <div className="text-xl md:text-2xl font-medium leading-relaxed opacity-90 first-letter:text-5xl first-letter:font-black first-letter:text-accent first-letter:float-left first-letter:mr-3">
                          {seg.text}
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <Play className="h-4 w-4 text-accent" />
                           </div>
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic leading-tight">
                              AI Artist Hint: {seg.illustrationPrompt}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 text-center">
                     <div className="text-[9px] font-black uppercase tracking-[0.3em] text-accent mb-2">The Universe Moral</div>
                     <p className="text-xl font-bold italic">"{activeStory.moral}"</p>
                  </div>
               </Card>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-muted/20 rounded-[4rem] border-4 border-dashed border-muted/50 flex flex-col items-center justify-center text-center p-12">
               <Library className="h-24 w-24 text-muted-foreground/10 mb-6" />
               <h3 className="text-2xl font-black uppercase tracking-tighter text-muted-foreground">The Archive is Empty</h3>
               <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] max-w-xs mt-2">Generate a story above to witness the Kapendeka Universe legends.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
