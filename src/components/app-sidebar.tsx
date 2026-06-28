
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
  Gamepad,
  LogOut,
  User,
  Target,
  Sparkles,
  BarChart4,
  Library,
  Lightbulb,
  Compass,
  Leaf,
  Wind,
  HelpCircle
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
import { usePathname, useRouter } from "next/navigation"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const portals = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Family Rituals", href: "/rituals", icon: Target },
  { name: "Family Polls", href: "/polls", icon: BarChart4 },
  { name: "AI Story Studio", href: "/stories", icon: Library },
  { name: "Universe Arcade", href: "/arcade", icon: Gamepad },
  { name: "Trivia Quest", href: "/trivia", icon: HelpCircle },
  { name: "Universe Quests", href: "/quest", icon: Compass },
  { name: "Vision Board", href: "/vision", icon: Lightbulb },
  { name: "Eco-Universe", href: "/eco", icon: Leaf },
  { name: "Zen Space", href: "/zen", icon: Wind },
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
  const router = useRouter()
  const { profile } = useUser()
  const auth = useAuth()

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" className="border-none bg-[#fafafa] dark:bg-background">
      <SidebarHeader className="h-20 flex items-center px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform">
            <Home className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-headline font-black text-xl leading-none tracking-tighter uppercase italic">Kapendeka</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Universe Hub</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Universe Portals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-1">
              {portals.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-12 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <item.icon className={`h-5 w-5 shrink-0 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-black uppercase tracking-tight text-[11px] group-data-[collapsible=icon]:hidden ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}>
                        {item.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-6 opacity-10 bg-primary" />
      <SidebarFooter>
        <SidebarMenu className="px-3 pb-8 space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Profile" isActive={pathname === "/profile"} className="h-14 rounded-2xl bg-white shadow-lg shadow-primary/5 border border-primary/5">
              <Link href="/profile" className="flex items-center gap-4">
                <Avatar className="h-8 w-8 rounded-xl border-2 border-primary/10">
                  <AvatarImage src={`https://picsum.photos/seed/${profile?.id}/50/50`} />
                  <AvatarFallback className="text-[10px] font-black bg-primary text-white uppercase italic">KP</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-black text-[11px] uppercase tracking-tight truncate">{profile?.displayName || "Profile"}</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{profile?.role || "Node"}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <div className="grid grid-cols-2 gap-2 group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem className="col-span-1">
              <SidebarMenuButton asChild isActive={pathname === "/settings"} className="h-10 rounded-xl justify-center bg-muted/20 hover:bg-primary/5">
                <Link href="/settings"><Settings className="h-4 w-4 text-muted-foreground" /></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="col-span-1">
              <SidebarMenuButton onClick={handleLogout} className="h-10 rounded-xl justify-center bg-rose-50 hover:bg-rose-100 text-rose-500">
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
