"use client"

import * as React from "react"
import { useUser, useSupabase } from "@/supabase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogOut, Loader2, Lock } from "lucide-react"

export default function SelectProfilePage() {
  const { user, selectProfile, loading: authLoading } = useUser()
  const supabase = useSupabase()
  const router = useRouter()
  
  const [profiles, setProfiles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedForPin, setSelectedForPin] = React.useState<any | null>(null)
  const [pin, setPin] = React.useState("")
  const [pinError, setPinError] = React.useState(false)

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login")
      return
    }

    const fetchProfiles = async () => {
      if (!supabase) return;
      
      // First, find the family ID linked to this user's email or owner_id
      // For Kapendeka, we just get all profiles that belong to the logged in family account
      // Since all families are owned by this user, we can just grab the first family
      const { data: familyData } = await supabase.from('families').select('id').eq('owner_id', user.id).single();
      
      let familyId = familyData?.id;
      
      // Fallback: if owner_id logic is different, we can just fetch profiles directly 
      // since RLS will only show profiles for families this user has access to.
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (familyId) {
        query = query.eq('family_id', familyId);
      }
      
      const { data } = await query;
      
      if (data) {
        // Sort specifically to put Other at the end
        const sorted = [...data].sort((a, b) => {
          if (a.display_name === 'Other') return 1;
          if (b.display_name === 'Other') return -1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setProfiles(sorted);
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
    
    // Check against the PIN in the database
    if (pin === selectedForPin.pin) {
      selectProfile(selectedForPin.id)
      router.push("/")
    } else {
      setPinError(true)
      setPin("")
    }
  }

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut()
    router.push("/login")
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
      
      {!selectedForPin ? (
        <div className="w-full max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tight">Who's watching?</h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">Select your profile to enter the Universe</p>
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
          </div>

          <div className="flex justify-center pt-8">
            <Button variant="ghost" className="text-muted-foreground font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl hover:bg-rose-50 hover:text-rose-500" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out of family account
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="rounded-[2rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="text-center pt-8">
              <div className="mx-auto h-24 w-24 rounded-[1.5rem] overflow-hidden shadow-xl mb-4 bg-white">
                <img src={selectedForPin.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${selectedForPin.id}`} alt="Avatar" className="w-full h-full object-cover" />
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
                    className={`h-14 pl-12 text-center text-2xl tracking-[1em] font-black rounded-2xl ${pinError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                {pinError && <p className="text-destructive text-sm font-bold text-center animate-shake">Incorrect PIN. Try again.</p>}
                
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setSelectedForPin(null)}>
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
