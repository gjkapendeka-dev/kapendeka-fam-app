import fs from 'fs'
import { globSync } from 'glob'

const files = globSync('src/app/**/*.tsx')
let count = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8')
  const original = content

  // Fix errorEmitter missing closing parenthesis for FirestorePermissionError
  // The pattern is:
  //         operation: "create",
  //         requestResourceData: xyz
  //       })
  //     })
  // OR
  //         operation: "update"
  //       })
  //     })
  
  // We want to change the inner `})` to `}))`
  content = content.replace(/operation: ([^\n]+)\n(\s*)\}\)\n(\s*)\}\)/g, 'operation: $1\n$2}))\n$3})')
  content = content.replace(/requestResourceData: ([^\n]+)\n(\s*)\}\)\n(\s*)\}\)/g, 'requestResourceData: $1\n$2}))\n$3})')

  if (content !== original) {
    fs.writeFileSync(file, content)
    console.log(`Fixed errorEmitter in ${file}`)
    count++
  }
}
console.log(`Done. Fixed ${count} files.`)
