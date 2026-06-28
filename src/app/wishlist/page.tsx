
"use client"

import * as React from "react"
import { 
  Gift, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  ExternalLink, 
  Heart, 
  CheckCircle2, 
  Loader2,
  Tag
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
const PRIORITIES = [
  { value: "high", label: "High Priority", color: "text-rose-500 bg-rose-50" },
  { value: "medium", label: "Medium Priority", color: "text-amber-500 bg-amber-50" },
  { value: "low", label: "Low Priority", color: "text-emerald-500 bg-emerald-50" },
]

export default function WishlistPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Form State
  const [title, setTitle] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [priority, setPriority] = React.useState("medium")
  const [link, setLink] = React.useState("")

  const fetchItems = React.useCallback(async () => {
    if (!supabase || !profile?.familyId) return
    setLoading(true)
    const { data } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("familyId", profile.familyId)
      .order("createdAt", { ascending: false })
      .limit(50)
    setItems(data || [])
    setLoading(false)
  }, [supabase, profile?.familyId])

  React.useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleAddItem = async () => {
    if (!supabase || !profile?.familyId || !title) return

    setIsSubmitting(true)
    const itemData = {
      familyId: profile.familyId,
      userId: profile.id,
      userName: profile.displayName,
      title,
      price: parseFloat(price) || 0,
      priority,
      link,
      status: "want",
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase.from("wishlist_items").insert([itemData])
    setIsSubmitting(false)
    if (error) {
      toast({ title: "Error adding item", description: error.message, variant: "destructive" })
      return
    }

    setIsDialogOpen(false)
    setTitle("")
    setPrice("")
    setLink("")
    toast({ title: "Added to Wishlist", description: `${title} is now in the family list.` })
  }

  const toggleStatus = async (itemId: string, currentStatus: string) => {
    if (!supabase) return
    const newStatus = currentStatus === "want" ? "bought" : "want"
    const { error } = await supabase.from("wishlist_items").update({ status: newStatus }).eq("id", itemId)
    if (!error) toast({ title: "Status Updated" })
  }

  const deleteItem = async (itemId: string) => {
    if (!supabase) return
    const { error } = await supabase.from("wishlist_items").delete().eq("id", itemId)
    if (!error) toast({ title: "Item Removed" })
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Family Wishlist</h1>
          <p className="text-muted-foreground font-medium">Coordinate gifts and goals for the Kapendeka family</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add to Wishlist</DialogTitle>
              <DialogDescription>What are you wishing for?</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Item Name</Label>
                <Input id="title" placeholder="e.g. New Headphones" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (ZAR)</Label>
                  <Input id="price" type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link">Product Link</Label>
                <Input id="link" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddItem} disabled={!title || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)
        ) : items?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
            <Gift className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg">Your Wishlist is Empty</h3>
            <p className="text-muted-foreground">Start adding items you or your family members want!</p>
          </div>
        ) : (
          items?.map((item) => {
            const priorityInfo = PRIORITIES.find(p => p.value === item.priority) || PRIORITIES[1]
            return (
              <Card key={item.id} className={`group rounded-2xl border-none shadow-md overflow-hidden transition-all hover:shadow-xl ${item.status === 'bought' ? 'opacity-60' : ''}`}>
                <div className={`h-1.5 w-full ${priorityInfo.color.split(' ')[0]}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className={`text-[10px] font-bold uppercase ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </Badge>
                    <div className="flex gap-1">
                      {item.link && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                          <a href={item.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold mt-2">{item.title}</CardTitle>
                  <CardDescription className="font-medium text-primary/80">Requested by {item.userName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-foreground">R {item.price?.toFixed(2)}</div>
                    <Button 
                      variant={item.status === 'bought' ? "secondary" : "default"}
                      size="sm"
                      className="rounded-xl font-bold"
                      onClick={() => toggleStatus(item.id, item.status)}
                    >
                      {item.status === 'bought' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Got It</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4 mr-2" /> Mark Bought</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
