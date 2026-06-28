import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const srcDir = path.join(__dirname, 'src');
const files = walkSync(srcDir);

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Fix: import { useSupabase } \n
  content = content.replace(/import\s*\{\s*useSupabase\s*\}\s*\n/g, 'import { useSupabase } from "@/supabase"\n');
  content = content.replace(/import\s*\{\s*useUser\s*,\s*useCollection\s*,\s*useSupabase\s*\}\s*\n/g, 'import { useUser, useCollection, useSupabase } from "@/supabase"\n');

  // Fix: import { errorEmitter } \n and import { FirestorePermissionError } \n
  content = content.replace(/import\s*\{\s*errorEmitter\s*\}\s*\n/g, '');
  content = content.replace(/import\s*\{\s*FirestorePermissionError\s*\}\s*\n/g, '');
  content = content.replace(/import\s*\{\s*errorEmitter\s*,\s*FirestorePermissionError\s*\}\s*\n/g, '');

  // Clean up any other imports that lost their `from` because of the regex:
  // content.replace(/from\s+['"]@\/firebase\/.+?['"]/g, ''); left just `import { x }`
  content = content.replace(/import\s*\{[^}]+\}\s*\n(?=(import|const|let|var|function|export))/g, (match) => {
    // If it's an import missing a "from", we just remove it because it was a firebase import.
    // Except if it's our supabase ones which we just fixed above.
    if (match.includes('useSupabase') || match.includes('useUser') || match.includes('useCollection')) {
      return match;
    }
    return '';
  });

  // Fix trailing parenthesis on query builder
  // We replaced `collection(...)` with `supabase.from(...)` and `.eq(...)`. 
  // If a line ends with `)` but it's part of a return statement that had `query(...)`, there might be a trailing `)`.
  // e.g. `return supabase.from("ecoLogs") .eq("familyId", profile.familyId).order("date", { ascending: false }).limit(10))`
  content = content.replace(/\)\)/g, ')'); // This is risky but might fix many `limit(10))` issues. Let's do it only at end of line.
  content = content.replace(/\)\)\s*\n/g, ')\n');
  
  // Fix comma followed by orderBy from old query() args:
  // `supabase.from("celebrations").eq("familyId", profile.familyId), orderBy("date", "asc") )`
  // The first regex was supposed to fix this, let's fix it properly.
  content = content.replace(/,\s*orderBy\(([^,]+),\s*['"]asc['"]\)/g, '.order($1, { ascending: true })');
  content = content.replace(/,\s*orderBy\(([^,]+),\s*['"]desc['"]\)/g, '.order($1, { ascending: false })');
  content = content.replace(/,\s*orderBy\(([^)]+)\)/g, '.order($1)');
  
  // Fix `, limit(N)`
  content = content.replace(/,\s*limit\(([^)]+)\)/g, '.limit($1)');

  // Fix `return supabase.from(...).eq(...).order(...) )`
  content = content.replace(/\)\s*\n(\s*\}\,\s*\[)/g, '\n$1'); // remove trailing ) before }, [db]

  // Fix `from "firebase/firestore"`
  content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]firebase\/firestore['"];?\n/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log("Syntax fix script complete.");
