
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
  Calendar as CalendarIcon
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
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, updateDoc, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function SchoolPage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [title, setTitle] = React.useState("")
  const [subject, setSubject] = React.useState("Math")
  const [childName, setChildName] = React.useState("Junior")
  const [dueDate, setDueDate] = React.useState("")

  const homeworkQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(
      collection(db, "homework"),
      where("familyId", "==", profile.familyId),
      orderBy("dueDate", "asc")
    )
  }, [db, profile?.familyId])

  const { data: assignments, loading } = useCollection(homeworkQuery)

  const handleAddAssignment = () => {
    if (!db || !profile?.familyId || !title) return

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      title,
      subject,
      childName,
      status: "pending",
      dueDate: dueDate ? new Date(dueDate).toISOString() : serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    addDoc(collection(db, "homework"), data)
      .then(() => {
        setIsDialogOpen(false)
        setTitle("")
        toast({ title: "Assignment Added", description: `Added ${title} for ${childName}.` })
      })
      .finally(() => setIsSubmitting(false))
  }

  const toggleStatus = (id: string, current: string) => {
    if (!db) return
    const next = current === "pending" ? "done" : "pending"
    updateDoc(doc(db, "homework", id), { status: next })
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Academic Hub</h1>
          <p className="text-muted-foreground font-medium">Tracking homework and progress for the Kapendeka kids</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Log Assignment
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
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Active Assignments
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
              {assignments?.filter(a => a.status === 'pending').length || 0} Pending
            </Badge>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)
            ) : assignments?.length === 0 ? (
              <Card className="border-2 border-dashed rounded-[2.5rem] p-12 text-center bg-muted/5">
                <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No school work logged</h3>
                <p className="text-muted-foreground">Keep the Kapendeka kids on track by adding their homework!</p>
              </Card>
            ) : (
              assignments?.map((item) => (
                <Card key={item.id} className={`rounded-2xl border-none shadow-sm transition-all hover:shadow-md ${item.status === 'done' ? 'opacity-60 bg-muted/20' : 'bg-white'}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                      {item.status === 'done' ? <CheckCircle2 className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20">
                          {item.subject}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">• {item.childName}</span>
                      </div>
                      <h4 className={`font-bold text-lg truncate ${item.status === 'done' ? 'line-through' : ''}`}>{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                          <Clock className="h-3 w-3" />
                          Due {item.dueDate ? format(new Date(item.dueDate), "MMM dd") : "TBD"}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`rounded-xl h-12 w-12 transition-colors ${item.status === 'done' ? 'text-emerald-500' : 'text-muted-foreground'}`}
                      onClick={() => toggleStatus(item.id, item.status)}
                    >
                      <CheckCircle2 className="h-6 w-6" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-primary to-indigo-800 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" />
                Study Streaks
              </CardTitle>
              <CardDescription className="text-indigo-100">Consistency in the Universe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Junior", streak: 5, color: "bg-emerald-500" },
                { name: "Sarah", streak: 2, color: "bg-amber-500" },
              ].map((m, i) => (
                <div key={i} className="bg-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <span className="font-bold">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{m.streak} Days</span>
                    <div className={`h-2 w-2 rounded-full ${m.color}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Teacher Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm border border-accent/10">
                <AlertCircle className="h-5 w-5 text-accent shrink-0" />
                <p className="text-xs font-medium text-muted-foreground">
                  "Math test scheduled for next Friday. Focus on fractions and decimals."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
