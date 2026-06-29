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
  Link as LinkIcon,
  Timer as TimerIcon,
  Play,
  Pause,
  MessageSquare
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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


function AssignmentTimer({ a, supabase, refresh }: { a: any, supabase: any, refresh: () => void }) {
  const [running, setRunning] = React.useState(false)
  const [seconds, setSeconds] = React.useState(a.time_spent_seconds || 0)

  React.useEffect(() => {
    let int: any;
    if (running) {
      int = setInterval(() => {
        setSeconds((s: number) => s + 1)
      }, 1000)
    }
    return () => clearInterval(int)
  }, [running])

  const toggle = async () => {
    if (running) {
      // stopping, save time
      await supabase.from("homework").update({ time_spent_seconds: seconds }).eq("id", a.id)
    }
    setRunning(!running)
  }

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 pr-3 w-fit">
      <Button size="icon" variant={running ? "destructive" : "default"} className="h-8 w-8 rounded-lg" onClick={toggle}>
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <span className="font-bold text-sm text-slate-700 font-mono w-16 text-center">{formatTime(seconds)}</span>
    </div>
  )
}

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
  const [childName, setChildName] = React.useState("Gina")
  const [category, setCategory] = React.useState("Daily Homework")
  const [comment, setComment] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("active")
  const [dueDate, setDueDate] = React.useState("")
  const [newFile, setNewFile] = React.useState<File | null>(null)

  const [refreshCount, setRefreshCount] = React.useState(0)
  const refresh = () => setRefreshCount(c => c + 1)

  const homeworkQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("homework").select("*").eq("family_id", profile.family_id).order("due_date", { ascending: true })
  }, [supabase, profile?.family_id, refreshCount])

  const { data: assignments, loading } = useCollection(homeworkQuery)

  const handleAddAssignment = async () => {
    if (!supabase || !profile?.family_id || !title) return

    setIsSubmitting(true)
    let attachmentUrl = null;

    try {
      if (newFile) {
        const fileExt = newFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${profile.family_id}/new/${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('homework_files').upload(filePath, newFile)
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage.from('homework_files').getPublicUrl(filePath)
        attachmentUrl = urlData.publicUrl
      }

      const data = {
        family_id: profile.family_id,
        title,
        subject,
        child_name: childName,
        category,
        time_spent_seconds: 0,
        status: "pending",
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString(),
        attachment_url: attachmentUrl
      }

      const { error } = await supabase.from("homework").insert([data])
      if (error) throw error

      setIsDialogOpen(false)
      setTitle("")
      setNewFile(null)
      refresh()
      toast({ title: "Assignment Added", description: `Added ${title} for ${childName}.` })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error adding homework", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string, commentTxt: string) => {
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
         submission_url: data.publicUrl,
         comments: commentTxt 
       }).eq("id", id)
       
       toast({ title: "File Uploaded!", description: "Work attached successfully.", className: "bg-emerald-500 text-white" })
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
                     <Label>Child Name</Label>
                     <Select value={childName} onValueChange={setChildName}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         {["Gina", "Natalie", "Tinashe"].map(c => (
                           <SelectItem key={c} value={c}>{c}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="grid gap-2">
                     <Label>Category</Label>
                     <Select value={category} onValueChange={setCategory}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         {["Daily Homework", "Project", "Reading", "Exam Prep", "Other"].map(c => (
                           <SelectItem key={c} value={c}>{c}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
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
                 <div className="grid gap-2">
                   <Label>Attachment (Optional worksheet/instructions)</Label>
                   <Input 
                     type="file" 
                     onChange={(e) => {
                       if (e.target.files && e.target.files.length > 0) {
                         setNewFile(e.target.files[0])
                       }
                     }} 
                   />
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

      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-full max-w-sm mb-6 flex h-auto">
          <TabsTrigger value="active" className="rounded-xl font-bold py-2 flex-1 data-[state=active]:shadow-lg">Active</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-bold py-2 flex-1 data-[state=active]:shadow-lg">History</TabsTrigger>
        </TabsList>
        <div className="space-y-4">

        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-3xl" />)
        ) : (!assignments || assignments.length === 0) ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl">
            <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-black text-2xl uppercase tracking-tighter text-primary">No Homework!</h3>
            <p className="text-muted-foreground font-bold mt-2">Time to play in the Arcade!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {assignments?.filter((a: any) => (activeTab === "active" ? a.status === "pending" : a.status === "done")).map((a: any) => (
              <Card key={a.id} className={`rounded-3xl border-none shadow-xl overflow-hidden ${a.status === 'done' ? 'bg-emerald-50/50' : 'bg-white'}`}>
                <div className={`h-3 w-full ${a.status === 'done' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 ${getSubjectColor(a.subject)}`}>
                        {a.subject}
                      </Badge>
                      {a.category && (
                        <Badge variant="outline" className="border-primary/20 font-black text-[10px] uppercase tracking-wider px-3 py-1 text-primary">
                          {a.category}
                        </Badge>
                      )}
                    </div>
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
                     <div className="flex flex-col gap-3 mt-2">
                        <AssignmentTimer a={a} supabase={supabase} refresh={refresh} />
                        <div className="flex flex-col gap-2 mt-2">
                          {a.attachment_url && (
                             <a href={a.attachment_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors">
                                <LinkIcon className="h-4 w-4 mr-2" /> View Worksheet
                             </a>
                          )}
                          {a.submission_url && (
                             <a href={a.submission_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm hover:bg-emerald-100 transition-colors">
                                <LinkIcon className="h-4 w-4 mr-2" /> View Uploaded Work
                             </a>
                          )}
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => toggleStatus(a.id, a.status)}
                              className="flex-1 rounded-xl font-bold h-12 bg-primary text-white"
                            >
                               Mark Done
                            </Button>
                            
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="rounded-xl h-12 px-4 bg-primary/10 text-primary font-bold hover:bg-primary/20" disabled={uploadingId === a.id}>
                                {uploadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                {uploadingId !== a.id && "Attach Work"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-2xl">
                              <DialogHeader>
                                <DialogTitle>Upload Completed Work</DialogTitle>
                                <DialogDescription>Upload a photo of the completed work and add any comments.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Comments (Optional)</Label>
                                  <Textarea 
                                    placeholder="e.g. Struggled with question 4" 
                                    className="rounded-xl"
                                    onChange={(e) => setComment(e.target.value)}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Upload Photo / Document</Label>
                                  <Input 
                                    type="file" 
                                    accept="image/*,application/pdf"
                                    capture="environment"
                                    className="rounded-xl"
                                    onChange={(e) => handleFileUpload(e, a.id, comment)}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          </div>
                        </div>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2">
                        {a.attachment_url && (
                           <a href={a.attachment_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors">
                              <LinkIcon className="h-4 w-4 mr-2" /> View Worksheet
                           </a>
                        )}
                        {a.submission_url && (
                           <a href={a.submission_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm hover:bg-emerald-100 transition-colors">
                              <LinkIcon className="h-4 w-4 mr-2" /> View Uploaded Work
                           </a>
                        )}
                        {a.comments && (
                           <div className="bg-muted p-3 rounded-xl text-sm italic text-muted-foreground mt-2 border-l-4 border-primary">
                             "${a.comments}"
                           </div>
                        )}
                        <div className="text-xs font-bold text-slate-500 mt-1">Time spent: {Math.floor((a.time_spent_seconds || 0) / 60)}m {(a.time_spent_seconds || 0) % 60}s</div>
                        <div className="flex gap-2">
                           <Button 
                             onClick={() => toggleStatus(a.id, a.status)}
                             variant="ghost" 
                             className="flex-1 rounded-xl text-muted-foreground text-xs"
                           >
                              Mark Incomplete
                           </Button>
                           
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="rounded-xl h-12 px-4 bg-primary/10 text-primary font-bold hover:bg-primary/20" disabled={uploadingId === a.id}>
                                {uploadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                {uploadingId !== a.id && "Attach Work"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-2xl">
                              <DialogHeader>
                                <DialogTitle>Upload Completed Work</DialogTitle>
                                <DialogDescription>Upload a photo of the completed work and add any comments.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Comments (Optional)</Label>
                                  <Textarea 
                                    placeholder="e.g. Struggled with question 4" 
                                    className="rounded-xl"
                                    onChange={(e) => setComment(e.target.value)}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Upload Photo / Document</Label>
                                  <Input 
                                    type="file" 
                                    accept="image/*,application/pdf"
                                    capture="environment"
                                    className="rounded-xl"
                                    onChange={(e) => handleFileUpload(e, a.id, comment)}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                        </div>
                     </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </Tabs>
    </div>
  )
}
