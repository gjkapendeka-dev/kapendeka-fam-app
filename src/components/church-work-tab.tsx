"use client"

import * as React from "react"
import {
  Plus, Clock, CheckCircle2, ClipboardList, Loader2,
  Calendar as CalendarIcon, Upload, Play, Pause, MessageSquare,
  Pencil, Trash2, Send, Users, Mic, Square, Download, LayoutGrid,
  List as ListIcon, Bell, Mail, MessageCircle, Monitor, FileText,
  Link as LinkIcon, Church
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import { format, formatDistanceToNowStrict } from "date-fns"

// ─── Audio Recorder ────────────────────────────────────────
function useAudioRecorder() {
  const [isRecording, setIsRecording] = React.useState(false)
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      mediaRecorder.start()
      setIsRecording(true)
      setAudioBlob(null)
    } catch (err) { console.error("Error accessing microphone:", err) }
  }
  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false) } }
  const discardRecording = () => { setAudioBlob(null) }
  return { isRecording, startRecording, stopRecording, audioBlob, discardRecording }
}

// ─── Attachment File List ──────────────────────────────────
function AttachmentFileList({ files }: { files: string[] }) {
  if (!files || files.length === 0) return null
  return (
    <div className="flex flex-col gap-2 mt-2">
      {files.map((url, i) => {
        const isAudio = url.includes('.webm') || url.includes('.ogg') || url.includes('.mp3') || url.includes('.wav')
        if (isAudio) {
          return (
            <div key={i} className="flex flex-col gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Mic className="h-3 w-3" /> Voice Note</span>
              <audio controls src={url} className="h-10 w-full max-w-full" />
            </div>
          )
        }
        let fileName = url.split('/').pop() || `Attachment ${i + 1}`
        try { fileName = decodeURIComponent(fileName) } catch {}
        return (
          <div key={i} className="flex items-center justify-between bg-purple-50/50 p-2 rounded-xl border border-purple-100 group">
            <div className="flex items-center gap-2 truncate pr-2">
              <FileText className="h-4 w-4 text-purple-500 shrink-0" />
              <span className="text-sm font-medium truncate text-slate-700">{fileName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <a href={url} target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg" title="View"><LinkIcon className="h-4 w-4" /></a>
              <a href={url} download target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg" title="Download"><Download className="h-4 w-4" /></a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Task Timer ────────────────────────────────────────────
function TaskTimer({ a, supabase, refresh, canEdit }: { a: any; supabase: any; refresh: () => void; canEdit: boolean }) {
  const [running, setRunning] = React.useState(false)
  const [seconds, setSeconds] = React.useState(a.time_spent_seconds || 0)
  React.useEffect(() => {
    let int: any
    if (running) { int = setInterval(() => { setSeconds((s: number) => s + 1) }, 1000) }
    return () => clearInterval(int)
  }, [running])
  const toggle = async () => {
    if (!canEdit) return
    if (running) { await supabase.from("church_work").update({ time_spent_seconds: seconds }).eq("id", a.id) }
    setRunning(!running)
  }
  const formatTime = (totalSeconds: number) => { const m = Math.floor(totalSeconds / 60); const s = totalSeconds % 60; return `${m}m ${s}s` }
  return (
    <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 pr-3 w-fit">
      <Button size="icon" variant={running ? "destructive" : "default"} className="h-8 w-8 rounded-lg" onClick={toggle} disabled={!canEdit}>
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <span className="font-bold text-sm text-slate-700 font-mono w-16 text-center">{formatTime(seconds)}</span>
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────
function CWProgressBar({ assignment, supabase, refresh, canEdit }: { assignment: any; supabase: any; refresh: () => void; canEdit: boolean }) {
  const progress = assignment.progress || 0
  const [localProgress, setLocalProgress] = React.useState(progress)
  const [saving, setSaving] = React.useState(false)
  const debounceRef = React.useRef<any>(null)
  React.useEffect(() => { setLocalProgress(assignment.progress || 0) }, [assignment.progress])
  const handleChange = (val: number) => {
    if (!canEdit) return
    setLocalProgress(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      await supabase.from("church_work").update({ progress: val }).eq("id", assignment.id)
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
        <div className={`h-full rounded-full transition-all duration-300 ${getProgressColor(localProgress)}`} style={{ width: `${localProgress}%` }} />
      </div>
      <input type="range" min={0} max={100} step={5} value={localProgress} onChange={(e) => handleChange(Number(e.target.value))} className={`w-full h-1 accent-primary ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} disabled={!canEdit} />
    </div>
  )
}

// ─── Leader Review ─────────────────────────────────────────
function LeaderReviewSection({ assignment, supabase, profile, refresh, canEdit }: { assignment: any; supabase: any; profile: any; refresh: () => void; canEdit: boolean }) {
  const isParent = profile?.role === "adult" || profile?.role === "parent"
  const [score, setScore] = React.useState(assignment.teacher_review?.score || "")
  const [feedback, setFeedback] = React.useState(assignment.teacher_review?.feedback || "")
  const [saving, setSaving] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(!assignment.teacher_review)

  const saveReview = async () => {
    if (!score && !feedback) return
    setSaving(true)
    await supabase.from("church_work").update({
      teacher_review: { score, feedback, reviewer: profile?.display_name || profile?.displayName, date: new Date().toISOString() }
    }).eq("id", assignment.id)
    setSaving(false); setIsEditing(false); refresh()
  }

  if (!isParent && !assignment.teacher_review) return null
  if (!isEditing && assignment.teacher_review) {
    return (
      <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 mt-2 relative">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1.5 font-bold text-purple-800 text-xs uppercase tracking-wider"><CheckCircle2 className="w-4 h-4" /> Leader Review</div>
          {isParent && <Button size="icon" variant="ghost" className="h-6 w-6 text-purple-700 hover:bg-purple-100" onClick={() => setIsEditing(true)}><Pencil className="w-3 h-3" /></Button>}
        </div>
        {assignment.teacher_review.score && <div className="text-2xl font-black text-purple-600 mb-1">{assignment.teacher_review.score}</div>}
        {assignment.teacher_review.feedback && <p className="text-sm text-purple-900">{assignment.teacher_review.feedback}</p>}
        <div className="text-[10px] text-purple-700/70 font-bold mt-2">By {assignment.teacher_review.reviewer} on {format(new Date(assignment.teacher_review.date), "MMM d, yyyy")}</div>
      </div>
    )
  }
  if (isParent) {
    return (
      <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 mt-2">
        <div className="font-bold text-purple-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Add Leader Review</div>
        <div className="grid gap-2">
          <Input placeholder="Score (e.g. Excellent, 10/10)" value={score} onChange={(e) => setScore(e.target.value)} className="bg-white border-purple-200 h-8 text-xs" />
          <Textarea placeholder="Final feedback..." value={feedback} onChange={(e) => setFeedback(e.target.value)} className="bg-white border-purple-200 min-h-[60px] text-xs py-2" />
          <Button className="bg-purple-500 hover:bg-purple-600 text-white w-full font-bold h-8 text-xs rounded-lg mt-1" onClick={saveReview} disabled={saving || (!score && !feedback)}>
            {saving ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
            {assignment.teacher_review ? "Update Review" : "Submit Review"}
          </Button>
        </div>
      </div>
    )
  }
  return null
}

// ─── Comment Section ───────────────────────────────────────
function CWCommentSection({ assignment, supabase, profile, refresh, canEdit }: { assignment: any; supabase: any; profile: any; refresh: () => void; canEdit: boolean }) {
  const { isRecording, startRecording, stopRecording, audioBlob, discardRecording } = useAudioRecorder()
  const [commentFiles, setCommentFiles] = React.useState<FileList | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [sending, setSending] = React.useState(false)
  const [newComment, setNewComment] = React.useState("")
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "👏"]

  const renderCommentText = (text: string) => {
    if (!text) return null
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('@')) return <span key={idx} className="font-bold text-primary bg-primary/10 px-1 rounded mx-0.5">{part}</span>
      return <span key={idx}>{part}</span>
    })
  }

  const existingComments: any[] = React.useMemo(() => {
    if (!assignment.comments) return []
    try { const parsed = JSON.parse(assignment.comments); if (Array.isArray(parsed)) return parsed } catch {}
    return assignment.comments ? [assignment.comments] : []
  }, [assignment.comments])

  const addComment = async () => {
    if ((!newComment.trim() && !audioBlob && (!commentFiles || commentFiles.length === 0)) || !canEdit) return
    setSending(true)
    const author = profile?.display_name || profile?.displayName || "Someone"
    const timestamp = format(new Date(), "MMM d, yyyy 'at' h:mm a")
    const newCommentObj = { author, date: timestamp, text: newComment.trim(), attachments: [] as string[], audioUrl: null as string | null }
    const updated = [...existingComments, newCommentObj]
    await supabase.from("church_work").update({ comments: JSON.stringify(updated), updated_at: new Date().toISOString() }).eq("id", assignment.id)
    setNewComment(""); setCommentFiles(null); discardRecording(); setSending(false); refresh()
  }

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [existingComments])

  const toggleReaction = async (commentIndex: number, emoji: string) => {
    if (!profile?.display_name && !profile?.displayName) return
    const authorName = profile.display_name || profile.displayName
    const updatedComments = [...existingComments]
    let commentObj: any = updatedComments[commentIndex]
    if (typeof commentObj === 'string') { commentObj = { author: "Unknown", date: "", text: commentObj, reactions: {} } }
    else { commentObj = { ...commentObj, reactions: commentObj.reactions || {} } }
    if (!commentObj.reactions[emoji]) commentObj.reactions[emoji] = []
    const usersWhoReacted = commentObj.reactions[emoji]
    if (usersWhoReacted.includes(authorName)) { commentObj.reactions[emoji] = usersWhoReacted.filter((n: string) => n !== authorName); if (commentObj.reactions[emoji].length === 0) delete commentObj.reactions[emoji] }
    else { commentObj.reactions[emoji].push(authorName) }
    updatedComments[commentIndex] = commentObj
    await supabase.from("church_work").update({ comments: JSON.stringify(updatedComments) }).eq("id", assignment.id)
    refresh()
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><MessageSquare className="h-3 w-3" /> Comments {existingComments.length > 0 && `(${existingComments.length})`}</div>
      {existingComments.length > 0 && (
        <div ref={scrollRef} className="space-y-1.5 max-h-28 overflow-y-auto pr-1 scroll-smooth">
          {existingComments.map((c, i) => {
            if (!c) return null
            let obj = typeof c === 'string' ? { author: "Unknown", date: "", text: c, reactions: {} } : c
            return (
              <div key={i} className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 border-l-3 border-primary/30">
                <div className="mb-1"><span className="font-bold text-primary">{obj?.author || "Unknown"}</span> <span className="opacity-70">on {obj?.date || "Unknown date"}</span></div>
                {obj?.text && <p className="mb-1">{renderCommentText(obj.text)}</p>}
                {obj?.audioUrl && <div className="mt-2 mb-1"><audio controls src={obj.audioUrl} className="h-8 w-full max-w-[200px]" /></div>}
                <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-slate-200/50">
                  {REACTION_EMOJIS.map(e => {
                    const users = obj?.reactions?.[e] || []; const count = Array.isArray(users) ? users.length : 0
                    const hasReacted = Array.isArray(users) && users.includes(profile?.display_name || profile?.displayName)
                    return (
                      <button key={e} onClick={() => toggleReaction(i, e)} className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${hasReacted ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={Array.isArray(users) && count > 0 ? users.join(", ") : ""}>
                        {e} {count > 0 ? count : ""}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {canEdit && (
        <div className="flex gap-1 items-end relative">
          <div className="relative flex-1">
            <Textarea placeholder="Add a comment or note..." value={newComment} onChange={e => setNewComment(e.target.value)} className="min-h-[40px] h-auto resize-none rounded-2xl bg-white border-muted pr-[70px] text-[10px] py-1.5"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment() } }} />
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
              {!isRecording ? (
                <Button size="icon" variant="ghost" type="button" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-red-500 transition-colors" onClick={startRecording}><Mic className="h-4 w-4" /></Button>
              ) : (
                <Button size="icon" variant="destructive" type="button" className="h-7 w-7 rounded-lg animate-pulse" onClick={stopRecording}><Square className="h-3 w-3" /></Button>
              )}
            </div>
          </div>
          <Button size="icon" className="h-10 w-10 shrink-0 rounded-2xl rounded-bl-sm bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={addComment} disabled={sending || (!newComment.trim() && !audioBlob)}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN CHURCH WORK TAB COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ChurchWorkTab() {
  const { profile, user } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = React.useState("active")

  // Form State
  const [title, setTitle] = React.useState("")
  const [category, setCategory] = React.useState("Calling")
  const [childName, setChildName] = React.useState(profile?.displayName || "")
  const [dueDate, setDueDate] = React.useState("")
  const [description, setDescription] = React.useState("")
  const { isRecording, startRecording, stopRecording, audioBlob, discardRecording } = useAudioRecorder()
  const [newFiles, setNewFiles] = React.useState<FileList | null>(null)

  // Edit State
  const [editingTask, setEditingTask] = React.useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editCategory, setEditCategory] = React.useState("")
  const [editChildName, setEditChildName] = React.useState("")
  const [editDueDate, setEditDueDate] = React.useState("")
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)

  const [refreshCount, setRefreshCount] = React.useState(0)
  const refresh = () => setRefreshCount(c => c + 1)

  // Fetch family members
  const membersQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("profiles").select("*").eq("family_id", profile.family_id)
  }, [supabase, profile?.family_id])
  const { data: familyMembers } = useCollection(membersQuery)

  const churchWorkQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("church_work").select("*").eq("family_id", profile.familyId).order("due_date", { ascending: true })
  }, [supabase, profile?.familyId, refreshCount])
  const { data: tasks, loading } = useCollection(churchWorkQuery)

  const isParent = profile?.role === "adult" || profile?.role === "parent"
  const childrenList = React.useMemo(() => {
    if (!familyMembers) return [profile?.displayName || ""]
    return familyMembers.map((m: any) => m.display_name).filter(Boolean)
  }, [familyMembers, profile?.displayName])

  React.useEffect(() => {
    if (profile?.displayName && !childName) setChildName(profile.displayName)
  }, [profile?.displayName, childName])

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      "Calling": "bg-purple-100 text-purple-700",
      "Volunteer": "bg-emerald-100 text-emerald-700",
      "Study": "bg-amber-100 text-amber-700",
      "Service Project": "bg-rose-100 text-rose-700",
      "Other": "bg-slate-100 text-slate-700",
    }
    return colors[cat] || "bg-slate-100 text-slate-700"
  }

  const canEditTask = (a: any) => {
    if (isParent) return true
    if (a.assigned_to === profile?.id) return true
    if (a.delegated_to && a.delegated_to.includes(profile?.displayName)) return true
    return false
  }

  const handleAddTask = async () => {
    if (!supabase || !profile?.familyId || !title) return
    setIsSubmitting(true)
    try {
      const data = {
        family_id: profile.familyId,
        title,
        description,
        category,
        assigned_to: childName,
        status: "pending",
        progress: 0,
        time_spent_seconds: 0,
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: [],
        delegated_to: [],
        reminders: []
      }
      const { error } = await supabase.from("church_work").insert([data])
      if (error) throw error
      setIsDialogOpen(false); setTitle(""); setDescription(""); setNewFiles(null); discardRecording()
      refresh()
      toast({ title: "Church Work Added", description: `Added "${title}" for ${childName}.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setIsSubmitting(false) }
  }

  const openEditDialog = (a: any) => {
    setEditingTask(a); setEditTitle(a.title || ""); setEditCategory(a.category || "Calling")
    setEditChildName(a.assigned_to || ""); setEditDueDate(a.due_date ? format(new Date(a.due_date), "yyyy-MM-dd") : "")
    setIsEditDialogOpen(true)
  }

  const handleEditTask = async () => {
    if (!supabase || !editingTask) return
    setIsEditSubmitting(true)
    try {
      const { error } = await supabase.from("church_work").update({
        title: editTitle, category: editCategory, assigned_to: editChildName,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : undefined,
        updated_at: new Date().toISOString()
      }).eq("id", editingTask.id)
      if (error) throw error
      setIsEditDialogOpen(false); setEditingTask(null); refresh()
      toast({ title: "Task Updated", description: `Updated "${editTitle}" successfully.` })
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) }
    finally { setIsEditSubmitting(false) }
  }

  const handleDeleteTask = async (id: string, taskTitle: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from("church_work").delete().eq("id", id)
      if (error) throw error
      refresh(); toast({ title: "Deleted", description: `Removed "${taskTitle}".` })
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) }
  }

  const toggleStatus = async (id: string, current: string) => {
    if (!supabase) return
    const next = current === "pending" ? "completed" : "pending"
    const updates: any = { status: next, updated_at: new Date().toISOString() }
    if (next === "completed") updates.progress = 100
    await supabase.from("church_work").update(updates).eq("id", id)
    refresh()
  }

  const filteredTasks = tasks?.filter((a: any) => (activeTab === "active" ? a.status === "pending" : a.status === "completed")) || []

  return (
    <div className="space-y-4 pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Church className="h-6 w-6" /></div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-primary">Church Work</h1>
          </div>
          <p className="text-muted-foreground font-bold text-sm">Track your callings, volunteer work, and study goals!</p>
        </div>
        {isParent && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { discardRecording(); setNewFiles(null) } }}>
            <>
              <DialogTrigger asChild>
                <Button className="hidden md:flex rounded-xl h-11 px-6 font-black uppercase tracking-wider bg-primary shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> Add Church Work</Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button className="md:hidden fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary z-50 p-0 flex items-center justify-center"><Plus className="h-6 w-6" /></Button>
              </DialogTrigger>
            </>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Church Work Task</DialogTitle>
                <DialogDescription>Add a new calling, volunteer assignment, or study goal.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Task Title</Label>
                  <Input placeholder="e.g. Prepare Sunday School Lesson" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Assigned To</Label>
                    <Select value={childName} onValueChange={setChildName}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{childrenList.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Calling", "Volunteer", "Study", "Service Project", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Description (Optional)</Label>
                  <Textarea placeholder="Any details to help complete this task..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px] rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Attachments (Documents, Photos)</Label>
                  <Input type="file" multiple onChange={(e) => setNewFiles(e.target.files)} />
                </div>
                <div className="grid gap-2">
                  <Label>Voice Note (Instructions)</Label>
                  <div className="flex items-center gap-3">
                    {!isRecording && !audioBlob && <Button type="button" variant="outline" className="rounded-xl w-full" onClick={startRecording}><Mic className="h-4 w-4 mr-2" /> Start Recording</Button>}
                    {isRecording && <Button type="button" variant="destructive" className="rounded-xl w-full animate-pulse" onClick={stopRecording}><Square className="h-4 w-4 mr-2" /> Stop Recording</Button>}
                    {audioBlob && (
                      <div className="flex items-center gap-2 w-full">
                        <audio controls src={URL.createObjectURL(audioBlob)} className="h-10 flex-1" />
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={discardRecording}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask} disabled={!title || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Edit Church Work</DialogTitle><DialogDescription>Update this task&apos;s details.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Task Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Select value={editChildName} onValueChange={setEditChildName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{childrenList.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Calling", "Volunteer", "Study", "Service Project", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingTask && <Button variant="destructive" className="rounded-xl mr-auto" onClick={() => { handleDeleteTask(editingTask.id, editingTask.title); setIsEditDialogOpen(false) }}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>}
            <Button onClick={handleEditTask} disabled={!editTitle || isEditSubmitting} className="rounded-xl">{isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active / History Tabs + View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-sm">
          <TabsList className="bg-muted/50 p-1 rounded-2xl w-full flex h-auto relative z-10">
            <TabsTrigger value="active" className="rounded-xl font-bold py-2 flex-1 data-[state=active]:shadow-lg">Active</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-bold py-2 flex-1 data-[state=active]:shadow-lg">History</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="bg-muted/50 p-1 rounded-xl flex items-center gap-1 hidden sm:flex">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className={`h-8 w-8 rounded-lg ${viewMode === "grid" ? "shadow-sm" : ""}`} onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className={`h-8 w-8 rounded-lg ${viewMode === "list" ? "shadow-sm" : ""}`} onClick={() => setViewMode("list")}><ListIcon className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-3xl" />)}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl">
          <Church className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-black text-2xl uppercase tracking-tighter text-primary">{activeTab === "active" ? "No Active Tasks!" : "No Completed Tasks"}</h3>
          <p className="text-muted-foreground font-bold mt-2">{activeTab === "active" ? "Great job staying on top of your callings!" : "Complete some tasks to see them here."}</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
          {filteredTasks.map((a: any) => {
            const canEdit = canEditTask(a)
            const isOwnerOrParent = isParent || a.assigned_to === profile?.displayName

            const childProfile = familyMembers?.find((m: any) => m.display_name === a.assigned_to)
            const themeColor = childProfile?.theme_color || "var(--primary)"

            const allAttachments = [...(a.attachments || [])]
            const allSubmissions = [...(a.submissions || [])]

            return (
              <Card key={a.id} className={`rounded-3xl border-none shadow-xl overflow-hidden ${a.status === 'completed' ? 'bg-emerald-50/50' : 'bg-white'}`}>
                <div className={`h-3 w-full ${a.status === 'completed' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 ${getCategoryColor(a.category)}`}>{a.category}</Badge>
                      {a.delegated_to && a.delegated_to.length > 0 && (
                        <Badge variant="secondary" className="border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 bg-slate-200"><Users className="h-3 w-3 mr-1" /> Delegated</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isOwnerOrParent && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary" onClick={() => openEditDialog(a)} title="Edit Details"><Pencil className="h-3.5 w-3.5" /></Button>
                      )}
                      <Badge variant={a.status === "completed" ? "default" : "secondary"} className={a.status === "completed" ? "bg-emerald-500" : ""}>{a.status === "completed" ? "Done" : "Pending"}</Badge>
                    </div>
                  </div>

                  <h4 className="font-black text-xl mb-1">{a.title}</h4>
                  {a.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{a.description}</p>}
                  <div className="flex items-center text-[10px] font-bold text-muted-foreground gap-4 flex-wrap mb-4">
                    <span className="flex items-center text-primary"><CalendarIcon className="w-3 h-3 mr-1" /> {a.due_date ? format(new Date(a.due_date), "MMM d, yyyy") : "No date"}</span>
                    <span className="flex items-center font-black px-2 py-0.5 rounded text-white text-[10px] tracking-wide bg-primary" style={{ backgroundColor: themeColor !== "var(--primary)" ? themeColor : undefined }}>{a.assigned_to || "Unassigned"}</span>
                    <span className="flex items-center opacity-70"><Clock className="w-3 h-3 mr-1" /> {a.created_at ? format(new Date(a.created_at), "MMM d") : ""}</span>
                  </div>

                  <CWProgressBar assignment={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />

                  {a.due_date && a.status !== 'completed' && (
                    <div className="flex items-center justify-between text-[10px] font-bold mt-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-muted-foreground">Due Time</span>
                      <span className={new Date(a.due_date) < new Date() ? "text-red-500 animate-pulse" : "text-primary"}>
                        {new Date(a.due_date) < new Date() ? "Overdue" : formatDistanceToNowStrict(new Date(a.due_date))} left
                      </span>
                    </div>
                  )}

                  {a.status === "pending" ? (
                    <div className="flex flex-col gap-3 mt-4">
                      <TaskTimer a={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />
                      <AttachmentFileList files={allAttachments} />
                      <AttachmentFileList files={allSubmissions} />
                      {canEdit && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button onClick={() => toggleStatus(a.id, a.status)} className="flex-1 rounded-xl font-bold h-12 bg-primary text-white">Mark Done</Button>
                        </div>
                      )}
                      {!canEdit && (
                        <div className="bg-slate-50 text-slate-500 font-bold text-xs p-3 rounded-xl text-center border border-slate-100 mt-2">You do not have access to modify this task.</div>
                      )}
                      {a.status === "completed" && <LeaderReviewSection assignment={a} supabase={supabase} profile={profile} refresh={refresh} canEdit={canEdit} />}
                      <CWCommentSection assignment={a} supabase={supabase} profile={profile} refresh={refresh} canEdit={canEdit} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-4">
                      <AttachmentFileList files={allAttachments} />
                      <AttachmentFileList files={allSubmissions} />
                      <div className="text-xs font-bold text-slate-500 mt-2">Time spent: {Math.floor((a.time_spent_seconds || 0) / 60)}m {(a.time_spent_seconds || 0) % 60}s</div>
                      <LeaderReviewSection assignment={a} supabase={supabase} profile={profile} refresh={refresh} canEdit={canEdit} />
                      <CWCommentSection assignment={a} supabase={supabase} profile={profile} refresh={refresh} canEdit={canEdit} />
                      {canEdit && (
                        <div className="flex gap-2 mt-4">
                          <Button onClick={() => toggleStatus(a.id, a.status)} variant="ghost" className="flex-1 rounded-xl text-muted-foreground text-xs">Mark Incomplete</Button>
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
  )
}
