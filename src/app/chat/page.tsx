
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
    <div className="flex h-[calc(100vh-1rem)] overflow-hidden bg-background relative">
      {/* Sidebar: Channels */}
      <div className={`${
        showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } absolute lg:relative z-20 w-full lg:w-80 h-full border-r bg-white transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Universe Hub
          </h2>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowSidebar(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  activeChannel === channel.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-bold">{channel.name}</div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white w-full h-full relative">
        {/* Chat Header */}
        <header className="h-16 md:h-20 border-b flex items-center justify-between px-4 md:px-6 shrink-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10" onClick={() => setShowSidebar(true)}>
              <Users className="h-5 w-5 text-primary" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold truncate">{currentChannel?.name}</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">{currentChannel?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Messages List */}
        <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/30">
          <div className="space-y-4 md:space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center py-20">
                <Hash className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-bold text-muted-foreground">Start the conversation</h3>
              </div>
            ) : (
              messages?.map((msg) => {
                const isMe = msg.fromUser === profile?.id
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-2 md:gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 md:h-10 md:w-10 border shadow-sm shrink-0">
                      <AvatarImage src={`https://picsum.photos/seed/${msg.fromUser}/100/100`} />
                      <AvatarFallback>{msg.fromUserName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col space-y-1 max-w-[85%] md:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] md:text-xs font-bold text-foreground">
                          {isMe ? "You" : msg.fromUserName}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {msg.timestamp ? format(new Date(msg.timestamp.seconds * 1000), "HH:mm") : "..."}
                        </span>
                      </div>
                      <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-base font-medium leading-relaxed ${
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
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-3 md:p-6 border-t shrink-0 bg-white">
          <form onSubmit={handleSendMessage} className="relative">
            <Input 
              placeholder={`Message #${activeChannel}...`}
              className="h-12 md:h-14 pl-4 pr-14 rounded-2xl border-none bg-muted/40 font-medium text-sm md:text-base focus-visible:ring-accent/20"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || isSending}
                className="h-10 w-10 rounded-xl bg-accent shadow-lg shadow-accent/20"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
