
"use client"

import * as React from "react"
import { Globe, Bell, Shield, MapPin, Loader2, Save, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useSupabase, useDoc } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)

  // Fetch Family Settings
  const familyRef = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("families").select("*").eq("id", profile.familyId)
  }, [supabase, profile?.familyId])
  
  const { data: family, loading } = useDoc(familyRef)

  // Form State
  const [timezone, setTimezone] = React.useState("")
  const [currency, setCurrency] = React.useState("")
  const [holidays, setHolidays] = React.useState(true)
  const [motto, setMotto] = React.useState("")

  React.useEffect(() => {
    if (family) {
      setTimezone(family.settings?.timezone || "johannesburg")
      setCurrency(family.settings?.currency || "zar")
      setHolidays(family.settings?.publicHolidaysEnabled ?? true)
      setMotto(family.settings?.familyMotto || "One Family, One Universe")
    }
  }, [family])

  const handleSave = async () => {
    if (!supabase || !profile?.familyId) return
    setSaving(true)

    try {
      await supabase.from("families").update({
        settings: {
          timezone,
          currency,
          publicHolidaysEnabled: holidays,
          familyMotto: motto
        },
        updatedAt: new Date().toISOString()
      }).eq("id", profile.familyId)
      toast({ title: "Settings Saved", description: "Universe configurations updated." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save settings." })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-4xl mx-auto pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Family Settings</h1>
          <p className="text-muted-foreground font-medium">Manage the Kapendeka Universe configurations</p>
        </div>
        {profile?.role === 'parent' && (
          <Button onClick={handleSave} disabled={saving} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        )}
      </header>

      <div className="space-y-4">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary to-indigo-800 text-white p-1">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-bold">Universe Identity</h2>
            </div>
            <div className="space-y-2">
              <Label className="text-primary-foreground/80">Family Motto</Label>
              <Input 
                value={motto} 
                onChange={(e) => setMotto(e.target.value)}
                placeholder="e.g. Strength in Unity"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl text-lg font-bold"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Regional Settings
            </CardTitle>
            <CardDescription>Localized defaults for the Kapendeka Family Hub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="johannesburg">Africa/Johannesburg (GMT+2)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zar">South African Rand (ZAR)</SelectItem>
                    <SelectItem value="usd">US Dollar (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="space-y-0.5">
                <div className="text-sm font-bold">Public Holidays</div>
                <div className="text-xs text-muted-foreground">South African school terms and holidays integration</div>
              </div>
              <Switch checked={holidays} onCheckedChange={setHolidays} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Notifications
            </CardTitle>
            <CardDescription>Control your personal presence in the hub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold">Live Location Presence</div>
                  <div className="text-xs text-muted-foreground font-medium">Visible to family members when active</div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold">Smart Alerts</div>
                  <div className="text-xs text-muted-foreground font-medium">Daily summaries and emergency vault alerts</div>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
