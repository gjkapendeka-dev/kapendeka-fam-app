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
  Image as ImageIcon,
  Palette,
  Plus,
  HeartPulse,
  MapPin,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  
  // General State
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // PIN state
  const [currentPin, setCurrentPin] = React.useState("")
  const [newPin, setNewPin] = React.useState("")

  // Theme Color State
  const [themeColor, setThemeColor] = React.useState("#4f46e5")
  
  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = React.useState("")

  // Medical ID State
  const [bloodType, setBloodType] = React.useState("")
  const [allergies, setAllergies] = React.useState("")
  const [medicalNotes, setMedicalNotes] = React.useState("")
  const [emergencyContacts, setEmergencyContacts] = React.useState("")
  const [pastLocations, setPastLocations] = React.useState("")

  // Modal for Parent viewing a child's profile
  const [selectedMember, setSelectedMember] = React.useState<any>(null)
  const [isMemberModalOpen, setIsMemberModalOpen] = React.useState(false)

  // Fetch all family members
  const membersQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("profiles").select("*").eq("family_id", profile.family_id).order('created_at', { ascending: true })
  }, [supabase, profile?.family_id])
  const { data: members, mutate: mutateMembers } = useCollection(membersQuery)

  React.useEffect(() => {
    if (profile) {
      setName(profile.display_name || "")
      setRole(profile.role || "child")
      setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${profile.id}`)
      setThemeColor(profile.theme_color || "#4f46e5")
      setBloodType(profile.blood_type || "")
      setAllergies(profile.allergies || "")
      setMedicalNotes(profile.medical_notes || "")
      
      // Handle JSON parsing safely
      let ec = profile.emergency_contacts || []
      let pl = profile.past_locations || []
      if (typeof ec === 'string') try { ec = JSON.parse(ec) } catch(e) { ec = [] }
      if (typeof pl === 'string') try { pl = JSON.parse(pl) } catch(e) { pl = [] }
      
      setEmergencyContacts(Array.isArray(ec) ? ec.join("\n") : String(ec))
      setPastLocations(Array.isArray(pl) ? pl.join("\n") : String(pl))
    }
  }, [profile])

  const isParent = profile?.role === 'parent' || profile?.role === 'admin'

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
      // General updates
      const updates: any = {
        display_name: name,
        role: role,
        avatar_url: avatarUrl,
        theme_color: themeColor
      }
      if (newPin) updates.pin = newPin

      // Medical & Map updates
      const ecArray = emergencyContacts.split("\n").filter(c => c.trim() !== "")
      const plArray = pastLocations.split("\n").filter(l => l.trim() !== "")

      if (isParent) {
        // Parents save directly
        updates.blood_type = bloodType
        updates.allergies = allergies
        updates.medical_notes = medicalNotes
        updates.emergency_contacts = ecArray
        updates.past_locations = plArray
      } else {
        // Kids save to pending edits
        updates.pending_medical_edits = {
          blood_type: bloodType,
          allergies: allergies,
          medical_notes: medicalNotes,
          emergency_contacts: ecArray,
          past_locations: plArray
        }
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)
      if (error) throw error

      if (!isParent) {
        toast({ title: "Edits Submitted", description: "Your medical/map updates have been sent to parents for approval." })
      } else {
        toast({ title: "Profile Updated", description: "Your universe identity has been saved." })
      }
      
      setCurrentPin("")
      setNewPin("")
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleApproveEdits = async () => {
    if (!supabase || !selectedMember?.pending_medical_edits) return
    setSaving(true)
    try {
      const updates = {
        ...selectedMember.pending_medical_edits,
        pending_medical_edits: null
      }
      const { error } = await supabase.from("profiles").update(updates).eq("id", selectedMember.id)
      if (error) throw error
      toast({ title: "Edits Approved", description: `Updated medical records for ${selectedMember.display_name}.` })
      setIsMemberModalOpen(false)
      if (mutateMembers) mutateMembers()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Approval Failed", description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleRejectEdits = async () => {
    if (!supabase || !selectedMember) return
    setSaving(true)
    try {
      const { error } = await supabase.from("profiles").update({ pending_medical_edits: null }).eq("id", selectedMember.id)
      if (error) throw error
      toast({ title: "Edits Rejected", description: `Rejected updates for ${selectedMember.display_name}.` })
      setIsMemberModalOpen(false)
      if (mutateMembers) mutateMembers()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Rejection Failed", description: e.message })
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
        <p className="text-muted-foreground font-medium">Manage your presence in the Kapendeka World</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-xl p-1 mb-4 h-12">
              <TabsTrigger value="general" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                General
              </TabsTrigger>
              <TabsTrigger value="medical" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-rose-500 data-[state=active]:shadow-sm">
                Medical ID
              </TabsTrigger>
              <TabsTrigger value="map" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-500 data-[state=active]:shadow-sm">
                Family Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-0">
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

                  <div className="pt-4 border-t border-border">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Universe Theme Color
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      {["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#f43f5e"].map(color => (
                        <button
                          key={color}
                          onClick={() => setThemeColor(color)}
                          className={`w-10 h-10 rounded-full shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${themeColor === color ? 'ring-4 ring-offset-2 ring-primary scale-110' : ''}`}
                          style={{ backgroundColor: color }}
                        >
                          {themeColor === color && <CheckCircle2 className="h-5 w-5 text-white shadow-sm rounded-full bg-black/20" />}
                        </button>
                      ))}
                      <div className="relative">
                        <input 
                          type="color" 
                          value={themeColor} 
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="absolute opacity-0 inset-0 cursor-pointer w-full h-full z-10"
                        />
                        <button
                          className="w-10 h-10 rounded-full shadow-sm border-2 border-dashed border-muted-foreground flex items-center justify-center hover:bg-muted"
                          style={{ backgroundColor: themeColor }}
                        >
                          <Plus className="h-4 w-4 mix-blend-difference text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleUpdate} disabled={saving} className="w-full md:w-auto px-6 rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical" className="mt-0">
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-rose-50/50">
                <CardHeader className="bg-rose-100/50 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white">
                      <HeartPulse className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-rose-900">Medical ID</CardTitle>
                      <CardDescription className="text-rose-700">Health info and emergency contacts.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  {!isParent && profile?.pending_medical_edits && (
                    <div className="p-4 bg-amber-100 text-amber-900 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">Approval Pending</h4>
                        <p className="text-sm">Your recent changes to your Medical ID are awaiting parent approval.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Blood Type</Label>
                      <Select value={bloodType} onValueChange={setBloodType}>
                        <SelectTrigger className="rounded-xl h-12 bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <Textarea 
                      value={allergies} 
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Peanuts, Penicillin (leave blank if none)"
                      className="rounded-xl bg-white min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical Notes & Conditions</Label>
                    <Textarea 
                      value={medicalNotes} 
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      placeholder="e.g. Asthma, carries an inhaler"
                      className="rounded-xl bg-white min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Emergency Contacts (One per line)</Label>
                    <Textarea 
                      value={emergencyContacts} 
                      onChange={(e) => setEmergencyContacts(e.target.value)}
                      placeholder="Grandma: +1 234 567 8900&#10;Uncle Jim: +1 987 654 3210"
                      className="rounded-xl bg-white min-h-[100px]"
                    />
                  </div>

                  <Button onClick={handleUpdate} disabled={saving} className="w-full md:w-auto px-6 rounded-xl h-12 font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 text-white">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isParent ? 'Save Medical ID' : 'Submit for Approval'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-emerald-50/50">
                <CardHeader className="bg-emerald-100/50 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-emerald-900">Family Map</CardTitle>
                      <CardDescription className="text-emerald-700">Track locations and history.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  {!isParent && profile?.pending_medical_edits && (
                    <div className="p-4 bg-amber-100 text-amber-900 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">Approval Pending</h4>
                        <p className="text-sm">Your recent changes are awaiting parent approval.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Past Locations & Addresses (One per line)</Label>
                    <Textarea 
                      value={pastLocations} 
                      onChange={(e) => setPastLocations(e.target.value)}
                      placeholder="123 Main St, Springfield (2015-2018)&#10;456 Elm St, Metropolis (2018-Present)"
                      className="rounded-xl bg-white min-h-[150px]"
                    />
                  </div>

                  <Button onClick={handleUpdate} disabled={saving} className="w-full md:w-auto px-6 rounded-xl h-12 font-bold bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isParent ? 'Save Family Map' : 'Submit for Approval'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Family Members
              </h2>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{members?.length || 0} Members</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {members?.map((m) => {
                const hasPending = m.pending_medical_edits && isParent;
                return (
                  <div 
                    key={m.id} 
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isParent ? 'cursor-pointer hover:border-primary/30' : ''} ${hasPending ? 'bg-amber-50 border-amber-200' : 'bg-muted/30 border-transparent'}`}
                    onClick={() => {
                      if (isParent) {
                        setSelectedMember(m)
                        setIsMemberModalOpen(true)
                      }
                    }}
                  >
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm bg-white shrink-0">
                      <AvatarImage src={m.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${m.id}`} className="object-cover" />
                      <AvatarFallback>{m.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{m.display_name}</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{m.role}</div>
                    </div>
                    {hasPending && <Badge className="bg-amber-500 text-[9px]">Review</Badge>}
                    {m.role === 'parent' && !hasPending && <Shield className="h-4 w-4 text-accent shrink-0" />}
                  </div>
                )
              })}
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

      {/* Member Review Modal for Parents */}
      {selectedMember && (
        <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm bg-white shrink-0">
                  <AvatarImage src={selectedMember.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${selectedMember.id}`} className="object-cover" />
                  <AvatarFallback>{selectedMember.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {selectedMember.display_name}'s Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedMember.pending_medical_edits ? (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Pending Medical/Map Updates
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-bold text-amber-800">Blood Type: </span>
                      <span>{selectedMember.pending_medical_edits.blood_type || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-800">Allergies: </span>
                      <span>{selectedMember.pending_medical_edits.allergies || "None"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-800">Medical Notes: </span>
                      <span>{selectedMember.pending_medical_edits.medical_notes || "None"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-800">Emergency Contacts: </span>
                      <pre className="font-sans whitespace-pre-wrap">{selectedMember.pending_medical_edits.emergency_contacts?.join('\n') || "None"}</pre>
                    </div>
                    <div>
                      <span className="font-bold text-amber-800">Past Locations: </span>
                      <pre className="font-sans whitespace-pre-wrap">{selectedMember.pending_medical_edits.past_locations?.join('\n') || "None"}</pre>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button onClick={handleRejectEdits} disabled={saving} variant="outline" className="flex-1 rounded-xl border-amber-200 text-amber-800 hover:bg-amber-100">
                      Reject
                    </Button>
                    <Button onClick={handleApproveEdits} disabled={saving} className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve Edits"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No pending updates for this member.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
