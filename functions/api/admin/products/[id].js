/* PUT    /api/admin/products/:id  — save changes
   DELETE /api/admin/products/:id  — remove from the shop (kept in the database so old orders still make sense) */
import { json, handle, readJson, productOut, now, HttpError } from '../../../../server/lib.js';
import { productFields, uniqueSlug } from '../../../../server/products.js';

const load = async (db, id) => {
  const row = await db.prepare('SELECT * FROM products WHERE id = ? AND deleted = 0').bind(id).first();
  if (!row) throw new HttpError(404, 'Product not found');
  return row;
};

export const onRequestPut = handle(async ({ request, env, params }) => {
  const row = await load(env.DB, params.id);
  const f = productFields(await readJson(request), row);
  const slug = f.slug && f.slug !== row.slug ? await uniqueSlug(env.DB, f.slug, row.id) : row.slug;
  await env.DB.prepare(`UPDATE products SET slug = ?, name = ?, description = ?, price = ?, mrp = ?, category = ?, details = ?, care = ?,
                        dispatch = ?, available = ?, media = ?, updated_at = ? WHERE id = ?`)
    .bind(slug, f.name, f.description, f.price, f.mrp, f.category, f.details, f.care, f.dispatch, f.available, f.media, now(), row.id).run();
  return json({ ok: true, product: productOut(await load(env.DB, row.id)) });
});

export const onRequestDelete = handle(async ({ env, params }) => {
  await load(env.DB, params.id);
  await env.DB.prepare('UPDATE products SET deleted = 1, updated_at = ? WHERE id = ?').bind(now(), params.id).run();
  return json({ ok: true });
});
