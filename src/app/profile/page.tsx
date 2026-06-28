
"use client"

import * as React from "react"
import { 
  User, 
  Mail, 
  Shield, 
  Award, 
  Zap, 
  Camera, 
  Save, 
  Loader2,
  Users,
  Copy,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useSupabase, useCollection } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { profile, user } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()
  
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Fetch all family members
  const membersQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("users").select("*").eq("familyId", profile.familyId)
  }, [supabase, profile?.familyId])
  const { data: members } = useCollection(membersQuery)

  React.useEffect(() => {
    if (profile) {
      setName(profile.displayName || "")
      setRole(profile.role || "child")
    }
  }, [profile])

  const handleUpdate = async () => {
    if (!supabase || !profile?.id) return
    setSaving(true)
    try {
      await supabase.from("users").update({
        displayName: name,
        role: role
      }).eq("id", profile.id)
      toast({ title: "Profile Updated", description: "Your universe identity has been saved." })
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" })
    } finally {
      setSaving(false)
    }
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(profile?.familyId || "UNIVERSE-HUB-2026")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Code Copied", description: "Share this with your family members." })
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-5xl mx-auto pb-20">
      <header>
        <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">My Identity</h1>
        <p className="text-muted-foreground font-medium">Manage your presence in the Kapendeka Universe</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 pb-8 relative">
              <div className="absolute -bottom-6 left-8">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                    <AvatarImage src={`https://picsum.photos/seed/${profile?.id}/200/200`} />
                    <AvatarFallback className="bg-primary text-white text-2xl font-bold">{profile?.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <button className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-12 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    value={user?.email || ""} 
                    disabled 
                    className="rounded-xl h-12 bg-muted/50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Universe Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="teen">Teenager</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full md:w-auto px-4 rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Universe Members
              </h2>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{members?.length || 0} Members</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members?.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/10 transition-all">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={`https://picsum.photos/seed/${m.id}/100/100`} />
                    <AvatarFallback>{m.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{m.displayName}</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{m.role}</div>
                  </div>
                  {m.role === 'parent' && <Shield className="h-4 w-4 text-accent" />}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-primary text-white p-4">
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
              <Award className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Universe Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm font-medium opacity-70">Total Points</span>
                <span className="text-xl font-black">{profile?.points || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm font-medium opacity-70">Day Streak</span>
                <span className="text-xl font-black flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  {profile?.streakDays || 0}
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm bg-accent/5 p-4">
            <h3 className="text-lg font-bold mb-4">Invite Family</h3>
            <p className="text-sm text-muted-foreground font-medium mb-3">Use this code to bring new members into the Kapendeka universe.</p>
            <div className="relative">
              <Input 
                value={profile?.familyId || ""} 
                readOnly 
                className="h-12 pr-12 font-mono bg-white border-accent/20 rounded-xl"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={copyInvite}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg hover:bg-accent/10"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-accent" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
