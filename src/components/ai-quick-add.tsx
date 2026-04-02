"use client"

import * as React from "react"
import { Mic, Search, Send, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { naturalLanguageQuickAdd } from "@/ai/flows/natural-language-quick-add"
import { useToast } from "@/hooks/use-toast"

export function AIQuickAdd() {
  const [query, setQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const result = await naturalLanguageQuickAdd({
        command: query,
        familyId: "kapendeka-main",
        userId: "user-george",
        familyMembers: [
          { userId: "user-george", displayName: "George" },
          { userId: "user-junior", displayName: "Junior" }
        ]
      })

      setQuery("")
      
      if (result.type === "shoppingList") {
        toast({
          title: "Added to Shopping List!",
          description: `Added ${result.itemName} (${result.quantity || 1}) to your ${result.listName} list.`,
        })
      } else if (result.type === "todo") {
        toast({
          title: "Task Created!",
          description: `"${result.title}" has been assigned to ${result.assignedTo === 'user-george' ? 'you' : result.assignedTo}.`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oops!",
        description: "I couldn't understand that. Try saying 'Add milk to groceries' or 'Remind me to call John tomorrow'.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleCommand} className="relative group w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary transition-colors group-focus-within:text-accent">
        <Sparkles className="h-5 w-5 animate-pulse" />
      </div>
      <Input
        placeholder="Type a family command... (e.g., 'Remind George to fix the sink tomorrow' or 'Add coffee to groceries')"
        className="h-16 pl-12 pr-28 rounded-2xl border-none shadow-xl shadow-primary/5 bg-white font-medium text-lg focus-visible:ring-accent/20"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isLoading}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-xl hover:bg-muted"
          disabled={isLoading}
        >
          <Mic className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button 
          type="submit" 
          className="h-12 w-12 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </form>
  )
}