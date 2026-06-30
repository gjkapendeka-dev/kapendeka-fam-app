const fs = require('fs');

const files = [
  'src/components/arcade/multi-sea-battle.tsx',
  'src/components/arcade/multi-dots-boxes.tsx',
  'src/components/arcade/multi-math-race.tsx',
  'src/components/arcade/multi-word-race.tsx',
  'src/components/arcade/multi-number-guess.tsx',
  'src/components/arcade/multi-reaction.tsx',
  'src/components/arcade/multi-rps.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Add state if not present
  if (!content.includes('const [localMode, setLocalMode] = useState(false);')) {
    content = content.replace(
      /const \[channel, setChannel\] = useState<any>\(null\);/,
      "const [channel, setChannel] = useState<any>(null);\n  const [localMode, setLocalMode] = useState(false);"
    );
  }

  // Replace fallback UI
  if (content.includes('if (!matchId) {')) {
    content = content.replace(
      /if \(!matchId\) \{[\s\S]*?<Button variant="outline" onClick=\{onLeave\}>Cancel<\/Button>\s*<\/div>\s*\);\s*\}/,
      `if (!matchId && !localMode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h3 className="text-xl font-bold">Waiting for opponent...</h3>
        <p className="text-muted-foreground text-sm">Join a multiplayer match from the main menu.</p>
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
           <Button variant="default" onClick={() => { setLocalMode(true); if(typeof setMyTurn !== 'undefined') setMyTurn(true); }} className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-widest">Practice Locally</Button>
           <Button variant="outline" onClick={onLeave}>Cancel</Button>
        </div>
      </div>
    );
  }`
    );
  }

  // Update onLeave checks
  content = content.replace(
    /\{\(onLeave\) && \(/,
    '{(onLeave || localMode) && ('
  );
  content = content.replace(
    /\{onLeave && \(/,
    '{(onLeave || localMode) && ('
  );
  content = content.replace(
    /onClick=\{onLeave\}/g,
    "onClick={() => { if(localMode) setLocalMode(false); else if(onLeave) onLeave(); }}"
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
}
