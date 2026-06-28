import fs from 'fs';

let useToast = fs.readFileSync('src/hooks/use-toast.ts', 'utf8');
useToast = useToast.replace('if (toastTimeouts.has(toastId) {', 'if (toastTimeouts.has(toastId)) {');
fs.writeFileSync('src/hooks/use-toast.ts', useToast);

let button = fs.readFileSync('src/components/ui/button.tsx', 'utf8');
button = button.replace('className={cn(buttonVariants({ variant, size, className })}', 'className={cn(buttonVariants({ variant, size, className }))}');
fs.writeFileSync('src/components/ui/button.tsx', button);

let card = fs.readFileSync('src/components/ui/card.tsx', 'utf8');
card = card.replace(/\n\)\nCard\.displayName = "Card"/g, '\n))\nCard.displayName = "Card"');
fs.writeFileSync('src/components/ui/card.tsx', card);

let label = fs.readFileSync('src/components/ui/label.tsx', 'utf8');
label = label.replace(/\n\)\nLabel\.displayName = /g, '\n))\nLabel.displayName = ');
fs.writeFileSync('src/components/ui/label.tsx', label);

let toast = fs.readFileSync('src/components/ui/toast.tsx', 'utf8');
toast = toast.replace(/\n\)\nToastViewport\.displayName = /g, '\n))\nToastViewport.displayName = ');
fs.writeFileSync('src/components/ui/toast.tsx', toast);

let page = fs.readFileSync('src/app/page.tsx', 'utf8');
page = page.replace(/\n\s*\}\)\}\n/g, '\n                  ))}\n');
fs.writeFileSync('src/app/page.tsx', page);

console.log('Fixed missing parentheses in ui components!');
