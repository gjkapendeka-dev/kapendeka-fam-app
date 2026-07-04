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
  MessageSquare,
  Pencil,
  Trash2,
  Send,
  Users
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


function AssignmentTimer({ a, supabase, refresh, canEdit }: { a: any, supabase: any, refresh: () => void, canEdit: boolean }) {
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
    if (!canEdit) return;
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
      <Button size="icon" variant={running ? "destructive" : "default"} className="h-8 w-8 rounded-lg" onClick={toggle} disabled={!canEdit}>
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <span className="font-bold text-sm text-slate-700 font-mono w-16 text-center">{formatTime(seconds)}</span>
    </div>
  )
}

function ProgressBar({ assignment, supabase, refresh, canEdit }: { assignment: any, supabase: any, refresh: () => void, canEdit: boolean }) {
  const progress = assignment.progress || 0
  const [localProgress, setLocalProgress] = React.useState(progress)
  const [saving, setSaving] = React.useState(false)
  const debounceRef = React.useRef<any>(null)

  React.useEffect(() => {
    setLocalProgress(assignment.progress || 0)
  }, [assignment.progress])

  const handleChange = (val: number) => {
    if (!canEdit) return;
    setLocalProgress(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      await supabase.from("homework").update({ progress: val }).eq("id", assignment.id)
      setSaving(false)
      refresh()
    }, 500)
  }

  const getProgressColor = (p: number) => {
    if (p >= 80) return "bg-emerald-500"
    if (p >= 50) return "bg-amber-500"
    if (p >= 25) return "bg-orange-500"
    return "bg-red-400"
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-muted-foreground">Progress</span>
        <span className={`tabular-nums ${localProgress >= 80 ? 'text-emerald-600' : localProgress >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
          {localProgress}%
          {saving && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
        </span>
      </div>
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${getProgressColor(localProgress)}`}
          style={{ width: `${localProgress}%` }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={localProgress}
        onChange={(e) => handleChange(Number(e.target.value))}
        className={`w-full h-1 accent-primary ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
        disabled={!canEdit}
      />
    </div>
  )
}

function CommentSection({ assignment, supabase, refresh, canEdit }: { assignment: any, supabase: any, refresh: () => void, canEdit: boolean }) {
  const [newComment, setNewComment] = React.useState("")
  const [sending, setSending] = React.useState(false)

  const existingComments: string[] = React.useMemo(() => {
    if (!assignment.comments) return []
    try {
      const parsed = JSON.parse(assignment.comments)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return assignment.comments ? [assignment.comments] : []
  }, [assignment.comments])

  const addComment = async () => {
    if (!newComment.trim() || !canEdit) return
    setSending(true)
    const updated = [...existingComments, `${new Date().toLocaleDateString()} — ${newComment.trim()}`]
    await supabase.from("homework").update({ comments: JSON.stringify(updated) }).eq("id", assignment.id)
    setNewComment("")
    setSending(false)
    refresh()
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        Comments {existingComments.length > 0 && `(${existingComments.length})`}
      </div>
      {existingComments.length > 0 && (
        <div className="space-y-1.5 max-h-28 overflow-y-auto">
          {existingComments.map((c, i) => (
            <div key={i} className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 border-l-3 border-primary/30">
              {c}
            </div>
          ))}
        </div>
      )}
      {canEdit && (
        <div className="flex gap-1.5">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="h-8 text-xs rounded-lg"
            onKeyDown={(e) => e.key === "Enter" && addComment()}
          />
          <Button 
            size="icon" 
            className="h-8 w-8 rounded-lg shrink-0" 
            onClick={addComment}
            disabled={!newComment.trim() || sending}
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </div>
      )}
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

  // Edit State
  const [editingAssignment, setEditingAssignment] = React.useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editSubject, setEditSubject] = React.useState("")
  const [editChildName, setEditChildName] = React.useState("")
  const [editCategory, setEditCategory] = React.useState("")
  const [editDueDate, setEditDueDate] = React.useState("")
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)

  // Delegate State
  const [isDelegateDialogOpen, setIsDelegateDialogOpen] = React.useState(false)
  const [delegatingAssignment, setDelegatingAssignment] = React.useState<any>(null)
  const [delegateTo, setDelegateTo] = React.useState<string[]>([])

  const [refreshCount, setRefreshCount] = React.useState(0)
  const refresh = () => setRefreshCount(c => c + 1)

  const homeworkQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("homework").select("*").eq("family_id", profile.family_id).order("due_date", { ascending: true })
  }, [supabase, profile?.family_id, refreshCount])

  const { data: assignments, loading } = useCollection(homeworkQuery)

  const openEditDialog = (a: any) => {
    setEditingAssignment(a)
    setEditTitle(a.title || "")
    setEditSubject(a.subject || "Math")
    setEditChildName(a.child_name || "Gina")
    setEditCategory(a.category || "Daily Homework")
    setEditDueDate(a.due_date ? format(new Date(a.due_date), "yyyy-MM-dd") : "")
    setIsEditDialogOpen(true)
  }

  const openDelegateDialog = (a: any) => {
    setDelegatingAssignment(a)
    setDelegateTo(a.delegated_to || [])
    setIsDelegateDialogOpen(true)
  }

  const toggleDelegate = (child: string) => {
    if (delegateTo.includes(child)) {
      setDelegateTo(delegateTo.filter(c => c !== child))
    } else {
      setDelegateTo([...delegateTo, child])
    }
  }

  const handleDelegateSave = async () => {
    if (!supabase || !delegatingAssignment) return
    try {
      const { error } = await supabase.from("homework").update({
        delegated_to: delegateTo
      }).eq("id", delegatingAssignment.id)
      if (error) throw error
      setIsDelegateDialogOpen(false)
      setDelegatingAssignment(null)
      refresh()
      toast({ title: "Delegation Updated", description: `Updated access successfully.` })
    } catch (err: any) {
      toast({ title: "Error delegating", description: err.message, variant: "destructive" })
    }
  }

  const handleEditAssignment = async () => {
    if (!supabase || !editingAssignment) return
    setIsEditSubmitting(true)
    try {
      const { error } = await supabase.from("homework").update({
        title: editTitle,
        subject: editSubject,
        child_name: editChildName,
        category: editCategory,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      }).eq("id", editingAssignment.id)
      if (error) throw error
      setIsEditDialogOpen(false)
      setEditingAssignment(null)
      refresh()
      toast({ title: "Assignment Updated", description: `Updated "${editTitle}" successfully.` })
    } catch (err: any) {
      toast({ title: "Error updating", description: err.message, variant: "destructive" })
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDeleteAssignment = async (id: string, assignmentTitle: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from("homework").delete().eq("id", id)
      if (error) throw error
      refresh()
      toast({ title: "Deleted", description: `Removed "${assignmentTitle}".` })
    } catch (err: any) {
      toast({ title: "Error deleting", description: err.message, variant: "destructive" })
    }
  }

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
        progress: 0,
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString(),
        attachment_url: attachmentUrl,
        delegated_to: []
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
    const updates: any = { status: next }
    if (next === "done") updates.progress = 100
    await supabase.from("homework").update(updates).eq("id", id)
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

  const isParent = profile?.role === "adult" || profile?.role === "parent"

  const canEditAssignment = (a: any) => {
    if (isParent) return true;
    if (a.child_name === profile?.display_name) return true;
    if (a.delegated_to && a.delegated_to.includes(profile?.display_name)) return true;
    return false;
  };

  const childrenList = ["Gina", "Natalie", "Tinashe"];

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
        {isParent && (
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
                         {childrenList.map(c => (
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update this assignment&apos;s details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Assignment Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Child Name</Label>
                <Select value={editChildName} onValueChange={setEditChildName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {childrenList.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
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
                <Select value={editSubject} onValueChange={setEditSubject}>
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
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingAssignment && (
              <Button
                variant="destructive"
                className="rounded-xl mr-auto"
                onClick={() => {
                  handleDeleteAssignment(editingAssignment.id, editingAssignment.title)
                  setIsEditDialogOpen(false)
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button onClick={handleEditAssignment} disabled={!editTitle || isEditSubmitting} className="rounded-xl">
              {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delegate Dialog */}
      <Dialog open={isDelegateDialogOpen} onOpenChange={setIsDelegateDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delegate Assignment</DialogTitle>
            <DialogDescription>Allow other children to work on this assignment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground font-bold">Select who can modify this assignment:</p>
            <div className="flex flex-col gap-2">
              {childrenList.map(c => {
                // Don't show the child who already owns it
                if (c === delegatingAssignment?.child_name) return null;
                const isDelegated = delegateTo.includes(c);
                return (
                  <Button 
                    key={c}
                    variant={isDelegated ? "default" : "outline"}
                    className={`justify-start rounded-xl ${isDelegated ? 'bg-primary text-white' : ''}`}
                    onClick={() => toggleDelegate(c)}
                  >
                    {isDelegated && <CheckCircle2 className="h-4 w-4 mr-2" />}
                    {!isDelegated && <Users className="h-4 w-4 mr-2" />}
                    {c}
                  </Button>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleDelegateSave} className="rounded-xl">
              Save Delegation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
            
            {assignments?.filter((a: any) => (activeTab === "active" ? a.status === "pending" : a.status === "done")).map((a: any) => {
              const canEdit = canEditAssignment(a);
              const isOwnerOrParent = isParent || a.child_name === profile?.display_name;

              return (
              <Card key={a.id} className={`rounded-3xl border-none shadow-xl overflow-hidden ${a.status === 'done' ? 'bg-emerald-50/50' : 'bg-white'}`}>
                <div className={`h-3 w-full ${a.status === 'done' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 ${getSubjectColor(a.subject)}`}>
                        {a.subject}
                      </Badge>
                      {a.category && (
                        <Badge variant="outline" className="border-primary/20 font-black text-[10px] uppercase tracking-wider px-3 py-1 text-primary">
                          {a.category}
                        </Badge>
                      )}
                      {a.delegated_to && a.delegated_to.length > 0 && (
                        <Badge variant="secondary" className="border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 bg-slate-200">
                          <Users className="h-3 w-3 mr-1" /> Delegated
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isOwnerOrParent && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                          onClick={() => openDelegateDialog(a)}
                          title="Delegate Access"
                        >
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isParent && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                          onClick={() => openEditDialog(a)}
                          title="Edit Details"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Badge variant={a.status === "done" ? "default" : "secondary"} className={a.status === "done" ? "bg-emerald-500" : ""}>
                        {a.status === "done" ? "Turned In" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  
                  <h4 className="font-black text-xl mb-1">{a.title}</h4>
                  <div className="flex items-center text-xs font-bold text-muted-foreground gap-4 mb-4">
                     <span className="flex items-center"><CalendarIcon className="w-3 h-3 mr-1"/> {a.due_date ? format(new Date(a.due_date), "MMM d") : "No date"}</span>
                     <span className="flex items-center"><FileText className="w-3 h-3 mr-1"/> For: {a.child_name}</span>
                  </div>

                  {/* Progress Bar */}
                  <ProgressBar assignment={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />

                  {a.status === "pending" ? (
                     <div className="flex flex-col gap-3 mt-4">
                        <AssignmentTimer a={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />
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
                          {canEdit && (
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
                          )}
                          {!canEdit && (
                            <div className="bg-slate-50 text-slate-500 font-bold text-xs p-3 rounded-xl text-center border border-slate-100">
                              You do not have access to modify this assignment.
                            </div>
                          )}
                        </div>

                        {/* Comments Section */}
                        <CommentSection assignment={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2 mt-4">
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
                        <div className="text-xs font-bold text-slate-500 mt-1">Time spent: {Math.floor((a.time_spent_seconds || 0) / 60)}m {(a.time_spent_seconds || 0) % 60}s</div>
                        
                        {/* Comments Section for done items */}
                        <CommentSection assignment={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />

                        {canEdit && (
                          <div className="flex gap-2 mt-2">
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
                        )}
                     </div>
                  )}
                </CardContent>
              </Card>
              )
            })}
          </div>
        )}
      </div>
      </Tabs>
    </div>
  )
}
