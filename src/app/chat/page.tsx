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
  Loader2
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
  { id: "general", name: "General Hub", description: "Main family announcements" },
  { id: "dinner", name: "Dinner Ideas", description: "What's cooking tonight?" },
  { id: "church", name: "Church & Faith", description: "Spiritual growth and updates" },
  { id: "funny", name: "Funny Moments", description: "Jokes and memes" },
  { id: "school", name: "School & Homework", description: "Academic coordination" },
]

export default function ChatPage() {
  const { profile } = useUser()
  const db = useFirestore()
  
  const [activeChannel, setActiveChannel] = React.useState("general")
  const [newMessage, setNewMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)

  // Fetch messages for the active channel
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

  // Auto-scroll to bottom when new messages arrive
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
    <div className="flex h-[calc(100vh-2rem)] overflow-hidden bg-background">
      {/* Sidebar: Channels */}
      <div className="w-80 border-r bg-muted/20 hidden lg:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Universe Channels
          </h2>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
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
          
          <div className="mt-8">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-2">Direct Messages</h3>
            <div className="space-y-1">
              {["George", "Junior", "Sarah"].map((name) => (
                <button key={name} className="w-full flex items-center gap-3 p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">{name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{name}</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <header className="h-20 border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Hash className="h-3 w-3 mr-1" />
                {currentChannel?.id}
              </Badge>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold">{currentChannel?.name}</h1>
              <p className="text-xs text-muted-foreground font-medium">{currentChannel?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Messages List */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-2 font-medium">Connecting to Universe Hub...</p>
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="font-bold">No messages here yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to say something in #{activeChannel}!</p>
              </div>
            ) : (
              messages?.map((msg, idx) => {
                const isMe = msg.fromUser === profile?.id
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                      <AvatarImage src={`https://picsum.photos/seed/${msg.fromUser}/100/100`} />
                      <AvatarFallback>{msg.fromUserName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col space-y-1 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-xs font-bold text-foreground">
                          {isMe ? "You" : msg.fromUserName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {msg.timestamp ? format(new Date(msg.timestamp.seconds * 1000), "HH:mm") : "..."}
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm font-medium leading-relaxed ${
                        isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted/50 text-foreground rounded-tl-none"
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
        <div className="p-6 border-t shrink-0">
          <form onSubmit={handleSendMessage} className="relative">
            <Input 
              placeholder={`Message #${activeChannel}...`}
              className="h-14 pl-14 pr-32 rounded-2xl border-none bg-muted/30 font-medium focus-visible:ring-accent/20"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground">
                <Smile className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || isSending}
                className="h-10 w-10 rounded-xl bg-accent shadow-lg shadow-accent/20 ml-1"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium">
            Messages are shared with the entire Kapendeka family.
          </p>
        </div>
      </div>
    </div>
  )
}
