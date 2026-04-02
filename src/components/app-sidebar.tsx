
"use client"

import * as React from "react"
import {
  Home,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Utensils,
  ShoppingCart,
  HeartPulse,
  Church,
  PartyPopper,
  MessageSquare,
  Wallet,
  Dog,
  Plane,
  ShieldAlert,
  Gamepad2,
  BookOpen,
  Settings,
  StickyNote,
  Moon,
  MapPin,
  Trophy,
  History,
  Gift,
  Languages,
  Newspaper,
  Gamepad
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const portals = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Universe Arcade", href: "/arcade", icon: Gamepad },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Chores & Tasks", href: "/household", icon: CheckSquare },
  { name: "Meals & Recipes", href: "/meals", icon: Utensils },
  { name: "Shopping Lists", href: "/shopping", icon: ShoppingCart },
  { name: "Finances", href: "/finances", icon: Wallet },
  { name: "Social & Journal", href: "/social", icon: History },
  { name: "Family Chat", href: "/chat", icon: MessageSquare },
  { name: "Health & Wellness", href: "/health", icon: HeartPulse },
  { name: "Rest & Sleep", href: "/sleep", icon: Moon },
  { name: "Church & Faith", href: "/faith", icon: Church },
  { name: "School & Homework", href: "/school", icon: BookOpen },
  { name: "Wishlist", href: "/wishlist", icon: Gift },
  { name: "Learn Language", href: "/languages", icon: Languages },
  { name: "News Feed", href: "/news", icon: Newspaper },
  { name: "Celebrations", href: "/celebrations", icon: PartyPopper },
  { name: "Pets", href: "/pets", icon: Dog },
  { name: "Travel", href: "/travel", icon: Plane },
  { name: "Emergency Vault", href: "/vault", icon: ShieldAlert },
  { name: "Rewards & Levels", href: "/games", icon: Trophy },
  { name: "Hobbies", href: "/hobbies", icon: Gamepad2 },
  { name: "Notes & Memos", href: "/notes", icon: StickyNote },
  { name: "Location Sharing", href: "/location", icon: MapPin },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Home className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-headline font-bold text-lg leading-tight tracking-tight">Kapendeka</span>
            <span className="text-xs text-muted-foreground font-medium">Universe Hub</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Portals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {portals.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-11 hover:bg-sidebar-accent/50 transition-all duration-200"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium group-data-[collapsible=icon]:hidden text-sm">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="opacity-50" />
      <SidebarFooter>
        <SidebarMenu className="px-2 pb-4">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="h-11">
              <Link href="/settings" className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span className="font-medium group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
