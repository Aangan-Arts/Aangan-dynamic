/* POST /api/admin/images?name=card-600.webp — stores one photo size in R2 (the admin makes the sizes on the phone before uploading).
   Returns the address the website uses for it. */
import { json, handle, HttpError } from '../../../server/lib.js';

const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg' };

export const onRequestPost = handle(async ({ request, env }) => {
  const type = (request.headers.get('content-type') || '').split(';')[0];
  if (!TYPES[type]) throw new HttpError(415, 'Photos must be WebP or JPEG');
  const name = new URL(request.url).searchParams.get('name') || '';
  if (!/^[a-z0-9-]{1,40}$/.test(name)) throw new HttpError(400, 'Bad photo name');
  const body = await request.arrayBuffer();
  if (!body.byteLength || body.byteLength > 6 * 1024 * 1024) throw new HttpError(413, 'Photo too large');
  const key = `products/${new Date().toISOString().slice(0, 7)}/${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}-${name}.${TYPES[type]}`;
  await env.IMAGES.put(key, body, { httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000, immutable' } });
  const base = String(env.IMAGE_BASE_URL || '').replace(/\/?$/, '/');
  return json({ ok: true, url: env.IMAGE_BASE_URL ? base + key : 'img/' + key }, 201);
});
