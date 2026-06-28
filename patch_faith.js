const fs = require('fs');
let content = fs.readFileSync('src/app/faith/page.tsx', 'utf8');

// Insert new states for Devotional
const formStatesMarker = '// Form States';
const newDevoStates = `
  const [isDevoOpen, setIsDevoOpen] = React.useState(false)
  const [devoTitle, setDevoTitle] = React.useState("")
  const [devoVerse, setDevoVerse] = React.useState("")
  const [devoRef, setDevoRef] = React.useState("")
  const [devoReflection, setDevoReflection] = React.useState("")
  
  // Fetch Latest Devotional
  const devoQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("devotionals")
      .select("*")
      .eq("family_id", profile.familyId).order("created_at", { ascending: false }).limit(1)
  }, [supabase, profile?.familyId])
  const { data: devotionals } = useCollection(devoQuery)
  const currentDevo = devotionals?.[0] || null

  const handleAddDevo = async () => {
    if (!supabase || !profile?.familyId || !devoTitle || !devoVerse) return

    setIsSubmitting(true)
    const devoData = {
      family_id: profile.familyId,
      title: devoTitle, // we will just store title in reflection? No wait, schema has reflection. Wait I added 'title' to schema? No! Schema has author_id, author_name, reference, verse, reflection.
      author_id: profile.id,
      author_name: profile.displayName,
      reference: devoRef,
      verse: devoVerse,
      reflection: devoTitle + "\\n\\n" + devoReflection, // Combine them
    }

    const { error } = await supabase.from("devotionals").insert([devoData])
    setIsSubmitting(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    setIsDevoOpen(false)
    setDevoTitle("")
    setDevoVerse("")
    setDevoRef("")
    setDevoReflection("")
    toast({ title: "Devotional Published", description: "Shared with the family." })
  }
`;

if (!content.includes('const [isDevoOpen')) {
  content = content.replace(formStatesMarker, newDevoStates + '\n  ' + formStatesMarker);
}

// Replace Mock Devotional
const mockDevoTarget = `{/* Daily Devotional Mock */}
          <Card className="rounded-2xl border-none shadow-sm bg-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between text-accent">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  Daily Devotional
                </div>
                {profile?.role === 'parent' && (
                  <Dialog open={isDevoOpen} onOpenChange={setIsDevoOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold"><Plus className="h-3 w-3 mr-1" /> Add</Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Post a Daily Devotional</DialogTitle>
                        <DialogDescription>Share an encouraging verse with the family.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-2">
                        <div className="grid gap-1">
                          <Label>Theme/Title</Label>
                          <Input value={devoTitle} onChange={e => setDevoTitle(e.target.value)} placeholder="e.g. Strength in Stillness" />
                        </div>
                        <div className="grid gap-1">
                          <Label>Reference</Label>
                          <Input value={devoRef} onChange={e => setDevoRef(e.target.value)} placeholder="e.g. Psalm 46:10" />
                        </div>
                        <div className="grid gap-1">
                          <Label>Verse Text</Label>
                          <Textarea value={devoVerse} onChange={e => setDevoVerse(e.target.value)} placeholder="Be still, and know that I am God..." className="min-h-[80px]" />
                        </div>
                        <div className="grid gap-1">
                          <Label>Your Reflection</Label>
                          <Textarea value={devoReflection} onChange={e => setDevoReflection(e.target.value)} placeholder="What this means for our family..." className="min-h-[80px]" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddDevo} disabled={!devoTitle || !devoVerse || isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentDevo ? (
                <>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{format(new Date(currentDevo.created_at), "MMMM do, yyyy")} • by {currentDevo.author_name}</div>
                  <h4 className="font-bold text-md italic">"{currentDevo.reflection?.split('\\n\\n')[0] || 'Reflection'}"</h4>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {currentDevo.verse}
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed mt-2">
                    {currentDevo.reflection?.split('\\n\\n').slice(1).join('\\n\\n')}
                  </p>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-[10px] font-bold text-accent border-accent/30">
                      {currentDevo.reference}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm font-medium">No devotional posted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>`;

// Find the block to replace
const originalDevoBlock = `{/* Daily Devotional Mock */}
          <Card className="rounded-2xl border-none shadow-sm bg-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-accent">
                <Bookmark className="h-5 w-5" />
                Daily Devotional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">April 12, 2026</div>
              <h4 className="font-bold text-md italic">"Strength in Stillness"</h4>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                In a world that never stops moving, find your center in the quiet moments of the morning.
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="text-[10px] font-bold text-accent border-accent/30">
                  Psalm 46:10
                </Badge>
              </div>
            </CardContent>
          </Card>`;

if (content.includes('April 12, 2026')) {
    content = content.replace(originalDevoBlock, mockDevoTarget);
}

fs.writeFileSync('src/app/faith/page.tsx', content);
console.log('Faith Devotionals updated');
