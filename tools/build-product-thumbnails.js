/* Generate lightweight listing images while keeping Products/web images full-size for product detail and zoom.
   Run from the website folder: node tools/build-product-thumbnails.js
   Requires macOS sips.
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const productDir = path.join(root, 'Products');
const webDir = path.join(productDir, 'web');
const cardDir = path.join(productDir, 'cards');
const isImage = file => /\.(jpe?g|png|webp)$/i.test(file);
const stemOf = file => file.split('.')[0];
const files = fs.readdirSync(productDir).filter(file => !file.startsWith('.'));
const images = files.filter(isImage);
const webImages = fs.existsSync(webDir) ? fs.readdirSync(webDir).filter(isImage) : [];
const records = files.filter(file => /\.json$/i.test(file));

fs.mkdirSync(cardDir, { recursive: true });
let generated = 0;

for (const record of records) {
    const stem = stemOf(record);
    const sourceName = webImages.find(file => stemOf(file) === stem) || images.find(file => stemOf(file) === stem);
    if (!sourceName) {
        console.warn(`Skipping ${record}: no matching product image`);
        continue;
    }
    const source = webImages.some(file => stemOf(file) === stem)
        ? path.join(webDir, sourceName)
        : path.join(productDir, sourceName);
    const output = path.join(cardDir, `${stem}.jpg`);

    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', '800', source, '--out', output], { stdio: 'ignore' });
    generated++;
}

console.log(`Generated ${generated} product card thumbnails in Products/cards/ (max 800px, JPEG quality 72).`);
