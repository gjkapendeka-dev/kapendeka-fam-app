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
  // Skip the new supabase directory and the old firebase directory
  if (file.includes('src\\supabase') || file.includes('src/supabase') || file.includes('src\\firebase') || file.includes('src/firebase')) return;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Replace imports
  content = content.replace(/from\s+['"]@\/firebase['"]/g, 'from "@/supabase"');
  content = content.replace(/from\s+['"]@\/firebase\/.+?['"]/g, ''); 
  content = content.replace(/import.*?from\s+['"]firebase\/firestore['"];?\n?/g, '');
  content = content.replace(/import.*?from\s+['"]firebase\/auth['"];?\n?/g, '');

  // 2. Replace hooks
  content = content.replace(/useFirestore\(\)/g, 'useSupabase()');
  
  // 3. Replace Firebase query syntax with Supabase query syntax
  // This is a naive regex replacer. It will need some manual cleanup.
  content = content.replace(/collection\(\s*(?:db|firestore)\s*,\s*(['"][^'"]+['"])\)/g, 'supabase.from($1)');
  
  // Replace where, orderBy, limit
  content = content.replace(/where\((['"][^'"]+['"]),\s*['"]==['"],\s*([^)]+)\)/g, '.eq($1, $2)');
  content = content.replace(/orderBy\((['"][^'"]+['"]),\s*['"]desc['"]\)/g, '.order($1, { ascending: false })');
  content = content.replace(/orderBy\((['"][^'"]+['"])\)/g, '.order($1)');
  content = content.replace(/limit\(([^)]+)\)/g, '.limit($1)');
  
  // Clean up `query(supabase.from(...), .eq(...))`
  // We'll replace `query(` with nothing, and then we have a trailing `)` to deal with.
  // We'll just replace `query(` with `` and let the user/compiler find the trailing parenthesis or we can try to fix it.
  content = content.replace(/query\(\s*supabase\.from\((['"][^'"]+['"])\)\s*,/g, 'supabase.from($1)');
  // We have commas separating the chain now: `supabase.from("x"), .eq(a, b), .order(c)`
  // We need to replace `, \.` with `.`
  content = content.replace(/,\s*\./g, '.');

  // Fix addDoc, updateDoc, deleteDoc
  content = content.replace(/addDoc\(\s*supabase\.from\((['"][^'"]+['"])\),\s*({[\s\S]*?})\s*\)/g, 'supabase.from($1).insert([$2])');
  
  content = content.replace(/serverTimestamp\(\)/g, 'new Date().toISOString()');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log("Migration script complete.");
