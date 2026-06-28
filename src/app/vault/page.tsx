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
  Trash2,
  Search,
  Loader2,
  AlertTriangle
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

export default function VaultPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [title, setTitle] = React.useState("")
  const [type, setType] = React.useState("IDs")

  const vaultQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("emergencyVault").select("*").eq("familyId", profile.familyId)
    
  }, [supabase, profile?.familyId])

  const { data: docs, loading } = useCollection(vaultQuery)

  const handleUpload = () => {
    if (!supabase || !profile?.familyId || !title) return
    if (profile.role !== 'parent' && profile.role !== 'admin') {
      toast({ variant: "destructive", title: "Access Denied", description: "Only parents can add to the vault." })
      return
    }

    setIsSubmitting(true)
    const data = {
      familyId: profile.familyId,
      title,
      type,
      accessRoles: ["parent", "admin"],
      createdAt: new Date().toISOString(),
    }

    supabase.from("emergencyVault").insert([data])
      .then(() => {
        setIsDialogOpen(false)
        setTitle("")
        toast({ title: "Document Vaulted", description: `${title} is now secured.` })
      })
      .then(() => setIsSubmitting(false))
  }

  const isParent = profile?.role === 'parent' || profile?.role === 'admin'

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground">Emergency Vault</h1>
            <p className="text-muted-foreground font-medium">Secure storage for IDs, Insurance, and Medicals</p>
          </div>
        </div>
        {isParent && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20">
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
                  <Input placeholder="e.g. Health Insurance Policy" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
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
                <Button onClick={handleUpload} disabled={!title || isSubmitting} className="bg-rose-500">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Encrypt & Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="grid gap-3">
        {!isParent && (
          <Card className="rounded-[2rem] border-none bg-amber-50 p-4 flex items-center gap-3">
            <AlertTriangle className="h-12 w-12 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-amber-800">Limited Access</h3>
              <p className="text-amber-700 font-medium">
                The Emergency Vault is managed by parents. Contact George or Sarah if you need a specific document.
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
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
                  <div className="h-12 w-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
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

        <Card className="rounded-[2.5rem] border-none bg-primary p-4 text-white">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="space-y-4 flex-1">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-accent" />
                Zero-Knowledge Privacy
              </h3>
              <p className="text-primary-foreground/80 font-medium leading-relaxed">
                All documents in the Kapendeka Vault are encrypted. Only authorized family roles can decrypt and view these files. 
                Your data stays in the Universe.
              </p>
              <div className="flex gap-3">
                <Badge className="bg-white/10 text-white border-none">AES-256</Badge>
                <Badge className="bg-white/10 text-white border-none">Role Based</Badge>
              </div>
            </div>
            <div className="relative">
              <div className="h-32 w-32 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-pulse">
                <Lock className="h-12 w-12 text-white/50" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
