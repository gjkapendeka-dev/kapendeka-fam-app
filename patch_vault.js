const fs = require('fs');
let content = fs.readFileSync('src/app/vault/page.tsx', 'utf8');

// The file currently has mock documents.
// I need to wire up the Supabase queries.
// Look for `const [isSubmitting, setIsSubmitting] = React.useState(false)`
// and `const [title, setTitle] = React.useState("")`
// and `const [type, setType] = React.useState("medical")`
// and `const [url, setUrl] = React.useState("")`

const supabaseQuery = `
  const documentsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("vault_documents").select("*").eq("family_id", profile.familyId).order("created_at", { ascending: false })
  }, [supabase, profile?.familyId])

  const { data: documents, loading } = useCollection(documentsQuery)

  const handleUpload = async () => {
    if (!supabase || !profile?.familyId || !title || !url) return

    setIsSubmitting(true)
    const docData = {
      family_id: profile.familyId,
      title,
      type,
      url
    }

    const { error } = await supabase.from("vault_documents").insert([docData])
    
    setIsSubmitting(false)
    if (!error) {
      setIsDialogOpen(false)
      setTitle("")
      setUrl("")
      toast({
        title: "Vault Updated",
        description: "Document secured.",
      })
    }
  }

  const handleDelete = async (id) => {
    if (!supabase || profile?.role !== 'parent') return
    await supabase.from("vault_documents").delete().eq("id", id)
    toast({ title: "Document Removed" })
  }
`;

if (!content.includes('documentsQuery')) {
  // Replace the mock array with the query
  content = content.replace(/const DOCUMENTS = \[.*?\];/s, '');
  content = content.replace('const [url, setUrl] = React.useState("")', 'const [url, setUrl] = React.useState("")\n' + supabaseQuery);
  
  // Wire up the Add button
  content = content.replace('onClick={() => setIsDialogOpen(false)} disabled={!title}', 'onClick={handleUpload} disabled={!title || isSubmitting}');
  
  // Map over documents instead of DOCUMENTS
  // Wait, the UI mapping is: `{DOCUMENTS.map((doc, idx) => (`
  content = content.replace(/\{DOCUMENTS\.map\(\(doc, idx\) => \(/g, '{documents?.map((doc, idx) => (');
  
  // Inside the map, we need to pass doc.id to delete if possible.
  // The vault UI might have a delete button.
  // `<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>`
  content = content.replace(/<Trash2 className="h-4 w-4" \/>\n\s*<\/Button>/g, '<Trash2 className="h-4 w-4" />\n                                     </Button>').replace(/<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive\/10">/g, '<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id)}>');
}

fs.writeFileSync('src/app/vault/page.tsx', content);
console.log('Vault patched');
