const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/app/**/page.tsx');
let updatedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  // Replace standard page titles with consistent styling
  const newContent = content.replace(/<h1 className="([^"]*)">([^<]+)<\/h1>/g, (match, classNames, text) => {
     // Skip completely custom game screens that need white/shadow
     if(text.includes('Kapendeka!') || text.includes('Final Podium') || text.includes("You're in!") || text.includes('Game Over!')) {
         return `<h1 className="text-4xl md:text-5xl font-headline font-black uppercase tracking-tight text-white drop-shadow-lg">${text}</h1>`;
     }
     // Apply consistent standard styling
     return `<h1 className="text-3xl md:text-4xl font-headline font-black uppercase tracking-tight text-primary">${text}</h1>`;
  });
  
  if (content !== newContent) {
     fs.writeFileSync(f, newContent);
     console.log(`Updated ${f}`);
     updatedCount++;
  }
});

console.log(`Done! Updated ${updatedCount} files.`);
