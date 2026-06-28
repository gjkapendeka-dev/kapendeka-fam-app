const fs = require('fs');
let content = fs.readFileSync('next.config.ts', 'utf8');

const pwaImport = `import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});
`;

if (!content.includes('withPWAInit')) {
  content = content.replace('import type {NextConfig} from \'next\';', 'import type {NextConfig} from \'next\';\n' + pwaImport);
  content = content.replace('export default nextConfig;', 'export default withPWA(nextConfig);');
}

fs.writeFileSync('next.config.ts', content);
console.log('PWA enabled in next.config.ts');
