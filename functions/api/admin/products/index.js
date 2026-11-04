/* GET  /api/admin/products  — all products (including unavailable), plus how many changes are not live yet
   POST /api/admin/products  — add a product */
import { json, handle, readJson, productOut, now } from '../../../../server/lib.js';
import { productFields, uniqueSlug } from '../../../../server/products.js';

export const onRequestGet = handle(async ({ env }) => {
  const [{ results }, last] = await Promise.all([
    env.DB.prepare('SELECT * FROM products WHERE deleted = 0 ORDER BY sort, created_at, id').all(),
    env.DB.prepare("SELECT value FROM settings WHERE key = 'last_publish_at'").first()
  ]);
  const since = last ? last.value : '1970-01-01T00:00:00Z';
  const pending = await env.DB.prepare('SELECT COUNT(*) AS n FROM products WHERE updated_at > ?').bind(since).first();
  return json({ ok: true, products: results.map(productOut), pending: pending.n, lastPublishAt: since });
});

export const onRequestPost = handle(async ({ request, env }) => {
  const f = productFields(await readJson(request));
  const id = 'P' + Date.now().toString(36).toUpperCase();
  const slug = await uniqueSlug(env.DB, f.slug || f.name);
  const top = await env.DB.prepare('SELECT COALESCE(MIN(sort), 0) - 1 AS s FROM products').first();   // new pieces show first
  const t = now();
  await env.DB.prepare(`INSERT INTO products (id, slug, name, description, price, mrp, category, details, care, dispatch, available, sort, media, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, slug, f.name, f.description, f.price, f.mrp, f.category, f.details, f.care, f.dispatch, f.available, top.s, f.media, t, t).run();
  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  return json({ ok: true, product: productOut(row) }, 201);
});
