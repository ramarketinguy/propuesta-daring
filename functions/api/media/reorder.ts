import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  const body = await request.json<{ id?: string; sort_order?: number }>().catch(() => ({}));
  const sortOrder = Number(body.sort_order);
  if (!body.id || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) return json({ ok: false, error: 'Datos inválidos' }, 400);
  await env.DB.prepare('UPDATE media_assets SET sort_order = ? WHERE id = ?').bind(sortOrder, body.id).run();
  return json({ ok: true, sort_order: sortOrder });
};
