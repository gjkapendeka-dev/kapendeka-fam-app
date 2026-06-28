const fs = require('fs');
let content = fs.readFileSync('src/app/quest/page.tsx', 'utf8');

const confettiImport = `import confetti from "canvas-confetti"`;

const confettiLogic = `
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#fcd34d', '#fbbf24']
      })
`;

if (!content.includes('canvas-confetti')) {
    content = content.replace('import * as React from "react"', 'import * as React from "react"\n' + confettiImport);
    
    // Add confetti trigger on completion
    content = content.replace(/toast\(\{ title: "Quest Completed!".*?\}/g, (match) => {
        return confettiLogic + '\n        ' + match;
    });
}

fs.writeFileSync('src/app/quest/page.tsx', content);
console.log('Quests updated with confetti');
