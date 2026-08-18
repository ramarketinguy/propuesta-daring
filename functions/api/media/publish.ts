import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  const body = await request.json<{ id?: string; published?: boolean }>().catch(() => ({}));
  if (!body.id || typeof body.published !== 'boolean') return json({ ok: false, error: 'Datos inválidos' }, 400);
  await env.DB.prepare('UPDATE media_assets SET published = ? WHERE id = ?').bind(body.published ? 1 : 0, body.id).run();
  return json({ ok: true, published: body.published });
};
