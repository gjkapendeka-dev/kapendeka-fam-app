"use client"

import * as React from "react"
import { Utensils, Sparkles, ChefHat, Calendar, ShoppingBasket, Plus, Search, Loader2, Camera, X, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useUser, useCollection, useSupabase } from "@/supabase"
import { useRouter } from "next/navigation"

export default function MealPlannerPage() {
  const { profile } = useUser()
  const supabase = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  
  const [queryStr, setQueryStr] = React.useState("")
  const [isAiLoading, setIsAiLoading] = React.useState(false)
  const [isGeneratingList, setIsGeneratingList] = React.useState(false)
  const [aiSuggestions, setAiSuggestions] = React.useState<any[]>([])
  
  // Add Recipe Dialog State
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [newRecipeTitle, setNewRecipeTitle] = React.useState("")

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = React.useState(false)
  const [hasCameraPermission, setHasCameraPermission] = React.useState(false)
  const [isScanning, setIsScanning] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Refresh Counters
  const [recipesRefreshCounter, setRecipesRefreshCounter] = React.useState(0)
  const refreshRecipes = () => setRecipesRefreshCounter(prev => prev + 1)
  const [mealPlanRefreshCounter, setMealPlanRefreshCounter] = React.useState(0)
  const refreshMealPlan = () => setMealPlanRefreshCounter(prev => prev + 1)

  // Fetch Family Recipes
  const recipesQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("recipes").select("*").eq("family_id", profile.family_id)
  }, [supabase, profile?.family_id, recipesRefreshCounter])
  const { data: recipes, loading: recipesLoading } = useCollection(recipesQuery)

  // Fetch Current Meal Plan
  const mealPlanQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("meal_plans").select("*").eq("family_id", profile.family_id)
  }, [supabase, profile?.family_id, mealPlanRefreshCounter])
  const { data: mealPlans, loading: mealPlansLoading } = useCollection(mealPlanQuery)
  const currentPlan = mealPlans?.[0]

  // Recipe Modal State
  const [selectedRecipe, setSelectedRecipe] = React.useState<any>(null)
  
  // Day Picker State
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null)

  const handleSaveAiSuggestion = async (recipe: any) => {
    if (!supabase || !profile?.family_id) return
    const recipeData = {
      family_id: profile.family_id,
      title: recipe.title,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || "",
      tags: ["AI Suggested", ...(recipe.tags || [])],
      created_at: new Date().toISOString(),
    }
    try {
      await supabase.from("recipes").insert([recipeData])
      if (refreshRecipes) refreshRecipes()
      toast({ title: "Saved!", description: `"${recipe.title}" added to your box.` })
      setAiSuggestions(prev => prev.filter(r => r !== recipe))
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save recipe." })
    }
  }

  const handleAssignMeal = async (recipeId: string) => {
    if (!supabase || !profile?.family_id || !selectedDay) return;
    try {
      if (currentPlan) {
        const updatedDays = { ...currentPlan.days, [selectedDay]: { dinner: recipeId } };
        const { error } = await supabase.from("meal_plans").update({ days: updatedDays }).eq("id", currentPlan.id);
        if (error) throw error;
      } else {
        const newPlan = {
          family_id: profile.family_id,
          week_start: new Date().toISOString().split('T')[0],
          days: { [selectedDay]: { dinner: recipeId } }
        };
        const { error } = await supabase.from("meal_plans").insert([newPlan]);
        if (error) throw error;
      }
      if (refreshMealPlan) refreshMealPlan();
      setSelectedDay(null);
      toast({ title: "Meal Assigned", description: `Assigned to ${selectedDay}.` })
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to assign meal." })
    }
  }

  const handleSuggest = async () => {
    if (!queryStr) return
    setIsAiLoading(true)
    try {
      // Mock result since AI files were deleted
      const result = {
        summary: "Here is a suggestion (AI features disabled)",
        suggestions: [{ title: "Mock Recipe", ingredients: ["A", "B"], instructions: "Cook it" }]
      }
      setAiSuggestions(result.suggestions)
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
      setIsAiLoading(false)
    }
  }

  const handleAddRecipe = async () => {
    if (!supabase || !profile?.family_id || !newRecipeTitle) return
    
    const recipeData = {
      family_id: profile.family_id,
      title: newRecipeTitle,
      ingredients: [],
      instructions: "",
      tags: ["New"],
      created_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from("recipes").insert([recipeData])
      if (error) throw error
      if (refreshRecipes) refreshRecipes()
      setIsAddOpen(false)
      setNewRecipeTitle("")
      toast({ title: "Recipe Added", description: "Start adding ingredients to your new recipe!" })
    } catch (e: any) {
      console.error(e)
      toast({ variant: "destructive", title: "Error", description: e.message || "Could not save recipe." })
    }
  }

  const handleGenerateShoppingList = async () => {
    if (!currentPlan || !recipes || recipes.length === 0) {
      toast({ title: "No Plan Found", description: "Add some meals to your weekly plan first." })
      return
    }

    setIsGeneratingList(true)
    try {
      // Mock result since AI files were deleted
      const result = {
        listName: "Auto List",
        items: [{ id: "1", name: "Mock Item", quantity: "1", category: "Produce" }]
      }

      if (!supabase) return
      const { error } = await supabase.from("shopping_lists").insert([{
        family_id: profile?.family_id,
        name: result.listName,
        items: result.items.map(item => ({ ...item, checked: false })),
        is_auto_generated: true,
        created_at: new Date().toISOString()
      }])
      if (error) throw error;

      toast({
        title: "Shopping List Generated!",
        description: `Created "${result.listName}" with ${result.items.length} items.`,
      })
      router.push("/shopping")
    } catch (e: any) {
      console.error(e)
      toast({ variant: "destructive", title: "AI Error", description: e.message || "Failed to generate shopping list." })
    } finally {
      setIsGeneratingList(false)
    }
  }

  // Camera Logic
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setHasCameraPermission(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasCameraPermission(false)
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use the scanner.',
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
    setIsCameraOpen(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || !supabase || !profile?.family_id) return

    setIsScanning(true)
    const context = canvasRef.current.getContext('2d')
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context?.drawImage(videoRef.current, 0, 0)
    
    const photoDataUri = canvasRef.current.toDataURL('image/jpeg')

    try {
      const result = await identifyRecipe({ photoDataUri })
      
      // Save identified recipe to Firestore
      const recipeData = {
        family_id: profile.family_id, ...result,
        created_at: new Date().toISOString(),
      }
      
      const { error } = await supabase.from("recipes").insert([recipeData])
      if (error) throw error;
      if (refreshRecipes) refreshRecipes()
      
      toast({
        title: "Recipe Identified!",
        description: `"${result.title}" has been added to your recipe box.`,
      })
      stopCamera()
    } catch (e: any) {
      console.error(e)
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: e.message || "Could not identify recipe from image.",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto pb-20 overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-14 md:pr-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-primary uppercase italic">Meal Planner</h1>
          <p className="text-muted-foreground font-medium text-xs md:text-sm uppercase tracking-widest">Kapendeka World Recipes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            className="rounded-xl h-10 px-4 font-bold border-primary/20 text-primary active:scale-95 hover:bg-primary/5"
            onClick={() => router.push("/shopping")}
          >
            <ShoppingBasket className="h-4 w-4 mr-2" /> Shopping
          </Button>
          
          <Dialog open={isCameraOpen} onOpenChange={(open) => { if (open) startCamera(); else stopCamera(); setIsCameraOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-10 px-4 font-bold bg-accent shadow-lg shadow-accent/20 active:scale-95">
                <Camera className="h-4 w-4 mr-2" /> Scan
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] sm:max-w-2xl overflow-hidden p-0 h-[80vh] flex flex-col">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Universe AI Scanner</DialogTitle>
                <DialogDescription className="font-bold text-[10px] uppercase tracking-widest">Point at a cookbook or dish</DialogDescription>
              </DialogHeader>
              
              <div className="relative flex-1 bg-black overflow-hidden mt-4 mx-2 rounded-2xl">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                
                {!hasCameraPermission && !isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <Alert variant="destructive" className="bg-black/80 border-rose-500 text-white">
                      <AlertTitle>Camera Required</AlertTitle>
                      <AlertDescription>Enable camera access in settings.</AlertDescription>
                    </Alert>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-accent" />
                    <p className="font-black text-xs animate-pulse uppercase tracking-[0.2em]">Analyzing, ...</p>
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl h-12" onClick={stopCamera} disabled={isScanning}>Cancel</Button>
                <Button 
                  onClick={captureAndScan} 
                  disabled={isScanning || !hasCameraPermission}
                  className="bg-accent hover:bg-accent/90 rounded-xl h-12 font-black uppercase"
                >
                  {isScanning ? "Processing, ..." : "Capture"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-10 px-4 font-bold bg-primary shadow-lg shadow-primary/20 active:scale-95">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">New Recipe</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="recipe-title" className="font-black uppercase text-[10px] tracking-widest opacity-60">Recipe Name</Label>
                  <Input 
                    id="recipe-title" 
                    placeholder="e.g. Mama's Chakalaka" 
                    className="h-12 rounded-xl"
                    value={newRecipeTitle}
                    onChange={(e) => setNewRecipeTitle(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest" onClick={handleAddRecipe} disabled={!newRecipeTitle}>Create Recipe</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* AI Search Section */}
      <Card className="rounded-[2rem] md:rounded-[3rem] border-none shadow-xl bg-gradient-to-br from-primary to-indigo-700 text-white p-0.5">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-accent animate-pulse" />
              <h2 className="text-xl md:text-2xl font-bold">What's for dinner?</h2>
            </div>
            <p className="text-[10px] md:text-sm text-primary-foreground/80 font-medium uppercase tracking-widest">AI-Powered suggestions from your Hub</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="chicken for Tuesday, ..." 
                className="h-14 pl-12 rounded-2xl border-none bg-white/95 text-primary font-bold placeholder:text-muted-foreground/60 text-lg focus-visible:ring-accent"
                value={queryStr}
                onChange={(e) => setQueryStr(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
              />
            </div>
            <Button 
              onClick={handleSuggest}
              disabled={isAiLoading || !queryStr}
              className="h-14 px-4 rounded-2xl bg-accent text-white font-black uppercase tracking-widest hover:bg-accent/90 shadow-lg shadow-accent/20 active:scale-[0.98] transition-all"
            >
              {isAiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Get AI Suggestions"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
            <ChefHat className="h-5 w-5 text-primary" />
            {aiSuggestions.length > 0 ? "AI Recommended" : "Recipe Box"}
            {aiSuggestions.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setAiSuggestions([])} className="ml-auto text-xs font-black uppercase text-muted-foreground hover:text-primary">
                Clear
              </Button>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recipesLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-3xl" />)
            ) : (aiSuggestions.length > 0 ? aiSuggestions : recipes || []).length > 0 ? (
              (aiSuggestions.length > 0 ? aiSuggestions : recipes || []).map((recipe, i) => {
                const isAi = aiSuggestions.length > 0;
                return (
                <Card 
                  key={recipe.id || i} 
                  onClick={() => !isAi && setSelectedRecipe(recipe)}
                  className="group overflow-hidden rounded-[1.5rem] md:rounded-2xl hover:shadow-xl transition-all border-none shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="h-44 md:h-48 bg-muted relative overflow-hidden">
                    <img 
                      src={recipe.photoUrl || `https://picsum.photos/seed/${recipe.id || i + 50}/600/400`} 
                      alt={recipe.title} 
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {isAi ? (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSaveAiSuggestion(recipe); }} className="h-9 px-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold shadow-lg">
                          <Plus className="h-4 w-4 mr-1" /> Save
                        </Button>
                      ) : (
                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg text-primary">
                          <ChefHat className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors truncate pr-2">{recipe.title}</h4>
                      <span className="text-[10px] font-black uppercase text-muted-foreground shrink-0">{recipe.prepTime || "25m"}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(recipe.tags || []).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] font-black uppercase py-0.5 px-2 bg-primary/5 text-primary/80">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
              })
            ) : (
              <div className="col-span-full py-16 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Recipe Box Empty</p>
                <Button onClick={() => setIsAddOpen(true)} className="rounded-xl h-12 px-6 font-bold bg-primary shadow-lg shadow-primary/20 active:scale-95">
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Recipe
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Plan
          </h3>
          <Card className="rounded-[1.5rem] md:rounded-2xl border-none shadow-sm overflow-hidden bg-white">
            <div className="bg-muted/30 p-4 font-black text-[10px] text-center border-b uppercase tracking-[0.2em] text-primary/60">
              {currentPlan?.weekStart ? `Week of ${currentPlan.weekStart}` : 'Schedule Your Week'}
            </div>
            <CardContent className="p-4 space-y-2">
              {daysOfWeek.map((day) => {
                const meal = currentPlan?.days?.[day]?.dinner
                const recipe = recipes?.find(r => r.id === meal)
                return (
                  <div key={day} onClick={() => setSelectedDay(day)} className="flex items-center gap-4 group cursor-pointer hover:bg-primary/5 p-2 rounded-xl transition-all active:scale-[0.98] border border-transparent hover:border-primary/10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-[10px] uppercase shadow-inner">
                      {day.substring(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold truncate ${recipe ? 'text-primary' : 'text-muted-foreground'}`}>
                        {recipe?.title || 'Click to set dinner'}
                      </div>
                      <div className="text-[9px] text-muted-foreground/70 font-black uppercase tracking-wider">Dinner</div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${recipe ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white'}`}>
                      {recipe ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </div>
                  </div>
                )
              })}
              <Button 
                variant="outline" 
                className="w-full mt-4 font-black uppercase tracking-widest text-xs h-12 rounded-xl border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                onClick={handleGenerateShoppingList}
                disabled={isGeneratingList}
              >
                {isGeneratingList ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing, ...
                  </>
                ) : (
                  "Generate AI List"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      
      {/* View/Edit Recipe Modal */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="rounded-[2rem] max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{selectedRecipe?.title}</DialogTitle>
            <DialogDescription className="flex gap-2 pt-2 flex-wrap">
              {(selectedRecipe?.tags || []).map((tag: string) => (
                <Badge key={tag} className="text-[9px] uppercase font-black bg-primary/10 text-primary hover:bg-primary/20 border-none">{tag}</Badge>
              ))}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="rounded-2xl overflow-hidden h-48 bg-muted">
              <img 
                src={selectedRecipe?.photoUrl || `https://picsum.photos/seed/${selectedRecipe?.id || 10}/600/400`} 
                alt={selectedRecipe?.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <ShoppingBasket className="h-4 w-4 text-primary" /> Ingredients
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(selectedRecipe?.ingredients || []).length > 0 ? (
                  selectedRecipe.ingredients.map((ing: string, i: number) => (
                    <li key={i} className="text-sm font-medium flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {ing}
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No ingredients listed.</p>
                )}
              </ul>
            </div>
            {selectedRecipe?.instructions && (
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-primary" /> Instructions
                </h4>
                <div className="bg-primary/5 p-4 rounded-2xl text-sm font-medium whitespace-pre-wrap leading-relaxed text-primary/90">
                  {selectedRecipe.instructions}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl w-full h-12 font-black uppercase tracking-widest" onClick={() => setSelectedRecipe(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Meal for Day Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="rounded-[2rem] max-w-xl h-[80vh] flex flex-col p-6">
          <DialogHeader className="pb-4 shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary">
              Dinner for {selectedDay}
            </DialogTitle>
            <DialogDescription className="font-bold text-xs uppercase tracking-widest">
              Select a recipe from your box
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {(recipes || []).length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground font-bold uppercase text-xs mb-4">Recipe Box is Empty</p>
                <Button onClick={() => { setSelectedDay(null); setIsAddOpen(true); }} className="rounded-xl h-12 font-black uppercase tracking-widest">Add a Recipe</Button>
              </div>
            ) : (
              (recipes || []).map(recipe => (
                <div 
                  key={recipe.id}
                  onClick={() => handleAssignMeal(recipe.id)}
                  className="flex items-center gap-4 p-3 rounded-2xl border-2 border-transparent hover:border-primary/20 bg-muted/20 hover:bg-primary/5 cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 shadow-sm">
                    <img src={`https://picsum.photos/seed/${recipe.id}/200`} alt={recipe.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{recipe.title}</h4>
                    <p className="text-xs text-muted-foreground truncate opacity-70">
                      {recipe.ingredients?.join(', ') || 'No ingredients'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm border border-primary/10">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="pt-4 shrink-0">
             <Button variant="outline" className="w-full rounded-xl h-12 font-black uppercase tracking-widest" onClick={() => setSelectedDay(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}