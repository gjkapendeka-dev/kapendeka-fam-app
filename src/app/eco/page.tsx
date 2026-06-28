
"use client"

import * as React from "react"
import { Leaf, Plus, Droplets, Zap, Recycle, TrendingUp, Award, Wind, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function EcoUniversePage() {
  const { profile } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const ecoQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(collection(db, "ecoLogs"), where("familyId", "==", profile.familyId), orderBy("date", "desc"), limit(10))
  }, [db, profile?.familyId])

  const { data: logs, loading } = useCollection(ecoQuery)

  const handleLog = (type: string, val: number) => {
    if (!db || !profile) return
    const data = {
      familyId: profile.familyId,
      userId: profile.id,
      userName: profile.displayName,
      type,
      value: val,
      date: serverTimestamp()
    }
    addDoc(collection(db, "ecoLogs"), data).then(() => {
      toast({ title: "Eco Impact Recorded!", description: "The Universe thanks you." })
    })
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 pr-14">
      <header className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl">
           <Leaf className="h-6 w-6" />
        </div>
        <div>
           <h1 className="text-3xl font-black uppercase italic text-primary">Eco-Universe</h1>
           <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Tracking Family Impact on the Planet</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Water Saved", type: "water", icon: Droplets, color: "bg-blue-50 text-blue-600", unit: "L" },
                { label: "Energy Saved", type: "energy", icon: Zap, color: "bg-amber-50 text-amber-600", unit: "kWh" },
                { label: "Recycled", type: "recycle", icon: Recycle, color: "bg-emerald-50 text-emerald-600", unit: "Items" },
              ].map(item => (
                <Card key={item.type} className="rounded-[2rem] border-none shadow-lg bg-white p-6 hover:-translate-y-1 transition-all cursor-pointer" onClick={() => handleLog(item.type, 1)}>
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                   </div>
                   <h4 className="font-black text-sm uppercase tracking-tight">{item.label}</h4>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Tap to Log +1</p>
                </Card>
              ))}
           </div>

           <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
              <CardHeader className="p-0 mb-6">
                 <CardTitle className="text-xl font-black uppercase">Impact History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                 {logs?.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Badge className="bg-primary/5 text-primary border-none uppercase text-[8px] font-black">{log.type}</Badge>
                          <span className="font-bold text-sm">{log.userName}</span>
                       </div>
                       <div className="font-black text-primary">+{log.value} Points</div>
                    </div>
                 ))}
              </CardContent>
           </Card>
        </div>

        <div className="space-y-8">
           <Card className="rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-emerald-700 to-green-900 text-white p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Wind className="h-32 w-32" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Universe Purity</h3>
              <div className="text-6xl font-black mb-6">A+</div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest opacity-80">
                    <span>Planetary Alignment</span>
                    <span>98%</span>
                 </div>
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '98%' }} />
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
