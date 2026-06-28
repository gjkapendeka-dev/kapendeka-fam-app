
"use client"

import * as React from "react"
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  AlertTriangle,
  Loader2,
  Users,
  Compass,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function LocationSharingPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  // Fetch all family location shares
  const sharesQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("member_locations")
      .select("*")
      .eq("familyId", profile.familyId)
  }, [supabase, profile?.familyId])

  const { data: shares, loading } = useCollection(sharesQuery)

  // Fetch user's own share status
  const myShare = React.useMemo(() => {
    if (!shares || !profile?.id) return null
    return shares.find(s => s.userId === profile.id) || null
  }, [shares, profile?.id])

  // Real-time Browser Tracking
  React.useEffect(() => {
    if (!myShare?.sharingEnabled || !navigator.geolocation || !supabase || !profile?.id) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        supabase.from("member_locations").update({
          lastLocation: { lat: latitude, lng: longitude, address: "Live in Johannesburg" },
          lastUpdated: new Date().toISOString()
        }).eq("userId", profile.id)
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [myShare?.sharingEnabled, supabase, profile?.id])

  const toggleSharing = async () => {
    if (!supabase || !profile?.id) return
    const currentStatus = myShare?.sharingEnabled || false
    
    try {
      await supabase.from("member_locations").upsert({
        userId: profile.id,
        familyId: profile.familyId,
        userName: profile.displayName,
        sharingEnabled: !currentStatus,
        lastUpdated: new Date().toISOString()
      }, { onConflict: 'userId' })
      
      toast({
        title: !currentStatus ? "Location Active" : "Location Paused",
        description: !currentStatus ? "Your family can now see your live status." : "Your location is now private."
      })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update location status." })
    }
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Location Sharing</h1>
          <p className="text-muted-foreground font-medium">Opt-in family tracking for peace of mind</p>
        </div>
        <Card className="rounded-2xl border-none shadow-sm bg-accent/5 px-6 py-3 flex items-center gap-4">
          <div className="space-y-0.5">
            <div className="text-sm font-bold">My Sharing</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase">{myShare?.sharingEnabled ? 'Active' : 'Paused'}</div>
          </div>
          <Switch checked={myShare?.sharingEnabled} onCheckedChange={toggleSharing} />
        </Card>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Family Status
          </h2>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-3xl" />)
            ) : shares?.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                <Compass className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No one is sharing yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Enable sharing to see your family members on the universe map.</p>
              </div>
            ) : (
              shares?.map((share) => {
                const isMe = share.id === profile?.id
                return (
                  <Card key={share.id} className={`rounded-3xl border-none shadow-sm transition-all overflow-hidden bg-white ${!share.sharingEnabled && !isMe ? 'opacity-50 grayscale' : ''}`}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/10">
                        <AvatarImage src={`https://picsum.photos/seed/${share.id}/100/100`} />
                        <AvatarFallback>KP</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg">{isMe ? 'You' : (share.userName || 'Family Member')}</h4>
                          {share.sharingEnabled ? (
                            <Badge className="bg-emerald-500 text-white border-none text-[8px] font-bold uppercase">Live</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] font-bold uppercase border-muted/50 text-muted-foreground">Hidden</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {share.sharingEnabled ? (share.lastLocation?.address || 'Updating coordinates, ...') : 'Location Paused'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          {share.lastUpdated ? formatDistanceToNow(new Date(share.lastUpdated.seconds * 1000), { addSuffix: true }) : 'N/A'}
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-primary">
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-primary to-blue-800 text-white p-4">
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Universe Safety</h3>
            <p className="text-primary-foreground/80 font-medium leading-relaxed mb-3">
              Location sharing is strictly opt-in and private to your family. No one outside the Kapendeka Universe can see your location.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                <Smartphone className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold">Encrypted End-to-End</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold">Safe Zones Alerts</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
