"use client"

import * as React from "react"
import { 
  ShieldAlert, 
  Plus, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Download, 
  Hourglass,
  Loader2,
  AlertTriangle,
  Upload,
  Unlock,
  Archive
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

export default function LegacyPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  // Vault State
  const [isVaultDialogOpen, setIsVaultDialogOpen] = React.useState(false)
  const [isVaultSubmitting, setIsVaultSubmitting] = React.useState(false)
  const [vaultTitle, setVaultTitle] = React.useState("")
  const [vaultType, setVaultType] = React.useState("IDs")

  // Capsule State
  const [isCapsuleDialogOpen, setIsCapsuleDialogOpen] = React.useState(false)
  const [isCapsuleSubmitting, setIsCapsuleSubmitting] = React.useState(false)
  const [capsuleTitle, setCapsuleTitle] = React.useState("")
  const [capsuleContent, setCapsuleContent] = React.useState("")
  const [capsuleUnlockDate, setCapsuleUnlockDate] = React.useState("")
  const [capsuleFile, setCapsuleFile] = React.useState<File | null>(null)

  // Queries
  const vaultQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("emergencyVault").select("*").eq("familyId", profile.familyId)
  }, [supabase, profile?.familyId])

  const capsulesQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("time_capsules").select("*, creator:profiles!creator_id(display_name, avatar_url)").eq("family_id", profile.familyId).order('unlock_date', { ascending: true })
  }, [supabase, profile?.familyId])

  const { data: docs, loading: vaultLoading } = useCollection(vaultQuery)
  const { data: capsules, loading: capsulesLoading } = useCollection(capsulesQuery)

  const handleVaultUpload = () => {
    if (!supabase || !profile?.familyId || !vaultTitle) return
    if (profile.role !== 'parent' && profile.role !== 'admin') {
      toast({ variant: "destructive", title: "Access Denied", description: "Only parents can add to the vault." })
      return
    }

    setIsVaultSubmitting(true)
    const data = {
      familyId: profile.familyId,
      title: vaultTitle,
      type: vaultType,
      accessRoles: ["parent", "admin"],
      createdAt: new Date().toISOString(),
    }

    supabase.from("emergencyVault").insert([data])
      .then(() => {
        setIsVaultDialogOpen(false)
        setVaultTitle("")
        toast({ title: "Document Vaulted", description: `${vaultTitle} is now secured.` })
      })
      .finally(() => setIsVaultSubmitting(false))
  }

  const handleCapsuleUpload = async () => {
    if (!supabase || !profile?.familyId || !capsuleTitle || !capsuleUnlockDate) return
    
    setIsCapsuleSubmitting(true)
    let mediaUrl = null

    try {
      if (capsuleFile) {
        const fileExt = capsuleFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${profile.familyId}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('capsules')
          .upload(filePath, capsuleFile)

        if (uploadError) throw uploadError
        mediaUrl = filePath
      }

      const { error: insertError } = await supabase.from('time_capsules').insert([{
        family_id: profile.familyId,
        creator_id: profile.id,
        title: capsuleTitle,
        content: capsuleContent,
        unlock_date: new Date(capsuleUnlockDate).toISOString(),
        media_url: mediaUrl
      }])

      if (insertError) throw insertError

      setIsCapsuleDialogOpen(false)
      setCapsuleTitle("")
      setCapsuleContent("")
      setCapsuleFile(null)
      toast({ title: "Time Capsule Sealed", description: "Your message has been locked for the future." })

    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message || "Could not seal capsule." })
    } finally {
      setIsCapsuleSubmitting(false)
    }
  }

  const isParent = profile?.role === 'parent' || profile?.role === 'admin'

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Archive className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground">Family Legacy</h1>
            <p className="text-muted-foreground font-medium">Secure vault and time capsules for the future.</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="capsules" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="capsules" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
            Time Capsules
          </TabsTrigger>
          <TabsTrigger value="vault" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">
            Emergency Vault
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capsules" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Future Messages</h2>
            <Dialog open={isCapsuleDialogOpen} onOpenChange={setIsCapsuleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20">
                  <Plus className="h-4 w-4 mr-2" /> Seal New Capsule
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Seal a Time Capsule</DialogTitle>
                  <DialogDescription>Create a message or upload a file that unlocks on a specific date in the future.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Capsule Title</Label>
                    <Input placeholder="e.g. For Emma's 18th Birthday" value={capsuleTitle} onChange={(e) => setCapsuleTitle(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Message</Label>
                    <Textarea placeholder="Write your future message here..." value={capsuleContent} onChange={(e) => setCapsuleContent(e.target.value)} rows={4} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Attach Photo/Video</Label>
                    <Input type="file" onChange={(e) => setCapsuleFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unlock Date</Label>
                    <Input type="date" value={capsuleUnlockDate} onChange={(e) => setCapsuleUnlockDate(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCapsuleUpload} disabled={!capsuleTitle || !capsuleUnlockDate || isCapsuleSubmitting} className="bg-indigo-500 w-full rounded-xl">
                    {isCapsuleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                    {isCapsuleSubmitting ? "Sealing..." : "Seal Capsule"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {capsulesLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)
            ) : capsules?.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
                <Hourglass className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No time capsules have been sealed yet.</p>
              </div>
            ) : (
              capsules?.map((capsule) => {
                const isUnlocked = new Date(capsule.unlock_date) <= new Date();
                const unlockDateStr = new Date(capsule.unlock_date).toLocaleDateString();

                return (
                  <Card key={capsule.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-gradient-to-br from-white to-indigo-50/50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {isUnlocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold border-none ${isUnlocked ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {isUnlocked ? 'Unlocked' : `Opens ${unlockDateStr}`}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3 truncate">{capsule.title}</CardTitle>
                      <CardDescription className="text-xs">From: {capsule.creator?.display_name || "Family Member"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isUnlocked ? (
                        <p className="text-sm text-foreground/80 line-clamp-3">{capsule.content || "Media attached."}</p>
                      ) : (
                        <div className="w-full h-16 bg-muted/50 rounded-lg flex flex-col items-center justify-center border border-dashed border-indigo-200 backdrop-blur-sm">
                          <Lock className="h-4 w-4 text-indigo-300 mb-1" />
                          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Content Locked</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="vault" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Emergency Documents
            </h2>
            {isParent && (
              <Dialog open={isVaultDialogOpen} onOpenChange={setIsVaultDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20">
                    <Plus className="h-4 w-4 mr-2" /> Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Secure a Document</DialogTitle>
                    <DialogDescription>Store important files in the family vault.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Document Title</Label>
                      <Input placeholder="e.g. Health Insurance Policy" value={vaultTitle} onChange={(e) => setVaultTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select value={vaultType} onValueChange={setVaultType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDs">Identities & Passports</SelectItem>
                          <SelectItem value="insurance">Insurance Policies</SelectItem>
                          <SelectItem value="medical">Medical Records</SelectItem>
                          <SelectItem value="finance">Financial Documents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleVaultUpload} disabled={!vaultTitle || isVaultSubmitting} className="bg-rose-500 rounded-xl">
                      {isVaultSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Encrypt & Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!isParent && (
            <Card className="rounded-[2rem] border-none bg-amber-50 p-4 flex items-center gap-3">
              <AlertTriangle className="h-12 w-12 text-amber-500 shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-amber-800">Limited Access</h3>
                <p className="text-amber-700 font-medium">
                  The Emergency Vault is managed by parents. Contact George if you need a specific document.
                </p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaultLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)
            ) : docs?.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
                <Lock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Vault is currently empty.</p>
              </div>
            ) : (
              docs?.map((doc) => (
                <Card key={doc.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground mb-1 border-muted/30">
                        {doc.type}
                      </Badge>
                      <h4 className="font-bold text-sm truncate">{doc.title}</h4>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Download className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
          
          <Card className="rounded-[2.5rem] border-none bg-rose-500 p-4 text-white mt-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="space-y-4 flex-1">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-white" />
                  Zero-Knowledge Privacy
                </h3>
                <p className="text-white/90 font-medium leading-relaxed">
                  All documents in the Kapendeka Vault are encrypted. Only authorized family roles can decrypt and view these files. 
                  Your data stays in the Universe.
                </p>
                <div className="flex gap-3">
                  <Badge className="bg-white/20 text-white border-none">AES-256</Badge>
                  <Badge className="bg-white/20 text-white border-none">Role Based</Badge>
                </div>
              </div>
              <div className="relative">
                <div className="h-32 w-32 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-pulse">
                  <Lock className="h-12 w-12 text-white/50" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
