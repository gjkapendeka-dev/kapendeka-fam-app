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
  CheckCircle2,
  Lock,
  Image as ImageIcon
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const AVATAR_SEEDS = ["Felix", "Aneka", "Jasper", "Luna", "Oliver", "Cleo", "Milo", "Bella", "Leo", "Zoe"]

export default function ProfilePage() {
  const { profile, user } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()
  
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // PIN state
  const [currentPin, setCurrentPin] = React.useState("")
  const [newPin, setNewPin] = React.useState("")
  
  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = React.useState("")

  // Fetch all family members
  const membersQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("profiles").select("*").eq("family_id", profile.family_id).order('created_at', { ascending: true })
  }, [supabase, profile?.family_id])
  const { data: members } = useCollection(membersQuery)

  React.useEffect(() => {
    if (profile) {
      setName(profile.display_name || "")
      setRole(profile.role || "child")
      setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${profile.id}`)
    }
  }, [profile])

  const handleUpdate = async () => {
    if (!supabase || !profile?.id) return
    
    // Check PIN change
    if (newPin) {
      if (currentPin !== profile.pin) {
        toast({ variant: "destructive", title: "Incorrect PIN", description: "Current PIN does not match." })
        return
      }
      if (newPin.length !== 4) {
        toast({ variant: "destructive", title: "Invalid PIN", description: "New PIN must be exactly 4 digits." })
        return
      }
    }

    setSaving(true)
    try {
      const updates: any = {
        display_name: name,
        role: role,
        avatar_url: avatarUrl
      }
      
      if (newPin) {
        updates.pin = newPin
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)
      
      if (error) throw error

      toast({ title: "Profile Updated", description: "Your universe identity has been saved." })
      setCurrentPin("")
      setNewPin("")
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(profile?.family_id || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Code Copied", description: "Share this with your family members." })
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">My Identity</h1>
        <p className="text-muted-foreground font-medium">Manage your presence in the Kapendeka Universe</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 pb-8 relative">
              <div className="absolute -bottom-6 left-8">
                <div className="relative group cursor-pointer" onClick={() => {
                  setTempAvatarUrl(avatarUrl)
                  setIsAvatarModalOpen(true)
                }}>
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl bg-white">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                      {name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-12 p-4 md:p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address (Family Account)</Label>
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

              <div className="pt-4 border-t border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Update Profile PIN
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current PIN</Label>
                    <Input 
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="rounded-xl h-12 font-mono tracking-[0.5em]"
                      placeholder="••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New PIN (4 digits)</Label>
                    <Input 
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="rounded-xl h-12 font-mono tracking-[0.5em]"
                      placeholder="••••"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdate} disabled={saving} className="w-full md:w-auto px-6 rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Family Members
              </h2>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{members?.length || 0} Members</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members?.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-white">
                    <AvatarImage src={m.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${m.id}`} className="object-cover" />
                    <AvatarFallback>{m.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{m.display_name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{m.role}</div>
                  </div>
                  {m.role === 'parent' && <Shield className="h-4 w-4 text-accent" />}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-primary text-white p-6">
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Award className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Universe Stats</h3>
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-sm font-medium opacity-80">Total Points</span>
                <span className="text-2xl font-black">{profile?.points || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium opacity-80">Day Streak</span>
                <span className="text-2xl font-black flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  {profile?.streakDays || 0}
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-accent/5 p-6 border border-accent/10">
            <h3 className="text-lg font-bold mb-2">Family ID</h3>
            <p className="text-sm text-muted-foreground font-medium mb-4">Internal universe reference ID for the Kapendeka family.</p>
            <div className="relative">
              <Input 
                value={profile?.family_id || ""} 
                readOnly 
                className="h-12 pr-12 text-xs font-mono bg-white border-accent/20 rounded-xl"
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

      {/* Avatar Selection Modal */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline">Choose Avatar</DialogTitle>
            <DialogDescription>
              Pick a fun preset avatar or use a custom image URL.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="presets" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
              <TabsTrigger value="presets" className="rounded-lg">Presets</TabsTrigger>
              <TabsTrigger value="custom" className="rounded-lg">Custom URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
                {AVATAR_SEEDS.map((seed) => {
                  const url = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}`
                  return (
                    <button 
                      key={seed}
                      onClick={() => setTempAvatarUrl(url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 active:scale-95 ${tempAvatarUrl === url ? 'border-primary shadow-lg' : 'border-transparent bg-muted/30'}`}
                    >
                      <img src={url} alt={seed} className="w-full h-full object-cover p-2" />
                      {tempAvatarUrl === url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-primary bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com/my-photo.jpg" 
                    value={tempAvatarUrl.startsWith('https://api.dicebear.com') ? '' : tempAvatarUrl}
                    onChange={(e) => setTempAvatarUrl(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Paste a direct link to any image (JPG, PNG). Square images look best!
                </p>
              </div>
              <div className="flex justify-center py-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-muted">
                  <AvatarImage src={tempAvatarUrl} className="object-cover" />
                  <AvatarFallback><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                </Avatar>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 sm:justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAvatarModalOpen(false)} className="rounded-xl h-12">
              Cancel
            </Button>
            <Button type="button" onClick={() => {
              setAvatarUrl(tempAvatarUrl)
              setIsAvatarModalOpen(false)
            }} className="rounded-xl h-12 shadow-lg shadow-primary/20">
              Apply Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
