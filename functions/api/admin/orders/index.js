/* GET /api/admin/orders?status=new&q=priya — newest first, with a count for every status */
import { json, handle, parseJson } from '../../../../server/lib.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const u = new URL(request.url), status = u.searchParams.get('status') || '', q = (u.searchParams.get('q') || '').trim();
  const where = [], args = [];
  if (status) { where.push('status = ?'); args.push(status); }
  if (q) { where.push('(ref LIKE ? OR name LIKE ? OR phone LIKE ? OR city LIKE ?)'); const like = `%${q}%`; args.push(like, like, like, like); }
  const sql = `SELECT ref, created_at, updated_at, status, method, items, subtotal, free_ship, name, phone, city, pincode
               FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 200`;
  const [{ results }, counts] = await Promise.all([
    env.DB.prepare(sql).bind(...args).all(),
    env.DB.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all()
  ]);
  return json({ ok: true, orders: results.map(o => ({ ...o, items: parseJson(o.items, []) })), counts: Object.fromEntries(counts.results.map(c => [c.status, c.n])) });
});
