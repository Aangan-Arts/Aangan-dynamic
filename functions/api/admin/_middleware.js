/* Every /api/admin request must come from someone signed in through Cloudflare Access. */
import { fail, adminEmail } from '../../../server/lib.js';

export async function onRequest(ctx) {
  let email = null;
  try { email = await adminEmail(ctx.request, ctx.env); } catch (e) { console.error('access check failed', e); }
  if (!email) return fail(401, 'Please sign in to the admin.');
  ctx.data.email = email;
  return ctx.next();
}
