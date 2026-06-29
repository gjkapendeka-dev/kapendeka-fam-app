"use client"

import * as React from "react"
import { 
  BookOpen, 
  Plus, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Search,
  Loader2,
  Calendar as CalendarIcon,
  Upload,
  Link as LinkIcon
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
import { format } from "date-fns"

export default function SchoolPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [uploadingId, setUploadingId] = React.useState<string | null>(null)

  // Form State
  const [title, setTitle] = React.useState("")
  const [subject, setSubject] = React.useState("Math")
  const [childName, setChildName] = React.useState("Junior")
  const [dueDate, setDueDate] = React.useState("")

  const homeworkQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("homework").select("*").eq("family_id", profile.family_id).order("due_date", { ascending: true })
  }, [supabase, profile?.family_id])

  const { data: assignments, loading, refresh } = useCollection(homeworkQuery)

  const handleAddAssignment = () => {
    if (!supabase || !profile?.family_id || !title) return

    setIsSubmitting(true)
    const data = {
      family_id: profile.family_id,
      title,
      subject,
      child_name: childName,
      status: "pending",
      due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    supabase.from("homework").insert([data])
      .then(() => {
        setIsDialogOpen(false)
        setTitle("")
        refresh()
        toast({ title: "Assignment Added", description: `Added ${title} for ${childName}.` })
      })
      .then(() => setIsSubmitting(false))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (!e.target.files || e.target.files.length === 0 || !supabase) return
    const file = e.target.files[0]
    
    setUploadingId(id)
    try {
       const fileExt = file.name.split('.').pop()
       const fileName = `${Math.random()}.${fileExt}`
       const filePath = `${profile?.family_id}/${id}/${fileName}`
       
       const { error: uploadError } = await supabase.storage.from('homework_files').upload(filePath, file)
       if (uploadError) throw uploadError
       
       const { data } = supabase.storage.from('homework_files').getPublicUrl(filePath)
       
       await supabase.from("homework").update({ 
         status: "done", 
         attachment_url: data.publicUrl 
       }).eq("id", id)
       
       toast({ title: "Turned In!", description: "File uploaded successfully.", className: "bg-emerald-500 text-white" })
       refresh()
    } catch (error: any) {
       toast({ title: "Upload Failed", description: error.message, variant: "destructive" })
    } finally {
       setUploadingId(null)
    }
  }

  const toggleStatus = async (id: string, current: string) => {
    if (!supabase) return
    const next = current === "pending" ? "done" : "pending"
    await supabase.from("homework").update({ status: next }).eq("id", id)
    refresh()
  }

  const getSubjectColor = (subj: string) => {
    const colors: Record<string, string> = {
       "Math": "bg-blue-100 text-blue-700",
       "Science": "bg-emerald-100 text-emerald-700",
       "English": "bg-amber-100 text-amber-700",
       "History": "bg-rose-100 text-rose-700",
       "Arts": "bg-purple-100 text-purple-700",
       "isiZulu": "bg-orange-100 text-orange-700",
       "Afrikaans": "bg-cyan-100 text-cyan-700",
    }
    return colors[subj] || "bg-slate-100 text-slate-700"
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto pb-20 pr-14">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                 <GraduationCap className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-black uppercase italic tracking-tight text-primary">School & Homework</h1>
           </div>
          <p className="text-muted-foreground font-bold text-sm">Keep track of all your assignments and turn them in!</p>
        </div>
        {(profile?.role === "adult" || profile?.role === "parent") && (
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button className="rounded-xl h-11 px-6 font-black uppercase tracking-wider bg-primary shadow-lg shadow-primary/20">
                 <Plus className="h-4 w-4 mr-2" /> Add Homework
               </Button>
             </DialogTrigger>
             <DialogContent className="rounded-2xl">
               <DialogHeader>
                 <DialogTitle>New School Task</DialogTitle>
                 <DialogDescription>Add a new assignment or study goal.</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                   <Label>Assignment Title</Label>
                   <Input placeholder="e.g. Science Fair Project" value={title} onChange={(e) => setTitle(e.target.value)} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                     <Label>Subject</Label>
                     <Select value={subject} onValueChange={setSubject}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         {["Math", "Science", "English", "History", "Arts", "isiZulu", "Afrikaans"].map(s => (
                           <SelectItem key={s} value={s}>{s}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="grid gap-2">
                     <Label>Due Date</Label>
                     <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                   </div>
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleAddAssignment} disabled={!title || isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Add Assignment
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
        )}
      </header>

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-3xl" />)
        ) : assignments?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl">
            <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-black text-2xl uppercase tracking-tighter text-primary">No Homework!</h3>
            <p className="text-muted-foreground font-bold mt-2">Time to play in the Arcade!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments?.map((a: any) => (
              <Card key={a.id} className={`rounded-3xl border-none shadow-xl overflow-hidden ${a.status === 'done' ? 'bg-emerald-50/50' : 'bg-white'}`}>
                <div className={`h-3 w-full ${a.status === 'done' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 ${getSubjectColor(a.subject)}`}>
                      {a.subject}
                    </Badge>
                    <Badge variant={a.status === "done" ? "default" : "secondary"} className={a.status === "done" ? "bg-emerald-500" : ""}>
                      {a.status === "done" ? "Turned In" : "Pending"}
                    </Badge>
                  </div>
                  
                  <h4 className="font-black text-xl mb-1">{a.title}</h4>
                  <div className="flex items-center text-xs font-bold text-muted-foreground gap-4 mb-6">
                     <span className="flex items-center"><CalendarIcon className="w-3 h-3 mr-1"/> {format(new Date(a.due_date), "MMM d")}</span>
                     <span className="flex items-center"><FileText className="w-3 h-3 mr-1"/> For: {a.child_name}</span>
                  </div>

                  {a.status === "pending" ? (
                     <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => toggleStatus(a.id, a.status)}
                          variant="outline" 
                          className="flex-1 rounded-xl font-bold h-12"
                        >
                           Mark Done
                        </Button>
                        <div className="relative">
                           <Button className="rounded-xl h-12 px-4 bg-primary text-white font-bold" disabled={uploadingId === a.id}>
                              {uploadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                              {uploadingId !== a.id && "Turn In"}
                           </Button>
                           <input 
                             type="file" 
                             className="absolute inset-0 opacity-0 cursor-pointer" 
                             onChange={(e) => handleFileUpload(e, a.id)}
                             disabled={uploadingId === a.id}
                           />
                        </div>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2">
                        {a.attachment_url && (
                           <a href={a.attachment_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors">
                              <LinkIcon className="h-4 w-4 mr-2" /> View Attachment
                           </a>
                        )}
                        <Button 
                          onClick={() => toggleStatus(a.id, a.status)}
                          variant="ghost" 
                          className="w-full rounded-xl text-muted-foreground text-xs"
                        >
                           Undo
                        </Button>
                     </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
