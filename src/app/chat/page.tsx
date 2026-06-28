"use client"

import * as React from "react"
import { 
  Send, 
  Hash, 
  Users, 
  Plus, 
  MoreVertical, 
  Image as ImageIcon, 
  Smile,
  Search,
  Loader2,
  ChevronLeft
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit 
} from "firebase/firestore"
import { format } from "date-fns"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const CHANNELS = [
  { id: "general", name: "General Hub", description: "Main announcements" },
  { id: "dinner", name: "Dinner Ideas", description: "What's cooking?" },
  { id: "church", name: "Church & Faith", description: "Spiritual updates" },
  { id: "funny", name: "Funny Moments", description: "Jokes and memes" },
  { id: "school", name: "School Hub", description: "Academic coordination" },
]

export default function ChatPage() {
  const { profile } = useUser()
  const db = useFirestore()
  
  const [activeChannel, setActiveChannel] = React.useState("general")
  const [showSidebar, setShowSidebar] = React.useState(true)
  const [newMessage, setNewMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)

  // Initial check for mobile
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setShowSidebar(false)
    }
  }, [])

  // Auto-hide sidebar on mobile once a channel is selected
  const handleChannelSelect = (id: string) => {
    setActiveChannel(id)
    if (window.innerWidth < 1024) {
      setShowSidebar(false)
    }
  }

  const messagesQuery = React.useMemo(() => {
    if (!db || !profile?.familyId) return null
    return query(
      collection(db, "messages"),
      where("familyId", "==", profile.familyId),
      where("channel", "==", activeChannel),
      orderBy("timestamp", "asc"),
      limit(50)
    )
  }, [db, profile?.familyId, activeChannel])

  const { data: messages, loading } = useCollection(messagesQuery)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !profile?.familyId || !newMessage.trim()) return

    setIsSending(true)
    const messageData = {
      familyId: profile.familyId,
      fromUser: profile.id,
      fromUserName: profile.displayName,
      text: newMessage,
      channel: activeChannel,
      timestamp: serverTimestamp(),
    }

    addDoc(collection(db, "messages"), messageData)
      .then(() => {
        setNewMessage("")
      })
      .catch((err) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: "messages",
          operation: "create",
          requestResourceData: messageData
        }))
      })
      .finally(() => setIsSending(false))
  }

  const currentChannel = CHANNELS.find(c => c.id === activeChannel)

  return (
    <div className="flex h-[calc(100vh-1rem)] overflow-hidden bg-background relative selection:bg-primary/10">
      {/* Sidebar: Channels */}
      <div className={`${
        showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } absolute lg:relative z-30 w-full lg:w-80 h-full border-r bg-white transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Universe Hub
          </h2>
          <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 rounded-2xl active:bg-muted" onClick={() => setShowSidebar(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4 no-scrollbar">
          <div className="space-y-2">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-[1.25rem] transition-all active:scale-[0.98] ${
                  activeChannel === channel.id
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Hash className="h-4 w-4 shrink-0 opacity-50" />
                <div className="text-left">
                  <div className="text-sm font-black uppercase tracking-tight">{channel.name}</div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white w-full h-full relative overflow-hidden">
        {/* Chat Header */}
        <header className="h-16 md:h-20 border-b flex items-center justify-between px-4 md:px-6 shrink-0 bg-white/95 backdrop-blur-md z-20 pr-14 md:pr-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 rounded-2xl bg-primary/5 text-primary active:scale-90 transition-transform" onClick={() => setShowSidebar(true)}>
              <Users className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-black uppercase tracking-tight truncate">{currentChannel?.name}</h1>
              <p className="text-[9px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest truncate">{currentChannel?.description}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Messages List */}
        <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/50 no-scrollbar">
          <div className="space-y-6 md:space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-16 w-16 bg-muted/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                    <Hash className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="font-black uppercase text-[10px] text-muted-foreground tracking-[0.2em]">Start the conversation</h3>
              </div>
            ) : (
              messages?.map((msg) => {
                const isMe = msg.fromUser === profile?.id
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-2 md:gap-4 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-9 w-9 md:h-12 md:w-12 border-2 border-white shadow-md shrink-0">
                      <AvatarImage src={`https://picsum.photos/seed/${msg.fromUser}/100/100`} />
                      <AvatarFallback className="bg-primary text-white font-black text-xs">{msg.fromUserName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col space-y-1.5 max-w-[82%] md:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] md:text-xs font-black text-foreground uppercase tracking-tight">
                          {isMe ? "You" : msg.fromUserName}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-muted-foreground font-bold uppercase">
                          {msg.timestamp ? format(new Date(msg.timestamp.seconds * 1000), "HH:mm") : "..."}
                        </span>
                      </div>
                      <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm md:text-base font-medium leading-relaxed ${
                        isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white text-foreground border rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={scrollRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 md:p-8 border-t shrink-0 bg-white">
          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
            <Input 
              placeholder={`Message #${activeChannel}...`}
              className="h-14 pl-5 pr-16 rounded-2xl border-none bg-muted/40 font-medium text-base md:text-lg focus-visible:ring-accent/30 shadow-inner"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || isSending}
                className="h-11 w-11 rounded-xl bg-accent shadow-xl shadow-accent/20 active:scale-90 transition-transform"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}