"use client"

import * as React from "react"
import { Settings, Plus, Trash2, ArrowLeft, Loader2, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ManageTriviaPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [questions, setQuestions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // Redirect kids
  React.useEffect(() => {
    if (profile && profile.role !== "adult") {
      router.push("/trivia")
    }
  }, [profile, router])

  React.useEffect(() => {
    if (supabase && profile?.familyId) {
      supabase.from("trivia_questions").select("*").eq("family_id", profile.familyId).then(({ data }) => {
        if (data) setQuestions(data)
        setLoading(false)
      })
    }
  }, [supabase, profile?.familyId])

  const handleAdd = () => {
    setQuestions([
      ...questions,
      { id: "new-" + Date.now(), question: "", options: ["", "", "", ""], correct_index: 0, isNew: true }
    ])
  }

  const handleDelete = async (id: string) => {
    if (!id.startsWith("new-")) {
      await supabase?.from("trivia_questions").delete().eq("id", id)
    }
    setQuestions(questions.filter(q => q.id !== id))
    toast({ title: "Question deleted" })
  }

  const handleSave = async () => {
    if (!supabase || !profile?.familyId) return
    setSaving(true)

    const toInsert = questions.filter(q => q.isNew).map(q => ({
      family_id: profile.familyId,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index
    }))

    const toUpdate = questions.filter(q => !q.isNew)

    try {
      if (toInsert.length > 0) {
        await supabase.from("trivia_questions").insert(toInsert)
      }
      for (const q of toUpdate) {
        await supabase.from("trivia_questions").update({
          question: q.question,
          options: q.options,
          correct_index: q.correct_index
        }).eq("id", q.id)
      }
      toast({ title: "Saved successfully!", className: "bg-emerald-500 text-white" })
      
      // Reload
      const { data } = await supabase.from("trivia_questions").select("*").eq("family_id", profile.familyId)
      if (data) setQuestions(data)
    } catch (e) {
      toast({ title: "Error saving", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-6 max-w-4xl mx-auto pb-20 pr-14">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <Link href="/trivia">
              <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
           </Link>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-primary">Manage Trivia</h1>
              <p className="text-muted-foreground font-medium text-sm">Add or edit questions for the family</p>
           </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold bg-primary text-white shadow-lg">
           {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
           Save Changes
        </Button>
      </header>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
           <Card key={q.id} className="rounded-2xl border-none shadow-sm relative overflow-visible">
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute -top-3 -right-3 rounded-full h-8 w-8 shadow-md"
                onClick={() => handleDelete(q.id)}
              >
                 <Trash2 className="h-4 w-4" />
              </Button>
              <CardContent className="p-6 space-y-4">
                 <div className="space-y-2">
                    <Label className="font-bold">Question</Label>
                    <Input 
                      value={q.question} 
                      onChange={(e) => {
                         const n = [...questions]; n[qIndex].question = e.target.value; setQuestions(n);
                      }} 
                      className="font-bold rounded-xl"
                      placeholder="e.g., What is our family motto?"
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt: string, oIndex: number) => (
                       <div key={oIndex} className="flex items-center gap-2 bg-muted/20 p-2 rounded-xl">
                          <Button 
                            variant={q.correct_index === oIndex ? "default" : "outline"} 
                            className="w-12 shrink-0 rounded-lg h-10 font-bold"
                            onClick={() => {
                               const n = [...questions]; n[qIndex].correct_index = oIndex; setQuestions(n);
                            }}
                          >
                             {q.correct_index === oIndex ? "✓" : String.fromCharCode(65 + oIndex)}
                          </Button>
                          <Input 
                            value={opt}
                            onChange={(e) => {
                               const n = [...questions]; n[qIndex].options[oIndex] = e.target.value; setQuestions(n);
                            }}
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 font-medium"
                            placeholder={`Option ${oIndex + 1}`}
                          />
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        ))}

        <Button onClick={handleAdd} variant="outline" className="w-full h-16 rounded-2xl border-dashed border-2 font-bold text-muted-foreground hover:text-primary hover:border-primary transition-colors">
           <Plus className="h-5 w-5 mr-2" /> Add New Question
        </Button>
      </div>
    </div>
  )
}
