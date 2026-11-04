/* Checks and tidies product fields sent from the admin before they are saved. */
import { HttpError, clean, slugify, toPrice, parseJson } from './lib.js';

const text = (v, max) => clean(v, max).replace(/[<>]/g, '');          // product text is shown on the site, so no HTML
const URL_OK = /^(?:https:\/\/[a-z0-9.-]+\/|img\/|Products\/)[A-Za-z0-9/_.\-]+$/;
const MEDIA_URLS = ['image', 'shareImage', 'cardImage', 'cardSrc', 'detailSrc', 'zoomSrc'];
const MEDIA_SIZES = ['shareW', 'shareH', 'cardW', 'cardH', 'detailW', 'detailH'];

export function cleanMedia(m) {
  m = m && typeof m === 'object' ? m : {};
  const out = {};
  for (const k of MEDIA_URLS) if (typeof m[k] === 'string' && URL_OK.test(m[k])) out[k] = m[k];
  for (const k of MEDIA_SIZES) if (Number.isFinite(Number(m[k])) && m[k] > 0) out[k] = Math.round(Number(m[k]));
  for (const k of ['cardSet', 'detailSet']) {
    if (typeof m[k] !== 'string') continue;
    const parts = m[k].split(',').map(s => s.trim()).filter(Boolean);
    if (parts.every(p => { const [u, w] = p.split(/\s+/); return URL_OK.test(u) && /^\d+w$/.test(w || ''); })) out[k] = parts.join(', ');
  }
  if (!out.cardSrc || !out.detailSrc) throw new HttpError(400, 'Please add a photo');
  out.image = out.image || out.detailSrc; out.cardImage = out.cardImage || out.cardSrc; out.shareImage = out.shareImage || out.cardSrc;
  return out;
}

/* body = what the admin sent; existing = the saved row when editing */
export function productFields(b, existing) {
  const name = text(b.name, 160);
  if (!name) throw new HttpError(400, 'Please enter a product name');
  const price = toPrice(b.price), mrpIn = toPrice(b.mrp);
  if (price != null && price < 1) throw new HttpError(400, 'Price must be at least ₹1');
  const mrp = price == null ? null : (mrpIn && mrpIn > price ? mrpIn : null);
  const details = {};
  if (b.details && typeof b.details === 'object') for (const [k, v] of Object.entries(b.details).slice(0, 12)) { const kk = text(k, 40), vv = text(v, 200); if (kk && vv) details[kk] = vv; }
  const care = (Array.isArray(b.care) ? b.care : String(b.care || '').split('\n')).map(c => text(c, 200)).filter(Boolean).slice(0, 12);
  const media = b.media ? cleanMedia(b.media) : existing ? cleanMedia(parseJson(existing.media, {})) : cleanMedia({});
  return {
    name, slug: b.slug ? slugify(b.slug) : '', description: text(b.description, 3000), price, mrp,
    category: text(b.category, 60), details: JSON.stringify(details), care: JSON.stringify(care), dispatch: text(b.dispatch, 300),
    available: b.available === false || b.available === 0 ? 0 : 1, media: JSON.stringify(media)
  };
}

export async function uniqueSlug(db, wanted, ownId = '') {
  const base = slugify(wanted) || 'piece';
  for (let k = 1; k < 50; k++) {
    const s = k === 1 ? base : `${base}-${k}`;
    const hit = await db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').bind(s, ownId).first();
    if (!hit) return s;
  }
  return `${base}-${Date.now().toString(36)}`;
}
