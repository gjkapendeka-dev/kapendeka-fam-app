import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'

const targetDir = 'src/app'

const files = globSync(`${targetDir}/**/*.tsx`)

let fixedFiles = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8')
  let originalContent = content

  // Fix .order("createdAt", { ascending: false } -> add missing )
  content = content.replace(/\.order\("createdAt", \{ ascending: false \}(\s*\n)/g, '.order("createdAt", { ascending: false })$1')

  // Fix .finally(() => setIsSubmitting(false) -> add missing )
  content = content.replace(/\.finally\(\(\) => (setIsSubmitting|setIsSaving)\(false\)(\s*\n)/g, '.finally(() => $1(false))$2')
  
  // Fix .then(() => toast({ title: "..." }) -> add missing )
  // Example: .then(() => toast({ title: "Ritual Removed" })
  content = content.replace(/\.then\(\(\) => toast\(\{([^}]+)\}\)(\s*\n)/g, '.then(() => toast({$1}))$2')
  
  // Replace `!db` with `!supabase`
  content = content.replace(/!db/g, '!supabase')
  
  // Replace `[db,` with `[supabase,`
  content = content.replace(/\[db,/g, '[supabase,')
  
  // Optional: check for doc(db, ...) and updateDoc(..., but since it varies so much, it might be safer just to fix syntax and !db and see if it compiles.
  // Actually, replacing db with supabase is mostly enough. If there are other syntax errors, Next.js will complain.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8')
    console.log(`Fixed: ${file}`)
    fixedFiles++
  }
}

console.log(`Done. Fixed ${fixedFiles} files.`)
