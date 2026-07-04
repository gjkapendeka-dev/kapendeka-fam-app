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
  Users,
  Mic,
  Square,
  Download,
  LayoutGrid,
  List as ListIcon,
  Bell,
  Mail,
  MessageCircle,
  Monitor
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setAudioBlob(null)
    } catch (err) {
      console.error("Error accessing microphone:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const discardRecording = () => {
    setAudioBlob(null)
  }

  return { isRecording, startRecording, stopRecording, audioBlob, discardRecording }
}

function FileList({ files, title = "Attachments" }: { files: string[], title?: string }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 mt-2">
      {files.map((url, i) => {
        const isAudio = url.includes('.webm') || url.includes('.ogg') || url.includes('.mp3') || url.includes('.wav')
        if (isAudio) {
          return (
            <div key={i} className="flex flex-col gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Mic className="h-3 w-3"/> Voice Note</span>
              <audio controls src={url} className="h-10 w-full max-w-full" />
            </div>
          )
        }
        
        let fileName = url.split('/').pop() || `Attachment ${i + 1}`
        try { fileName = decodeURIComponent(fileName) } catch {}
        
        return (
          <div key={i} className="flex items-center justify-between bg-blue-50/50 p-2 rounded-xl border border-blue-100 group">
            <div className="flex items-center gap-2 truncate pr-2">
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm font-medium truncate text-slate-700">{fileName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <a href={url} target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg" title="View">
                <LinkIcon className="h-4 w-4" />
              </a>
              <a href={url} download target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg" title="Download">
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}


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

function CommentSection({ assignment, supabase, profile, refresh, canEdit }: { assignment: any, supabase: any, profile: any, refresh: () => void, canEdit: boolean }) {
  const { isRecording, startRecording, stopRecording, audioBlob, discardRecording } = useAudioRecorder()
  const [commentFiles, setCommentFiles] = React.useState<FileList | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [sending, setSending] = React.useState(false)
  const [newComment, setNewComment] = React.useState("")
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "👏"]

  const existingComments: any[] = React.useMemo(() => {
    if (!assignment.comments) return []
    try {
      const parsed = JSON.parse(assignment.comments)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return assignment.comments ? [assignment.comments] : []
  }, [assignment.comments])

  // Helper to upload files specifically for comments
  const uploadFiles = async (files: FileList | null, audio: Blob | null) => {
    if (!supabase || !profile?.family_id) return { files: [], audio: null }
    const uploadedFiles: string[] = []
    let uploadedAudio: string | null = null

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${profile.family_id}/comments/${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('homework_files').upload(filePath, file)
        if (!uploadError) {
          const { data } = supabase.storage.from('homework_files').getPublicUrl(filePath)
          uploadedFiles.push(data.publicUrl)
        }
      }
    }

    if (audio) {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webm`
      const filePath = `${profile.family_id}/comments/${fileName}`
      const { error: uploadError } = await supabase.storage.from('homework_files').upload(filePath, audio, { contentType: 'audio/webm' })
      if (!uploadError) {
        const { data } = supabase.storage.from('homework_files').getPublicUrl(filePath)
        uploadedAudio = data.publicUrl
      }
    }

    return { files: uploadedFiles, audio: uploadedAudio }
  }

  const addComment = async () => {
    if ((!newComment.trim() && !audioBlob && (!commentFiles || commentFiles.length === 0)) || !canEdit) return
    setSending(true)
    
    const { files: uploadedFiles, audio: uploadedAudio } = await uploadFiles(commentFiles, audioBlob)
    
    const author = profile?.display_name || "Someone"
    const timestamp = format(new Date(), "MMM d, yyyy 'at' h:mm a")
    
    const newCommentObj = {
      author,
      date: timestamp,
      text: newComment.trim(),
      attachments: uploadedFiles,
      audioUrl: uploadedAudio
    }
    
    const updated = [...existingComments, newCommentObj]
    await supabase.from("homework").update({ comments: JSON.stringify(updated), updated_at: new Date().toISOString() }).eq("id", assignment.id)
    
    setNewComment("")
    setCommentFiles(null)
    discardRecording()
    setSending(false)
    refresh()
  }

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [existingComments])

  const toggleReaction = async (commentIndex: number, emoji: string) => {
    if (!profile?.display_name) return
    const authorName = profile.display_name
    
    const updatedComments = [...existingComments]
    const targetComment = updatedComments[commentIndex]
    
    let commentObj: any = targetComment
    if (typeof targetComment === 'string') {
       commentObj = {
         author: targetComment.startsWith('**') ? targetComment.substring(2, targetComment.indexOf('** on')) : "Unknown",
         date: targetComment.startsWith('**') ? targetComment.substring(targetComment.indexOf('** on') + 5, targetComment.indexOf(' — ')) : "",
         text: targetComment.includes(' — ') ? targetComment.substring(targetComment.indexOf(' — ') + 3) : targetComment,
         attachments: [],
         audioUrl: null,
         reactions: {}
       }
    } else {
       commentObj = { ...targetComment, reactions: targetComment.reactions || {} }
    }
    
    if (!commentObj.reactions[emoji]) commentObj.reactions[emoji] = []
    
    const usersWhoReacted = commentObj.reactions[emoji]
    if (usersWhoReacted.includes(authorName)) {
       commentObj.reactions[emoji] = usersWhoReacted.filter((n: string) => n !== authorName)
       if (commentObj.reactions[emoji].length === 0) delete commentObj.reactions[emoji]
    } else {
       commentObj.reactions[emoji].push(authorName)
    }
    
    updatedComments[commentIndex] = commentObj
    await supabase.from("homework").update({ comments: JSON.stringify(updatedComments) }).eq("id", assignment.id)
    refresh()
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        Comments {existingComments.length > 0 && `(${existingComments.length})`}
      </div>
      {existingComments.length > 0 && (
        <div ref={scrollRef} className="space-y-1.5 max-h-28 overflow-y-auto pr-1 scroll-smooth">
          {existingComments.map((c, i) => {
            if (!c) return null;
            
            let obj = c;
            if (typeof c === 'string') {
              obj = {
                author: c.startsWith('**') ? c.substring(2, c.indexOf('** on')) : "Unknown",
                date: c.startsWith('**') ? c.substring(c.indexOf('** on') + 5, c.indexOf(' — ')) : "",
                text: c.includes(' — ') ? c.substring(c.indexOf(' — ') + 3) : c,
                reactions: {}
              }
            }

            return (
              <div key={i} className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 border-l-3 border-primary/30">
                <div className="mb-1">
                  <span className="font-bold text-primary">{obj?.author || "Unknown"}</span> <span className="opacity-70">on {obj?.date || "Unknown date"}</span>
                </div>
                {obj?.text && <p className="mb-1">{obj.text}</p>}
                {obj?.audioUrl && (
                  <div className="mt-2 mb-1">
                    <audio controls src={obj.audioUrl} className="h-8 w-full max-w-[200px]" />
                  </div>
                )}
                {obj?.attachments && obj.attachments.length > 0 && (
                  <FileList files={obj.attachments} title="" />
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {obj?.reactions && Object.entries(obj.reactions).map(([emoji, users]: [string, any]) => (
                    <button 
                      key={emoji} 
                      onClick={() => toggleReaction(i, emoji)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border ${Array.isArray(users) && users.includes(profile?.display_name) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white border-slate-200 text-slate-500'}`}
                      title={Array.isArray(users) ? users.join(", ") : ""}
                    >
                      {emoji} {Array.isArray(users) ? users.length : 0}
                    </button>
                  ))}
                  <div className="group/react relative inline-block">
                     <button className="text-[10px] px-1.5 py-0.5 rounded-full border bg-white border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors">+</button>
                     <div className="absolute left-0 bottom-full mb-1 hidden group-hover/react:flex bg-white shadow-md border rounded-full px-1.5 py-1 gap-1.5 z-10">
                       {REACTION_EMOJIS.map(e => (
                         <button key={e} onClick={() => toggleReaction(i, e)} className="hover:scale-125 transition-transform text-sm">{e}</button>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {canEdit && (
        <div className="flex flex-col gap-2 mt-2">
          {audioBlob && (
            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
              <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 flex-1" />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={discardRecording}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {commentFiles && commentFiles.length > 0 && (
             <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-xs font-bold text-slate-600">
                <FileText className="h-4 w-4" />
                {commentFiles.length} file(s) selected
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => setCommentFiles(null)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
             </div>
          )}
          <div className="flex gap-1 items-end relative">
            <div className="relative flex-1">
               <Textarea 
                 placeholder="Add a comment or note..." 
                 value={newComment} 
                 onChange={e => setNewComment(e.target.value)}
                 className="min-h-[40px] h-[40px] resize-none rounded-2xl bg-white border-muted pr-[70px] text-xs py-2.5"
                 onKeyDown={e => {
                   if (e.key === "Enter" && !e.shiftKey) {
                     e.preventDefault()
                     addComment()
                   }
                 }}
               />
               <div className="absolute right-2 top-1.5 flex items-center gap-1">
                 <Label className="cursor-pointer h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-muted-foreground transition-colors">
                   <Upload className="h-4 w-4" />
                   <Input type="file" multiple className="hidden" onChange={(e) => setCommentFiles(e.target.files)} />
                 </Label>
                 {!isRecording ? (
                   <Button size="icon" variant="ghost" type="button" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-red-500 transition-colors" onClick={startRecording}>
                     <Mic className="h-4 w-4" />
                   </Button>
                 ) : (
                   <Button size="icon" variant="destructive" type="button" className="h-7 w-7 rounded-lg animate-pulse" onClick={stopRecording}>
                     <Square className="h-3 w-3" />
                   </Button>
                 )}
               </div>
            </div>
            <Button size="icon" className="h-10 w-10 shrink-0 rounded-2xl rounded-bl-sm bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={addComment} disabled={sending || (!newComment.trim() && !audioBlob && !commentFiles)}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function RemindersDialog({ a, supabase, refresh, profile, user }: { a: any, supabase: any, refresh: () => void, profile: any, user: any }) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [pushEmail, setPushEmail] = React.useState(false)
  const [pushWhatsapp, setPushWhatsapp] = React.useState(false)
  const [pushDashboard, setPushDashboard] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const reminders = a.reminders || []

  const handleAdd = async () => {
    if (!date || !time || !message || saving) return
    setSaving(true)
    
    const newReminder = {
      id: Date.now().toString(),
      date,
      time,
      message,
      pushEmail,
      pushWhatsapp,
      pushDashboard,
      created_at: new Date().toISOString()
    }

    const updated = [...reminders, newReminder]
    
    try {
      await supabase.from("homework").update({ reminders: updated, updated_at: new Date().toISOString() }).eq("id", a.id)
      
      if (pushDashboard && profile?.family_id) {
        // Send a broadcast immediately for demonstration (or it would be a background job)
        await supabase.from("broadcasts").insert([{
          family_id: profile.family_id,
          message: `Reminder for ${a.title}: ${message}`,
          type: "reminder"
        }])
      }

      if (pushEmail && user?.email) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: `Kapendeka Reminder: ${a.title}`,
            html: `<p>A reminder has been set for <strong>${a.title}</strong>:</p><p><em>"${message}"</em></p><p>Scheduled for: <strong>${date} at ${time}</strong></p><p>— Sent via Kapendeka Universe Hub</p>`
          })
        })
      }

      setDate("")
      setTime("")
      setMessage("")
      setPushEmail(false)
      setPushWhatsapp(false)
      setPushDashboard(true)
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const updated = reminders.filter((r: any) => r.id !== id)
    await supabase.from("homework").update({ reminders: updated }).eq("id", a.id)
    refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary relative"
          title="Reminders"
        >
          <Bell className="h-3.5 w-3.5" />
          {reminders.length > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assignment Reminders</DialogTitle>
          <DialogDescription>Set up multiple reminders to notify everyone.</DialogDescription>
        </DialogHeader>
        
        {reminders.length > 0 && (
          <div className="space-y-2 mb-4">
            {reminders.map((r: any) => (
              <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex items-start justify-between border border-slate-100">
                <div>
                  <p className="text-sm font-bold">{r.message}</p>
                  <p className="text-xs text-muted-foreground">{r.date} at {r.time}</p>
                  <div className="flex gap-1 mt-1">
                    {r.pushEmail && <Badge variant="outline" className="text-[9px] px-1 py-0"><Mail className="w-2 h-2 mr-1"/>Email</Badge>}
                    {r.pushWhatsapp && <Badge variant="outline" className="text-[9px] px-1 py-0"><MessageCircle className="w-2 h-2 mr-1"/>WhatsApp</Badge>}
                    {r.pushDashboard && <Badge variant="outline" className="text-[9px] px-1 py-0"><Monitor className="w-2 h-2 mr-1"/>Dashboard</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 pt-4 border-t">
          <Label className="font-bold">Add New Reminder</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-8" />
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Message</Label>
            <Input placeholder="e.g. Don't forget to pack your diorama!" value={message} onChange={e => setMessage(e.target.value)} className="h-8" />
          </div>
          <div className="grid gap-2 mt-2">
            <Label className="text-xs font-bold">Push Notifications via:</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <Checkbox checked={pushDashboard} onCheckedChange={(c) => setPushDashboard(c as boolean)} /> Dashboard
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <Checkbox checked={pushEmail} onCheckedChange={(c) => setPushEmail(c as boolean)} /> Email
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <Checkbox checked={pushWhatsapp} onCheckedChange={(c) => setPushWhatsapp(c as boolean)} /> WhatsApp
              </label>
            </div>
          </div>
          <Button className="mt-2 h-8 rounded-lg" onClick={handleAdd} disabled={saving || !date || !time || !message}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-2" />}
            Save Reminder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SchoolPage() {
  const { profile, user } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [uploadingId, setUploadingId] = React.useState<string | null>(null)
  
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")

  // Form State
  const [title, setTitle] = React.useState("")
  const [subject, setSubject] = React.useState("Math")
  const [childName, setChildName] = React.useState("Gina")
  const [category, setCategory] = React.useState("Daily Homework")
  const [activeTab, setActiveTab] = React.useState("active")
  const [dueDate, setDueDate] = React.useState("")
  const [newFiles, setNewFiles] = React.useState<FileList | null>(null)
  
  const { isRecording, startRecording, stopRecording, audioBlob, discardRecording } = useAudioRecorder()

  // Submission State
  const [submitComment, setSubmitComment] = React.useState("")
  const [submitFiles, setSubmitFiles] = React.useState<FileList | null>(null)
  const submitAudio = useAudioRecorder()

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
        updated_at: new Date().toISOString()
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

  const uploadFilesToSupabase = async (files: FileList | null, audio: Blob | null, folder: string) => {
    if (!supabase || !profile?.family_id) return []
    const uploadedUrls: string[] = []

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${profile.family_id}/${folder}/${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('homework_files').upload(filePath, file)
        if (!uploadError) {
          const { data } = supabase.storage.from('homework_files').getPublicUrl(filePath)
          uploadedUrls.push(data.publicUrl)
        }
      }
    }

    if (audio) {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webm`
      const filePath = `${profile.family_id}/${folder}/${fileName}`
      const { error: uploadError } = await supabase.storage.from('homework_files').upload(filePath, audio, { contentType: 'audio/webm' })
      if (!uploadError) {
        const { data } = supabase.storage.from('homework_files').getPublicUrl(filePath)
        uploadedUrls.push(data.publicUrl)
      }
    }

    return uploadedUrls;
  }

  const handleAddAssignment = async () => {
    if (!supabase || !profile?.family_id || !title) return

    setIsSubmitting(true)

    try {
      const attachmentUrls = await uploadFilesToSupabase(newFiles, audioBlob, 'new')

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
        updated_at: new Date().toISOString(),
        attachments: attachmentUrls,
        delegated_to: [],
        reminders: []
      }

      const { error } = await supabase.from("homework").insert([data])
      if (error) throw error

      setIsDialogOpen(false)
      setTitle("")
      setNewFiles(null)
      discardRecording()
      refresh()
      toast({ title: "Assignment Added", description: `Added ${title} for ${childName}.` })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error adding homework", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitWork = async (assignmentId: string) => {
    if (!supabase || !profile?.family_id) return
    
    setUploadingId(assignmentId)
    try {
       const submissionUrls = await uploadFilesToSupabase(submitFiles, submitAudio.audioBlob, assignmentId)
       
       const assignment = assignments?.find(a => a.id === assignmentId)
       const existingSubmissions = assignment?.submissions || []
       const newSubmissions = [...existingSubmissions, ...submissionUrls]

       const updates: any = { submissions: newSubmissions, updated_at: new Date().toISOString() }
       
       if (submitComment.trim()) {
          const author = profile?.display_name || "Someone"
          const existingComments = (() => {
            try { return assignment?.comments ? JSON.parse(assignment.comments) : [] } catch { return assignment?.comments ? [assignment.comments] : [] }
          })()
          const timestamp = format(new Date(), "MMM d, yyyy 'at' h:mm a")
          
          const newCommentObj = {
            author,
            date: timestamp,
            text: submitComment.trim(),
            attachments: [],
            audioUrl: null
          }
          
          const newComments = [...existingComments, newCommentObj]
          updates.comments = JSON.stringify(newComments)
       }

       await supabase.from("homework").update(updates).eq("id", assignmentId)
       
       toast({ title: "Work Attached!", description: "Files uploaded successfully.", className: "bg-emerald-500 text-white" })
       
       setSubmitFiles(null)
       setSubmitComment("")
       submitAudio.discardRecording()
       
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
    const updates: any = { status: next, updated_at: new Date().toISOString() }
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

  const filteredAssignments = assignments?.filter((a: any) => (activeTab === "active" ? a.status === "pending" : a.status === "done")) || []

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto pb-20 pr-14 relative">
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
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
             setIsDialogOpen(open)
             if (!open) {
               discardRecording()
               setNewFiles(null)
             }
           }}>
             <>
               <DialogTrigger asChild>
                 <Button className="hidden md:flex rounded-xl h-11 px-6 font-black uppercase tracking-wider bg-primary shadow-lg shadow-primary/20">
                   <Plus className="h-4 w-4 mr-2" /> Add Homework
                 </Button>
               </DialogTrigger>
               <DialogTrigger asChild>
                 <Button className="md:hidden fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary z-50 p-0 flex items-center justify-center">
                   <Plus className="h-6 w-6" />
                 </Button>
               </DialogTrigger>
             </>
             <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
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
                   <Label>Attachments (Documents, Photos)</Label>
                   <Input 
                     type="file"
                     multiple
                     onChange={(e) => setNewFiles(e.target.files)} 
                   />
                 </div>
                 <div className="grid gap-2">
                   <Label>Voice Note (Instructions)</Label>
                   <div className="flex items-center gap-3">
                     {!isRecording && !audioBlob && (
                       <Button type="button" variant="outline" className="rounded-xl w-full" onClick={startRecording}>
                         <Mic className="h-4 w-4 mr-2" /> Start Recording
                       </Button>
                     )}
                     {isRecording && (
                       <Button type="button" variant="destructive" className="rounded-xl w-full animate-pulse" onClick={stopRecording}>
                         <Square className="h-4 w-4 mr-2" /> Stop Recording
                       </Button>
                     )}
                     {audioBlob && (
                       <div className="flex items-center gap-2 w-full">
                         <audio controls src={URL.createObjectURL(audioBlob)} className="h-10 flex-1" />
                         <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={discardRecording}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     )}
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
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted/50 p-1 rounded-2xl w-full max-w-sm flex h-auto relative z-10">
            <TabsTrigger value="active" className="rounded-xl font-bold py-2 flex-1 data-[state=active]:shadow-lg">Active</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-bold py-2 flex-1 data-[state=active]:shadow-lg">History</TabsTrigger>
          </TabsList>
          
          <div className="bg-muted/50 p-1 rounded-xl flex items-center gap-1 hidden sm:flex">
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"} 
              size="icon" 
              className={`h-8 w-8 rounded-lg ${viewMode === "grid" ? "shadow-sm" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="icon" 
              className={`h-8 w-8 rounded-lg ${viewMode === "list" ? "shadow-sm" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">

        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
            {[1,2,3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl">
            <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-black text-2xl uppercase tracking-tighter text-primary">No Homework!</h3>
            <p className="text-muted-foreground font-bold mt-2">Time to play in the Arcade!</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
            {filteredAssignments.map((a: any) => {
              const canEdit = canEditAssignment(a);
              const isOwnerOrParent = isParent || a.child_name === profile?.display_name;

              let allAttachments = [...(a.attachments || [])];
              if (a.attachment_url && !allAttachments.includes(a.attachment_url)) allAttachments.push(a.attachment_url);

              let allSubmissions = [...(a.submissions || [])];
              if (a.submission_url && !allSubmissions.includes(a.submission_url)) allSubmissions.push(a.submission_url);

              if (viewMode === "list") {
                return (
                  <Card key={a.id} className={`rounded-3xl border-none shadow-sm overflow-hidden flex flex-col sm:flex-row ${a.status === 'done' ? 'bg-emerald-50/50' : 'bg-white'}`}>
                    <div className={`h-full w-2 shrink-0 ${a.status === 'done' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                    <CardContent className="p-4 sm:p-6 flex-1 flex flex-col sm:flex-row gap-4 sm:items-center">
                      <div className="flex-1">
                        <div className="flex gap-2 flex-wrap mb-2">
                          <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 ${getSubjectColor(a.subject)}`}>{a.subject}</Badge>
                          {a.category && <Badge variant="outline" className="border-primary/20 font-black text-[10px] uppercase tracking-wider px-3 py-1 text-primary">{a.category}</Badge>}
                        </div>
                        <h4 className="font-black text-lg mb-1">{a.title}</h4>
                        <div className="flex items-center text-[10px] font-bold text-muted-foreground gap-4 flex-wrap mt-2 mb-2">
                           <span className="flex items-center text-primary"><CalendarIcon className="w-3 h-3 mr-1"/> {a.due_date ? format(new Date(a.due_date), "MMM d, yyyy") : "No date"}</span>
                           <span className="flex items-center text-accent"><FileText className="w-3 h-3 mr-1"/> For: {a.child_name}</span>
                           <span className="flex items-center opacity-70"><Clock className="w-3 h-3 mr-1"/> Posted: {a.created_at ? format(new Date(a.created_at), "MMM d 'at' h:mm a") : "Unknown"}</span>
                           {a.updated_at && <span className="flex items-center opacity-70"><Pencil className="w-3 h-3 mr-1"/> Edited: {format(new Date(a.updated_at), "MMM d 'at' h:mm a")}</span>}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center min-w-[200px]">
                        <ProgressBar assignment={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col shrink-0">
                        {canEdit && a.status === "pending" && (
                          <Button onClick={() => toggleStatus(a.id, a.status)} className="rounded-xl font-bold bg-primary text-white flex-1 sm:w-full">Mark Done</Button>
                        )}
                        {canEdit && a.status === "done" && (
                          <Button onClick={() => toggleStatus(a.id, a.status)} variant="outline" className="rounded-xl font-bold flex-1 sm:w-full">Mark Incomplete</Button>
                        )}
                        <div className="flex gap-1 justify-end">
                          <RemindersDialog a={a} supabase={supabase} refresh={refresh} profile={profile} user={user} />
                          {isOwnerOrParent && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => openDelegateDialog(a)}>
                              <Users className="h-4 w-4" />
                            </Button>
                          )}
                          {isOwnerOrParent && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => openEditDialog(a)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

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
                      <RemindersDialog a={a} supabase={supabase} refresh={refresh} profile={profile} user={user} />
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
                      {isOwnerOrParent && (
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
                  <div className="flex items-center text-[10px] font-bold text-muted-foreground gap-4 flex-wrap mb-4">
                     <span className="flex items-center text-primary"><CalendarIcon className="w-3 h-3 mr-1"/> {a.due_date ? format(new Date(a.due_date), "MMM d, yyyy") : "No date"}</span>
                     <span className="flex items-center text-accent"><FileText className="w-3 h-3 mr-1"/> For: {a.child_name}</span>
                     <span className="flex items-center opacity-70"><Clock className="w-3 h-3 mr-1"/> Posted: {a.created_at ? format(new Date(a.created_at), "MMM d 'at' h:mm a") : "Unknown"}</span>
                     {a.updated_at && <span className="flex items-center opacity-70"><Pencil className="w-3 h-3 mr-1"/> Edited: {format(new Date(a.updated_at), "MMM d 'at' h:mm a")}</span>}
                  </div>

                  <ProgressBar assignment={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />

                  {a.status === "pending" ? (
                     <div className="flex flex-col gap-3 mt-4">
                        <AssignmentTimer a={a} supabase={supabase} refresh={refresh} canEdit={canEdit} />
                        
                        <div className="flex flex-col gap-2 mt-2">
                          <FileList files={allAttachments} title="Instructions" />
                          <FileList files={allSubmissions} title="Submitted Work" />

                          {canEdit && (
                            <div className="flex items-center gap-2 mt-2">
                              <Button 
                                onClick={() => toggleStatus(a.id, a.status)}
                                className="flex-1 rounded-xl font-bold h-12 bg-primary text-white"
                              >
                                Mark Done
                              </Button>
                              
                            <Dialog onOpenChange={(open) => {
                              if (!open) {
                                submitAudio.discardRecording();
                                setSubmitFiles(null);
                                setSubmitComment("");
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button className="rounded-xl h-12 px-4 bg-primary/10 text-primary font-bold hover:bg-primary/20" disabled={uploadingId === a.id}>
                                  {uploadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                  {uploadingId !== a.id && "Attach Work"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Upload Completed Work</DialogTitle>
                                  <DialogDescription>Add photos, documents, and voice notes for your completed work.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label>Comments (Optional)</Label>
                                    <Textarea 
                                      placeholder="e.g. Struggled with question 4" 
                                      className="rounded-xl"
                                      value={submitComment}
                                      onChange={(e) => setSubmitComment(e.target.value)}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Photos / Documents</Label>
                                    <Input 
                                      type="file" 
                                      multiple
                                      accept="image/*,application/pdf"
                                      className="rounded-xl"
                                      onChange={(e) => setSubmitFiles(e.target.files)}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Voice Note (Optional)</Label>
                                    <div className="flex items-center gap-3">
                                      {!submitAudio.isRecording && !submitAudio.audioBlob && (
                                        <Button type="button" variant="outline" className="rounded-xl w-full" onClick={submitAudio.startRecording}>
                                          <Mic className="h-4 w-4 mr-2" /> Start Recording
                                        </Button>
                                      )}
                                      {submitAudio.isRecording && (
                                        <Button type="button" variant="destructive" className="rounded-xl w-full animate-pulse" onClick={submitAudio.stopRecording}>
                                          <Square className="h-4 w-4 mr-2" /> Stop Recording
                                        </Button>
                                      )}
                                      {submitAudio.audioBlob && (
                                        <div className="flex items-center gap-2 w-full">
                                          <audio controls src={URL.createObjectURL(submitAudio.audioBlob)} className="h-10 flex-1" />
                                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={submitAudio.discardRecording}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => handleSubmitWork(a.id)} disabled={uploadingId === a.id || (!submitFiles && !submitAudio.audioBlob && !submitComment)}>
                                    {uploadingId === a.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Upload & Save
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            </div>
                          )}
                          {!canEdit && (
                            <div className="bg-slate-50 text-slate-500 font-bold text-xs p-3 rounded-xl text-center border border-slate-100 mt-2">
                              You do not have access to modify this assignment.
                            </div>
                          )}
                        </div>

                        <CommentSection assignment={a} supabase={supabase} profile={profile} refresh={refresh} canEdit={canEdit} />
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2 mt-4">
                        <FileList files={allAttachments} title="Instructions" />
                        <FileList files={allSubmissions} title="Submitted Work" />
                        
                        <div className="text-xs font-bold text-slate-500 mt-2">Time spent: {Math.floor((a.time_spent_seconds || 0) / 60)}m {(a.time_spent_seconds || 0) % 60}s</div>
                        
                        <CommentSection assignment={a} supabase={supabase} profile={profile} refresh={refresh} canEdit={canEdit} />

                        {canEdit && (
                          <div className="flex gap-2 mt-4">
                             <Button 
                               onClick={() => toggleStatus(a.id, a.status)}
                               variant="ghost" 
                               className="flex-1 rounded-xl text-muted-foreground text-xs"
                             >
                                Mark Incomplete
                             </Button>
                             
                             <Dialog onOpenChange={(open) => {
                              if (!open) {
                                submitAudio.discardRecording();
                                setSubmitFiles(null);
                                setSubmitComment("");
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button className="rounded-xl h-12 px-4 bg-primary/10 text-primary font-bold hover:bg-primary/20" disabled={uploadingId === a.id}>
                                  {uploadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                  {uploadingId !== a.id && "Attach More Work"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Upload Completed Work</DialogTitle>
                                  <DialogDescription>Add photos, documents, and voice notes for your completed work.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label>Comments (Optional)</Label>
                                    <Textarea 
                                      placeholder="e.g. Struggled with question 4" 
                                      className="rounded-xl"
                                      value={submitComment}
                                      onChange={(e) => setSubmitComment(e.target.value)}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Photos / Documents</Label>
                                    <Input 
                                      type="file" 
                                      multiple
                                      accept="image/*,application/pdf"
                                      className="rounded-xl"
                                      onChange={(e) => setSubmitFiles(e.target.files)}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Voice Note (Optional)</Label>
                                    <div className="flex items-center gap-3">
                                      {!submitAudio.isRecording && !submitAudio.audioBlob && (
                                        <Button type="button" variant="outline" className="rounded-xl w-full" onClick={submitAudio.startRecording}>
                                          <Mic className="h-4 w-4 mr-2" /> Start Recording
                                        </Button>
                                      )}
                                      {submitAudio.isRecording && (
                                        <Button type="button" variant="destructive" className="rounded-xl w-full animate-pulse" onClick={submitAudio.stopRecording}>
                                          <Square className="h-4 w-4 mr-2" /> Stop Recording
                                        </Button>
                                      )}
                                      {submitAudio.audioBlob && (
                                        <div className="flex items-center gap-2 w-full">
                                          <audio controls src={URL.createObjectURL(submitAudio.audioBlob)} className="h-10 flex-1" />
                                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={submitAudio.discardRecording}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => handleSubmitWork(a.id)} disabled={uploadingId === a.id || (!submitFiles && !submitAudio.audioBlob && !submitComment)}>
                                    {uploadingId === a.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Upload & Save
                                  </Button>
                                </DialogFooter>
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
