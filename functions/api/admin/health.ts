import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  return json({ ok: true, admin });
};
