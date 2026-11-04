/* AANGAN server helpers, shared by everything in functions/. Not served to visitors. */

export const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export const fail = (status, message, extra = {}) => json({ ok: false, error: message, ...extra }, status);

/* read a JSON body, refusing anything bigger than `limit` bytes */
export async function readJson(request, limit = 64 * 1024) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > limit) throw new HttpError(413, 'Request too large');
  const text = await request.text();
  if (text.length > limit) throw new HttpError(413, 'Request too large');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'Not valid JSON'); }
}

export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

/* wraps a handler so thrown errors become clean JSON replies (and are never shown raw to visitors) */
export const handle = fn => async ctx => {
  try { return await fn(ctx); }
  catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message);
    console.error(e);
    return fail(500, 'Something went wrong. Please try again.');
  }
};

export const slugify = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().split(/[\s_-]+/).filter(Boolean).slice(0, 9).join('-');
export const parseJson = (s, fallback) => { try { const v = JSON.parse(s); return v == null ? fallback : v; } catch { return fallback; } };
export const clean = (s, max = 2000) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
export const toPrice = v => (v === '' || v == null || isNaN(Number(v))) ? null : Math.max(0, Math.round(Number(v)));

/* one product row → the shape the website build and the admin both use */
export function productOut(r) {
  const media = parseJson(r.media, {});
  return {
    id: r.id, slug: r.slug, name: r.name, desc: r.description, price: r.price, mrp: r.mrp, category: r.category || '',
    details: parseJson(r.details, {}), care: parseJson(r.care, []), dispatch: r.dispatch || '',
    available: !!r.available, sort: r.sort, updated: (r.updated_at || '').slice(0, 10), updatedAt: r.updated_at, ...media
  };
}

export const ORDER_STATUSES = ['new', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];

/* a short, non-reversible fingerprint of the visitor's IP, used only to slow down spam */
export async function ipHash(request, salt = '') {
  const ip = request.headers.get('cf-connecting-ip') || '';
  const day = new Date().toISOString().slice(0, 10);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}|${day}|${ip}`));
  return [...new Uint8Array(buf)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- admin sign-in: Cloudflare Access ----------
   Cloudflare Access sits in front of /admin and /api/admin and only lets in the emails you allow.
   As a second lock, every admin request is checked here too: the signed token Access adds must be
   valid for this application. Settings: ACCESS_TEAM_DOMAIN (e.g. aangan.cloudflareaccess.com), ACCESS_AUD. */
let certCache = { at: 0, keys: [] };
const b64urlBytes = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

export async function adminEmail(request, env) {
  if (env.DEV_ADMIN_EMAIL && /^(localhost|127\.0\.0\.1)$/.test(new URL(request.url).hostname)) return env.DEV_ADMIN_EMAIL;   // local testing only
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const header = JSON.parse(new TextDecoder().decode(b64urlBytes(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlBytes(p)));
  const team = String(env.ACCESS_TEAM_DOMAIN).replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (Date.now() - certCache.at > 3600e3 || !certCache.keys.some(k => k.kid === header.kid)) {
    const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
    certCache = { at: Date.now(), keys: (await r.json()).keys || [] };
  }
  const jwk = certCache.keys.find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`));
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!ok || !aud.includes(env.ACCESS_AUD) || payload.iss !== `https://${team}` || payload.exp * 1000 < Date.now()) return null;
  return payload.email || null;
}
