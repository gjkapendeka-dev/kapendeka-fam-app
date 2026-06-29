const fs = require('fs')
const path = 'c:/Users/ginas/OneDrive/Documents/George Master File/Kapendeka Fam App/src/app/arcade/page.tsx'
const content = fs.readFileSync(path, 'utf8')

const triggers = [...content.matchAll(/<TabsTrigger[^>]*value="([^"]+)"/g)].map(m => m[1])
const contents = [...content.matchAll(/<TabsContent[^>]*value="([^"]+)"/g)].map(m => m[1])

console.log("Triggers count:", triggers.length)
console.log("Contents count:", contents.length)

const missingInContents = triggers.filter(t => !contents.includes(t))
const missingInTriggers = contents.filter(c => !triggers.includes(c))

if (missingInContents.length > 0) {
  console.log("Missing TabsContent for:", missingInContents)
}
if (missingInTriggers.length > 0) {
  console.log("Missing TabsTrigger for:", missingInTriggers)
}

if (missingInContents.length === 0 && missingInTriggers.length === 0) {
  console.log("All triggers and contents match exactly.")
}
