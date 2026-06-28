"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/select-profile'

  if (isAuthPage) {
    return <main className="flex-1 w-full min-h-screen">{children}</main>
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
