/* AANGAN — makes fast, small copies of every product photo.
   Runs automatically from  node tools/build-products.js  (you can also run it alone).
   Works on Mac, Windows and Linux. One-time setup in the website folder:  npm install

   For each product photo (Products/web/<name>.* or Products/<name>.*) it writes:
     Products/cards/<name>-400.webp, -600.webp   listing cards (small, sharp on phones)
     Products/cards/<name>.jpg                   600px JPEG for WhatsApp / Instagram link previews
     Products/detail/<name>-800.webp, -1200.webp product page and zoom
     Products/detail/<name>-1200.jpg             for Google (search, Merchant Center)
     Products/detail/<name>-zoom.webp            full-detail photo, loaded only when the zoom is opened
   Your original photos are never changed. A photo is only re-processed when it is newer than its copies.
   Sizes are saved in tools/image-manifest.json for the build script. */
const fs = require('fs'), path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..'), dir = path.join(root, 'Products'), webDir = path.join(dir, 'web');
const cardDir = path.join(dir, 'cards'), detailDir = path.join(dir, 'detail');
const manifestPath = path.join(__dirname, 'image-manifest.json');
const stemOf = f => f.split('.')[0], isImg = f => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f);

fs.mkdirSync(cardDir, { recursive: true }); fs.mkdirSync(detailDir, { recursive: true });
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const list = d => fs.existsSync(d) ? fs.readdirSync(d).filter(f => !f.startsWith('.') && isImg(f)) : [];
const webFiles = list(webDir), rootFiles = list(dir);
const stems = [...new Set(fs.readdirSync(dir).filter(f => /\.json$/i.test(f)).map(stemOf))];

const outputs = s => [
  path.join(cardDir, `${s}-400.webp`), path.join(cardDir, `${s}-600.webp`), path.join(cardDir, `${s}.jpg`),
  path.join(detailDir, `${s}-800.webp`), path.join(detailDir, `${s}-1200.webp`), path.join(detailDir, `${s}-1200.jpg`),
  path.join(detailDir, `${s}-zoom.webp`)
];
const fresh = (src, s) => manifest[s] && outputs(s).every(o => fs.existsSync(o) && fs.statSync(o).mtimeMs >= fs.statSync(src).mtimeMs);

(async () => {
  let made = 0, before = 0, after = 0;
  for (const s of stems) {
    const name = webFiles.find(f => stemOf(f) === s) || rootFiles.find(f => stemOf(f) === s);
    if (!name) continue;
    const src = path.join(webFiles.includes(name) ? webDir : dir, name);
    if (fresh(src, s)) continue;
    const base = () => sharp(src, { failOn: 'none' }).rotate();   // rotate() applies the phone's orientation
    const fit = (w, h) => ({ width: w, height: h, fit: 'inside', withoutEnlargement: true });
    const info = {};
    info.card400 = (await base().resize(fit(400, 600)).webp({ quality: 74, effort: 5 }).toFile(outputs(s)[0]));
    info.card600 = (await base().resize(fit(600, 900)).webp({ quality: 74, effort: 5 }).toFile(outputs(s)[1]));
    info.share = (await base().resize(fit(600, 900)).flatten({ background: '#ffffff' }).jpeg({ quality: 76, mozjpeg: true }).toFile(outputs(s)[2]));
    info.d800 = (await base().resize(fit(800, 1200)).webp({ quality: 78, effort: 5 }).toFile(outputs(s)[3]));
    info.d1200 = (await base().resize(fit(1200, 1600)).webp({ quality: 78, effort: 5 }).toFile(outputs(s)[4]));
    info.dJpg = (await base().resize(fit(1200, 1600)).flatten({ background: '#ffffff' }).jpeg({ quality: 80, mozjpeg: true }).toFile(outputs(s)[5]));
    // zoom: full detail, high quality; downloaded only when a shopper opens the zoom
    info.zoom = (await base().resize(fit(2400, 2400)).webp({ quality: 90, effort: 5, smartSubsample: true }).toFile(outputs(s)[6]));
    manifest[s] = {
      card: { w: info.card600.width, h: info.card600.height },
      share: { w: info.share.width, h: info.share.height },
      detail: { w: info.d1200.width, h: info.d1200.height },
      zoom: { w: info.zoom.width, h: info.zoom.height }
    };
    before += fs.statSync(src).size; after += info.d1200.size;
    made++;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
  console.log(made
    ? `Optimised ${made} product photo(s): product-page image ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB.`
    : 'Product photos already optimised.');
})().catch(e => { console.error('Image optimisation failed:', e.message, '\nRun  npm install  in the website folder first.'); process.exit(1); });
