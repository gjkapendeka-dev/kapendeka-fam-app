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

  // 1. Fix useFirestore -> useSupabase
  content = content.replace(/useFirestore/g, 'useSupabase');
  content = content.replace(/const db = useSupabase\(\)/g, 'const { supabase } = useSupabase()');
  // Wait, useSupabase() returns the supabase client, not { supabase }.
  content = content.replace(/const { supabase } = useSupabase\(\)/g, 'const supabase = useSupabase()');
  content = content.replace(/const db = useSupabase\(\)/g, 'const supabase = useSupabase()');

  // 2. Fix collection(db, collectionName)
  content = content.replace(/collection\(db,\s*([^)]+)\)/g, 'supabase.from($1)');

  // 3. Fix addDoc(supabase.from("events"), eventData)
  content = content.replace(/addDoc\(\s*supabase\.from\(([^)]+)\),\s*([^)]+)\)/g, 'supabase.from($1).insert([$2])');
  content = content.replace(/await\s+supabase\.from/g, 'await supabase.from');

  // 4. Fix doc(db, "table", id)
  // Let's manually handle updateDoc and deleteDoc
  // updateDoc(doc(db, "table", id), data) -> supabase.from("table").update(data).eq("id", id)
  content = content.replace(/updateDoc\(\s*doc\(\s*db\s*,\s*(['"][^'"]+['"])\s*,\s*([^)]+)\s*\)\s*,\s*({[\s\S]*?}|[^)]+)\s*\)/g, 'supabase.from($1).update($3).eq("id", $2)');
  
  // updateDoc(postRef, data) -> this is harder. Just replace `updateDoc` with a comment to fix manually, or if it's `updateDoc(ref, data)`. 
  // actually, let's ignore postRef for now.

  // deleteDoc(doc(db, "table", id)) -> supabase.from("table").delete().eq("id", id)
  content = content.replace(/deleteDoc\(\s*doc\(\s*db\s*,\s*(['"][^'"]+['"])\s*,\s*([^)]+)\s*\)\s*\)/g, 'supabase.from($1).delete().eq("id", $2)');

  // Fix lingering .eq(...) with extra trailing )
  content = content.replace(/\.eq\(([^,]+),\s*([^)]+)\)\)/g, '.eq($1, $2)');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log("Migration fix script complete.");
