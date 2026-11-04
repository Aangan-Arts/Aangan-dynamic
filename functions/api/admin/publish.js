/* POST /api/admin/publish — rebuilds the website with the latest products (takes about 1–2 minutes).
   Uses the Cloudflare Pages deploy hook saved as the DEPLOY_HOOK_URL secret. */
import { json, fail, handle, now } from '../../../server/lib.js';

export const onRequestPost = handle(async ({ env }) => {
  if (!env.DEPLOY_HOOK_URL) return fail(500, 'Publishing is not set up yet (DEPLOY_HOOK_URL is missing).');
  const r = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
  if (!r.ok) return fail(502, 'Cloudflare did not accept the publish request. Please try again in a minute.');
  const t = now();
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('last_publish_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(t).run();
  return json({ ok: true, publishedAt: t });
});
