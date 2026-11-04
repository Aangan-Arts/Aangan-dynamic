/* One-time move of your current products into the database.
   Run on your computer after  node tools/build-products.js  (it reads the finished js/products.js so every
   product keeps exactly the same web address and photos):
     node tools/import-to-d1.js
     npx wrangler d1 execute aangan --remote --file db/import.sql                                     */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'js/products.js'), 'utf8'), ctx);
const P = ctx.window.AANGAN_PRODUCTS || [];
if (!P.length) { console.error('js/products.js has no products. Run node tools/build-products.js first.'); process.exit(1); }
const q = v => v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const MEDIA = ['image', 'shareImage', 'shareW', 'shareH', 'cardImage', 'cardSrc', 'cardSet', 'cardW', 'cardH', 'zoomSrc', 'detailSrc', 'detailSet', 'detailW', 'detailH'];
const rows = P.map((p, i) => {
  const media = Object.fromEntries(MEDIA.filter(k => p[k] != null).map(k => [k, p[k]]));
  return `INSERT OR REPLACE INTO products (id, slug, name, description, price, mrp, category, details, care, dispatch, available, sort, media) VALUES (${[
    p.id, p.slug, p.name, p.desc || '', p.price, p.mrp, p.category || '', JSON.stringify(p.details || {}),
    JSON.stringify(Array.isArray(p.care) ? p.care : (p.care ? [p.care] : [])), p.dispatch || '', p.available === false ? 0 : 1, i * 10, JSON.stringify(media)
  ].map(q).join(', ')});`;
});
fs.writeFileSync(path.join(root, 'db/import.sql'), rows.join('\n') + `\nINSERT OR REPLACE INTO settings (key, value) VALUES ('last_publish_at', strftime('%Y-%m-%dT%H:%M:%SZ','now'));\n`);
console.log(`Wrote db/import.sql with ${rows.length} products.`);
