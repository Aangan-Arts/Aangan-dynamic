/* GET /img/… — serves product photos from R2. Used until a custom image domain (IMAGE_BASE_URL) is set up;
   with one set, photos go straight from R2 and never touch this code. */
export async function onRequestGet({ env, params, request }) {
  const key = (params.path || []).join('/');
  if (!/^products\/[A-Za-z0-9/_.\-]+$/.test(key)) return new Response('Not found', { status: 404 });
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  const res = new Response(obj.body, { headers });
  try { await cache.put(request, res.clone()); } catch (_) { }
  return res;
}
