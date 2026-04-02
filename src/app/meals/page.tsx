"use client"

import * as React from "react"
import { Utensils, Sparkles, ChefHat, Calendar, ShoppingBasket, Plus, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { naturalLanguageMealSuggestion } from "@/ai/flows/natural-language-meal-suggestion"
import { useToast } from "@/hooks/use-toast"

export default function MealPlannerPage() {
  const [query, setQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<any[]>([])
  const { toast } = useToast()

  const handleSuggest = async () => {
    if (!query) return
    setIsLoading(true)
    try {
      const result = await naturalLanguageMealSuggestion({ query })
      setSuggestions(result.suggestions)
      toast({
        title: "Suggestions ready!",
        description: result.summary,
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get suggestions. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Meal Planner & Recipe Box</h1>
          <p className="text-muted-foreground font-medium">Smart planning for a healthy family</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-primary/20 text-primary">
            <ShoppingBasket className="h-4 w-4 mr-2" /> Shopping List
          </Button>
          <Button className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" /> Add Recipe
          </Button>
        </div>
      </header>

      {/* AI Search Section */}
      <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-primary to-indigo-700 text-white p-1">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
              <h2 className="text-2xl font-bold">What's for dinner?</h2>
            </div>
            <p className="text-primary-foreground/80 font-medium">Ask AI to suggest a meal based on what you have or your dietary goals.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Suggest a healthy dinner with chicken for Tuesday..." 
                className="h-14 pl-12 rounded-2xl border-none bg-white/90 text-primary-foreground font-medium text-lg placeholder:text-muted-foreground focus-visible:ring-accent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSuggest}
              disabled={isLoading || !query}
              className="h-14 px-8 rounded-2xl bg-accent text-white font-bold hover:bg-accent/90 shadow-lg shadow-accent/20"
            >
              {isLoading ? "Thinking..." : "Get AI Suggestions"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            {suggestions.length > 0 ? "AI Recommended Recipes" : "Popular Family Recipes"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(suggestions.length > 0 ? suggestions : [
              { title: "Boerewors Roll", time: "15 min", tags: ["South African", "Quick"] },
              { title: "Cape Malay Curry", time: "45 min", tags: ["Dinner", "Classic"] },
              { title: "Pap & Vleis", time: "30 min", tags: ["Traditional", "Kid-Friendly"] },
              { title: "Biltong Salad", time: "10 min", tags: ["Healthy", "Snack"] }
            ]).map((recipe, i) => (
              <Card key={i} className="group overflow-hidden rounded-2xl hover:shadow-xl transition-all border-none shadow-md cursor-pointer">
                <div className="h-48 bg-muted relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i + 50}/600/400`} alt={recipe.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{recipe.title}</h4>
                    <span className="text-xs text-muted-foreground font-bold">{recipe.time || "25 min"}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(recipe.tags || []).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px] font-bold uppercase py-0 px-2 border-primary/20 text-primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Meal Plan
          </h3>
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 font-bold text-sm text-center border-b uppercase tracking-tighter">Week of April 8th</div>
            <CardContent className="p-4 space-y-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="flex items-center gap-4 group cursor-pointer hover:bg-muted/20 p-2 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    {day}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold truncate">
                      {day === 'Mon' ? 'Lentil Soup' : day === 'Tue' ? 'Chicken stir-fry' : 'Plan your meal...'}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium">Dinner</div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4 font-bold rounded-xl h-11 border-primary/20 text-primary">
                Generate Shopping List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}