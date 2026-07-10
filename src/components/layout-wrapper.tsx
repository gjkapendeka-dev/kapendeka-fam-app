"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useUser } from "@/supabase"
import { Loader2 } from "lucide-react"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading, user, profile } = useUser()
  const isAuthPage = pathname === '/login' || pathname === '/select-profile'
  const isGamePage = pathname.startsWith('/games/host/') || pathname.startsWith('/games/play/') || pathname.startsWith('/games/join')

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Game pages and auth pages render bare (no sidebar, no auth guard for guests on play/join)
  if (isAuthPage || isGamePage) {
    return <main className="flex-1 w-full min-h-screen">{children}</main>
  }

  // True auth guard: block rendering protected content while redirects happen
  if (!user || !profile) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col relative w-full">
          <div className="md:hidden fixed top-3 right-3 z-[60]">
            <SidebarTrigger className="h-10 w-10 text-primary bg-white shadow-lg rounded-xl active:scale-90 transition-transform" />
          </div>
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
