const fs = require('fs');
const path = require('path');

const out = path.join(process.cwd(), 'public', 'build-info.json');
const info = {
  project: 'Zarcovi RPG Banco',
  builtAt: new Date().toISOString(),
  target: 'cloudflare-pages'
};
fs.writeFileSync(out, JSON.stringify(info, null, 2));
console.log('Build OK:', out);
