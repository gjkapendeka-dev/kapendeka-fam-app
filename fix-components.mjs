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

  // Fix the mistakenly removed commas in rest operators: className...props -> className, ...props
  // Check for any word followed by ...
  // Be careful not to replace things that don't need commas, but since the bug was `,\s*\.` replaced with `.`,
  // we actually lost `, ` before `...`.
  content = content.replace(/([a-zA-Z0-9_'"](?: = [^,\.\s]+)?)\s*\.\.\./g, (match, p1) => {
    // If it's already got a comma before it, leave it
    if (match.includes(',')) return match;
    // Otherwise add comma and space
    return `${p1}, ...`;
  });
  
  // Actually the regex in the original script was: content.replace(/,\s*\./g, '.');
  // So it literally replaced `, .` with `.`. So `, ...props` became `..props`. Wait.
  // `,\s*\.` replaced `, .` with `.`. 
  // `...props` has 3 dots.
  // `, ...` -> `..` ?
  // No, `,\s*\.` matches `, ` and the first dot of `...`.
  // So `, ...` becomes `..`. Wait, the error is `className...props` which has 3 dots.
  // If `,\s*\.` replaced `, .` with `.`, then `, ...` becomes `...`.
  // So `className, ...props` became `className...props`.
  // Yes! The first dot was replaced with a dot. So we just lost the comma and space.
  
  // Let's just restore it explicitly where we see it in destructuring.
  content = content.replace(/([a-zA-Z0-9_'"]+)\.\.\./g, '$1, ...');
  content = content.replace(/false\.\.\./g, 'false, ...');
  content = content.replace(/true\.\.\./g, 'true, ...');
  // Handle `asChild = false...props`
  content = content.replace(/asChild = false\.\.\.props/g, 'asChild = false, ...props');
  
  // Re-run the regex more safely: look for word characters or `false`/`true` directly attached to `...`
  // Actually `([a-zA-Z0-9_'"]+)\.\.\.` handles most.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log("Component fix script complete.");
