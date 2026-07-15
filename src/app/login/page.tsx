
"use client"

import * as React from "react"
import Image from "next/image"
import { useAuth } from "@/supabase"
import { supabase } from "@/supabase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const auth = useAuth()
  const [email, setEmail] = React.useState("info@kapendeka.co.za")
  const [password, setPassword] = React.useState("")
  const [isRegistering, setIsRegistering] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) return
    setLoading(true)

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast({ title: "Account created!", description: "Welcome to the Kapendeka World. Please check your email to verify." })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      router.push("/select-profile")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Auth Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth) return
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
      // router.push("/") // OAuth usually redirects automatically
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign In Failed", description: error.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardHeader className="text-center pb-2 pt-6">
          <div className="mx-auto h-24 w-24 overflow-hidden rounded-3xl bg-black shadow-lg mb-4">
            <Image
              src="/kapendeka-logo.png"
              alt="Kapendeka Family"
              width={96}
              height={96}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <CardTitle className="text-3xl font-headline font-bold tracking-tight">
            Kapendeka Hub
          </CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Enter the Family Universe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Family Account</Label>
              <Input 
                id="email" 
                type="text" 
                value="*hidden*"
                className="rounded-xl h-12 text-muted-foreground bg-muted/50 cursor-not-allowed text-center tracking-widest"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-12"
                required 
              />
            </div>
            <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? "Please wait..." : "Access Universe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
