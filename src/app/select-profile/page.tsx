"use client"

import * as React from "react"
import Image from "next/image"
import { useUser, useSupabase } from "@/supabase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, Loader2, Lock, Plus, X, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const EMOJI_SEEDS = [
  "happy", "cool", "sleepy", "silly", "wink", "smile", "star", "heart",
  "sun", "moon", "cat", "dog", "bear", "fox", "panda", "koala",
]

export default function SelectProfilePage() {
  const { user, selectProfile, loading: authLoading } = useUser()
  const supabase = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  const [profiles, setProfiles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [familyId, setFamilyId] = React.useState<string | null>(null)
  const [isParent, setIsParent] = React.useState(false)

  // PIN state
  const [selectedForPin, setSelectedForPin] = React.useState<any | null>(null)
  const [pin, setPin] = React.useState("")
  const [pinError, setPinError] = React.useState(false)

  // Add profile state
  const [showAddProfile, setShowAddProfile] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newPin, setNewPin] = React.useState("")
  const [newRole, setNewRole] = React.useState<"child" | "parent">("child")
  const [selectedSeed, setSelectedSeed] = React.useState(EMOJI_SEEDS[0])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    const fetchProfiles = async () => {
      if (!supabase) return

      const { data: familyData } = await supabase
        .from("families")
        .select("id")
        .eq("owner_id", user.id)
        .single()

      const fid = familyData?.id
      setFamilyId(fid || null)

      // Check if the logged in user is a parent (owner of the family)
      setIsParent(!!fid)

      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true })

      if (fid) query = query.eq("family_id", fid)

      const { data } = await query

      if (data) {
        // George Jr. (formerly "Other") always last
        const sorted = [...data].sort((a, b) => {
          if (a.display_name === "George Jr.") return 1
          if (b.display_name === "George Jr.") return -1
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        setProfiles(sorted)
      }
      setLoading(false)
    }

    fetchProfiles()
  }, [user, authLoading, supabase, router])

  const handleProfileClick = (profile: any) => {
    setSelectedForPin(profile)
    setPin("")
    setPinError(false)
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedForPin) return

    if (pin === selectedForPin.pin) {
      selectProfile(selectedForPin.id)
      router.push("/")
    } else {
      setPinError(true)
      setPin("")
    }
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPin || newPin.length !== 4 || !familyId || !supabase) return
    setSaving(true)
    try {
      const avatarUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${selectedSeed}`
      const { error } = await supabase.from("profiles").insert({
        family_id: familyId,
        display_name: newName.trim(),
        pin: newPin,
        role: newRole,
        avatar_url: avatarUrl,
      })
      if (error) throw error

      toast({ title: "Profile added!", description: `${newName.trim()} can now log in.` })

      // Refresh profiles
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: true })

      if (data) {
        const sorted = [...data].sort((a, b) => {
          if (a.display_name === "George Jr.") return 1
          if (b.display_name === "George Jr.") return -1
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        setProfiles(sorted)
      }

      // Reset form
      setNewName("")
      setNewPin("")
      setNewRole("child")
      setSelectedSeed(EMOJI_SEEDS[0])
      setShowAddProfile(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">

      {showAddProfile ? (
        /* ── Add Profile Form ── */
        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="rounded-[2rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="text-center pt-8 relative">
              <button
                onClick={() => setShowAddProfile(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
              <CardTitle className="text-2xl font-headline font-bold">Add Profile</CardTitle>
              <CardDescription>Create a new family member profile</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddProfile} className="space-y-5">
                {/* Avatar preview + seed picker */}
                <div className="flex flex-col items-center gap-3">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg border-4 border-primary/20">
                    <img
                      src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${selectedSeed}`}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Choose an avatar style</p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                    {EMOJI_SEEDS.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setSelectedSeed(seed)}
                        className={`h-9 w-9 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedSeed === seed
                            ? "border-primary scale-110 shadow-md"
                            : "border-transparent hover:border-primary/40"
                        }`}
                      >
                        <img
                          src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}`}
                          alt={seed}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-name" className="font-semibold text-sm">Name</Label>
                  <Input
                    id="new-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Grace"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">Role</Label>
                  <div className="flex gap-2">
                    {(["child", "parent"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewRole(r)}
                        className={`flex-1 h-10 rounded-xl text-sm font-bold border-2 transition-all capitalize ${
                          newRole === r
                            ? "bg-primary text-white border-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PIN */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-pin" className="font-semibold text-sm">4-Digit PIN</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-pin"
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="h-12 pl-10 text-center tracking-[0.5em] font-black rounded-xl"
                      required
                    />
                  </div>
                  {newPin.length > 0 && newPin.length < 4 && (
                    <p className="text-xs text-amber-600 font-medium">{4 - newPin.length} more digit{newPin.length < 3 ? "s" : ""} needed</p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold"
                    onClick={() => setShowAddProfile(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                    disabled={saving || newPin.length !== 4 || !newName.trim()}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : !selectedForPin ? (
        /* ── Profile Picker ── */
        <div className="w-full max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-black shadow-xl md:h-24 md:w-24">
              <Image
                src="/kapendeka-logo.png"
                alt="Kapendeka Family"
                width={96}
                height={96}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tight">Who's playing?</h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium">Select your profile to enter the Universe</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {profiles.map((p) => (
              <div
                key={p.id}
                onClick={() => handleProfileClick(p)}
                className="flex flex-col items-center gap-3 cursor-pointer group"
              >
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl md:rounded-[2rem] border-4 border-transparent group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300 shadow-xl overflow-hidden bg-muted flex items-center justify-center">
                  <Avatar className="h-full w-full rounded-2xl bg-white">
                    <AvatarImage src={p.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${p.id}`} className="object-cover" />
                    <AvatarFallback className="rounded-2xl text-2xl font-bold bg-primary text-white">
                      {p.display_name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="font-bold text-lg md:text-xl text-muted-foreground group-hover:text-foreground transition-colors">
                  {p.display_name}
                </span>
              </div>
            ))}

            {/* + Add Profile button — only shown to parents (family owner) */}
            {isParent && (
              <div
                onClick={() => setShowAddProfile(true)}
                className="flex flex-col items-center gap-3 cursor-pointer group"
              >
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl md:rounded-[2rem] border-4 border-dashed border-primary/30 group-hover:border-primary group-hover:scale-105 transition-all duration-300 shadow-sm bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center">
                  <Plus className="h-10 w-10 md:h-12 md:w-12 text-primary/40 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-bold text-lg md:text-xl text-primary/40 group-hover:text-primary transition-colors">
                  Add Profile
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-8">
            <Button
              variant="ghost"
              className="text-muted-foreground font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl hover:bg-rose-50 hover:text-rose-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out of family account
            </Button>
          </div>
        </div>
      ) : (
        /* ── PIN Entry ── */
        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="rounded-[2rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="text-center pt-8">
              <div className="mx-auto h-24 w-24 rounded-[1.5rem] overflow-hidden shadow-xl mb-4 bg-white">
                <img
                  src={selectedForPin.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${selectedForPin.id}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Hi, {selectedForPin.display_name}</CardTitle>
              <CardDescription>Enter your 4-digit profile PIN</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value)
                      setPinError(false)
                    }}
                    className={`h-14 pl-12 text-center text-2xl tracking-[1em] font-black rounded-2xl ${pinError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                {pinError && (
                  <p className="text-destructive text-sm font-bold text-center animate-shake">
                    Incorrect PIN. Try again.
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold"
                    onClick={() => setSelectedForPin(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                    Enter
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
