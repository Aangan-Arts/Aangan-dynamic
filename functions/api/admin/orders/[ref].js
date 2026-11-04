/* GET   /api/admin/orders/:ref — one order with its history
   PATCH /api/admin/orders/:ref — change status and/or your private note */
import { json, handle, readJson, parseJson, clean, now, ORDER_STATUSES, HttpError } from '../../../../server/lib.js';

const one = async (db, ref) => {
  const o = await db.prepare('SELECT * FROM orders WHERE ref = ?').bind(ref).first();
  if (!o) throw new HttpError(404, 'Order not found');
  const { results } = await db.prepare('SELECT at, status, by_email FROM order_events WHERE ref = ? ORDER BY id').bind(ref).all();
  const { ip_hash, ...rest } = o;
  return { ...rest, items: parseJson(o.items, []), events: results };
};

export const onRequestGet = handle(async ({ env, params }) => json({ ok: true, order: await one(env.DB, params.ref) }));

export const onRequestPatch = handle(async ({ request, env, params, data }) => {
  const o = await one(env.DB, params.ref), b = await readJson(request);
  const steps = [];
  if (b.status != null && b.status !== o.status) {
    if (!ORDER_STATUSES.includes(b.status)) throw new HttpError(400, 'Unknown status');
    steps.push(env.DB.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE ref = ?').bind(b.status, now(), o.ref));
    steps.push(env.DB.prepare('INSERT INTO order_events (ref, status, by_email) VALUES (?, ?, ?)').bind(o.ref, b.status, data.email || ''));
  }
  if (b.admin_note != null) steps.push(env.DB.prepare('UPDATE orders SET admin_note = ?, updated_at = ? WHERE ref = ?').bind(clean(b.admin_note, 2000), now(), o.ref));
  if (steps.length) await env.DB.batch(steps);
  return json({ ok: true, order: await one(env.DB, o.ref) });
});
