
"use client"

import * as React from "react"
import {
  Home, LayoutDashboard, Calendar, CheckSquare, Utensils, ShoppingCart, HeartPulse, Church, PartyPopper, MessageSquare, Wallet, Dog, Plane, ShieldAlert, Gamepad2, BookOpen, Settings, StickyNote, Moon, MapPin, Trophy, History, Gift, Languages, Newspaper, Gamepad, LogOut, User, Target, Sparkles, BarChart4, Library, Lightbulb, Compass, Leaf, Wind, HelpCircle, Fingerprint, Archive, Zap, Book, GraduationCap, Heart, Edit3, Activity, Coffee
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
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@/supabase"
import { supabase } from "@/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const portals = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Stuff", href: "/vault", icon: Archive },
  { name: "Games", href: "/arcade", icon: Zap },
  { name: "Stories", href: "/stories", icon: Book },
  { name: "Trivia", href: "/trivia", icon: HelpCircle },
  { name: "Rewards", href: "/games", icon: Trophy },
  { name: "Quests", href: "/quest", icon: Compass },
  { name: "Hobbies", href: "/hobbies", icon: Gamepad2 },
  { name: "Languages", href: "/languages", icon: Languages },
  { name: "Chores", href: "/household", icon: CheckSquare },
  { name: "Homework", href: "/school", icon: GraduationCap },
  { name: "Faith", href: "/faith", icon: Heart },
  { name: "Notes", href: "/notes", icon: Edit3 },
  { name: "Health", href: "/health", icon: Activity },
  { name: "Meals", href: "/meals", icon: Coffee },
  { name: "Wishlist", href: "/wishlist", icon: Gift },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Finances", href: "/finances", icon: Wallet },
  { name: "Notes & Memos", href: "/notes", icon: StickyNote },
  { name: "News Feed", href: "/news", icon: Newspaper },
  { name: "Travel", href: "/travel", icon: Plane },
  { name: "Location Sharing", href: "/location", icon: MapPin },
  { name: "Emergency Vault", href: "/vault", icon: ShieldAlert },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, switchProfile } = useUser()
  const { setOpenMobile } = useSidebar()

  const handleLogout = async () => {
    switchProfile()
  }

  return (
    <Sidebar collapsible="icon" className="border-none bg-[#fafafa] dark:bg-background">
      <SidebarHeader className="h-14 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Home className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-headline font-black text-base leading-none tracking-tighter uppercase italic">Kapendeka</span>
            <span className="font-headline text-[7px] font-black uppercase tracking-[0.3em] text-primary/60 mt-0.5">Universe Hub</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Universe Portals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {portals.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.name}
                      className={`h-9 rounded-xl transition-all duration-200 ${pathname === item.href ? 'bg-primary/15 shadow-sm shadow-primary/10' : 'hover:bg-white hover:shadow-md hover:shadow-primary/5'}`}
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`font-bold uppercase tracking-tight text-[10px] group-data-[collapsible=icon]:hidden ${pathname === item.href ? 'text-primary font-black' : 'text-muted-foreground'}`}>
                          {item.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-6 opacity-10 bg-primary" />
      <SidebarFooter>
        <SidebarMenu className="px-2 pb-3 space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Profile" isActive={pathname === "/profile"} className="h-11 rounded-xl bg-white shadow-md shadow-primary/5 border border-primary/5">
              <Link href="/profile" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
                <Avatar className="h-7 w-7 rounded-lg border-2 border-primary/10 bg-white">
                  <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${profile?.id}`} className="object-cover" />
                  <AvatarFallback className="text-[9px] font-black bg-primary text-white uppercase italic">{profile?.display_name?.substring(0, 2) || "KP"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-black text-[10px] uppercase tracking-tight truncate">{profile?.display_name || "Profile"}</span>
                  <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">{profile?.role || "Node"}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <div className="grid grid-cols-2 gap-1.5 group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem className="col-span-1">
              <SidebarMenuButton asChild isActive={pathname === "/settings"} className="h-9 rounded-lg justify-center bg-muted/20 hover:bg-primary/5">
                <Link href="/settings"><Settings className="h-4 w-4 text-muted-foreground" /></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="col-span-1">
              <SidebarMenuButton onClick={handleLogout} className="h-9 rounded-lg justify-center bg-rose-50 hover:bg-rose-100 text-rose-500" tooltip="Switch Profile">
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
