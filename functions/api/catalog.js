/* GET /api/catalog — every live product, in shop order. Read by the website build (tools/build-products.js). */
import { json, handle, productOut } from '../../server/lib.js';

export const onRequestGet = handle(async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM products WHERE deleted = 0 ORDER BY sort, created_at, id').all();
  return json({ ok: true, products: results.map(productOut) }, 200, { 'cache-control': 'no-store' });
});
