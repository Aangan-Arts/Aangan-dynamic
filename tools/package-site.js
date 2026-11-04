/* Copies only the files visitors need into dist/ (what Cloudflare Pages publishes).
   Keeps your original photos, tools, database files and settings off the public internet. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'dist');
const PUBLIC = ['index.html', 'product.html', 'robots.txt', 'sitemap.xml', 'llms.txt', 'feed.xml', '_headers', '_redirects',
  'css', 'js', 'images', 'p', 'admin', 'Products/cards', 'Products/detail'];
fs.rmSync(out, { recursive: true, force: true });
let n = 0;
const copy = (src, dst) => {
  const st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) if (!f.startsWith('.')) copy(path.join(src, f), path.join(dst, f)); }
  else { fs.copyFileSync(src, dst); n++; }
};
for (const p of PUBLIC) { const src = path.join(root, p); if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }); copy(src, path.join(out, p)); } }
console.log(`Packaged ${n} files into dist/`);
