"use client"

import * as React from "react"
import { useSupabase, useUser } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import { parseISO } from "date-fns"
import confetti from "canvas-confetti"

export function RealtimeBroadcast() {
  const supabase = useSupabase()
  const { profile, loading } = useUser()
  const { toast } = useToast()

  React.useEffect(() => {
    if (!supabase || loading) return

    // 1. Listen for Realtime Broadcasts
    const channel = supabase
      .channel('public:broadcasts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
        const newBroadcast = payload.new
        
        // Show the banner
        toast({
          title: newBroadcast.is_birthday ? `🎉 Happy Birthday!` : `📢 Family Broadcast`,
          description: newBroadcast.message,
          duration: 10000,
          className: newBroadcast.is_birthday ? 'bg-primary text-white border-none shadow-2xl font-bold text-lg p-6' : 'bg-white border-2 border-primary/20 shadow-xl',
        })

        if (newBroadcast.is_birthday) {
           confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } })
        }
      })
      .subscribe()

    // 2. Birthday Checker Logic (Only runs once per session when profile loads)
    const checkBirthday = async () => {
      if (!profile || !profile.birthday) return
      
      const today = new Date()
      // Check if month and day match
      try {
        // Handle YYYY-MM-DD
        const birthDate = parseISO(profile.birthday)
        if (birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate()) {
          // It's their birthday! Check if we already broadcasted today
          const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
          const { data, error } = await supabase
            .from('broadcasts')
            .select('id')
            .eq('is_birthday', true)
            .gte('created_at', startOfDay)
            .like('message', `%${profile.display_name}%`)
            .limit(1)

          if (!error && (!data || data.length === 0)) {
            // We haven't broadcasted it today! Let's insert a broadcast.
            await supabase.from('broadcasts').insert([{
              family_id: profile.family_id,
              message: `It's ${profile.display_name}'s birthday today! Wish them a happy birthday! 🎂🎈`,
              sender_name: "Universe Hub",
              is_birthday: true
            }])
          }
        }
      } catch (e) {
        console.error("Error parsing birthday", e)
      }
    }

    checkBirthday()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, profile, loading, toast])

  // This component doesn't render anything itself, it just manages side-effects and toasts
  return null
}
