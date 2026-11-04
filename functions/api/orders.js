/* POST /api/orders — saves an order the moment the shopper is sent to WhatsApp.
   The browser sends only product ids and quantities; names and prices are always taken from the database. */
import { json, fail, handle, readJson, clean, ipHash, HttpError } from '../../server/lib.js';

const REF = /^AGN-\d{6}-[A-Z0-9]{4}$/;
const METHODS = ['whatsapp_direct', 'details_form'];

export const onRequestPost = handle(async ({ request, env }) => {
  const b = await readJson(request, 16 * 1024);
  const ref = String(b.ref || '');
  if (!REF.test(ref)) throw new HttpError(400, 'Invalid order reference');
  if (!METHODS.includes(b.method)) throw new HttpError(400, 'Invalid checkout method');
  const lines = Array.isArray(b.items) ? b.items.slice(0, 30) : [];
  const qty = new Map();
  for (const l of lines) {
    const id = String(l && l.id || ''), q = Math.floor(Number(l && l.qty));
    if (id && q >= 1) qty.set(id, Math.min(20, (qty.get(id) || 0) + q));
  }
  if (!qty.size) throw new HttpError(400, 'The bag is empty');

  const ip = await ipHash(request, env.IP_SALT || 'aangan');
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','-1 hour')").bind(ip).first();
  if (recent && recent.n >= 20) return fail(429, 'Too many orders from this connection. Please message us on WhatsApp.');

  const existing = await env.DB.prepare('SELECT ref, ip_hash FROM orders WHERE ref = ?').bind(ref).first();
  if (existing) return existing.ip_hash === ip ? json({ ok: true, ref, repeat: true }) : fail(409, 'Order reference already used');

  const ids = [...qty.keys()];
  const { results } = await env.DB.prepare(`SELECT id, name, price FROM products WHERE deleted = 0 AND id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
  const items = results.map(p => ({ id: p.id, name: p.name, price: p.price, qty: qty.get(p.id) }));
  if (!items.length) throw new HttpError(400, 'None of these pieces are available');
  const subtotal = items.reduce((a, i) => a + (i.price || 0) * i.qty, 0);
  const free = Number(env.FREE_SHIPPING_ABOVE || 0);

  const d = b.method === 'details_form' ? (b.details || {}) : {};
  const phone = clean(d.ph, 20).replace(/[\s-]/g, '');
  if (b.method === 'details_form') {
    if (!clean(d.n) || !/^(\+?91)?[6-9]\d{9}$/.test(phone) || !clean(d.ad) || !clean(d.ct) || !/^\d{6}$/.test(clean(d.pc))) throw new HttpError(400, 'Delivery details are incomplete');
  }
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (ref, method, items, subtotal, free_ship, name, phone, address, city, pincode, note, ip_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(ref, b.method, JSON.stringify(items), subtotal, free && subtotal >= free ? 1 : 0,
        clean(d.n, 120), phone, clean(d.ad, 400), clean(d.ct, 80), clean(d.pc, 6), clean(d.nt, 600), ip),
    env.DB.prepare("INSERT INTO order_events (ref, status, by_email) VALUES (?, 'new', 'website')").bind(ref)
  ]);
  return json({ ok: true, ref, subtotal }, 201);
});
