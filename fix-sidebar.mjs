import fs from 'fs';
const fp='src/components/ui/sidebar.tsx';
let cnt=fs.readFileSync(fp,'utf8');
cnt=cnt.replace(/^\s*\)(?=\s*\n\s*\w+\.displayName\s*=)/gm, '  ))');
cnt=cnt.replace('(value: boolean | ((value: boolean) => boolean) => {', '(value: boolean | ((value: boolean) => boolean)) => {');
cnt=cnt.replace(': setOpen((open) => !open', ': setOpen((open) => !open)');
cnt=cnt.replace('return () => window.removeEventListener("keydown", handleKeyDown', 'return () => window.removeEventListener("keydown", handleKeyDown)');
fs.writeFileSync(fp,cnt);
console.log('Fixed sidebar.tsx');
