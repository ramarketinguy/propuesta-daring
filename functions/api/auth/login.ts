import { createSession, sessionCookie, verifyPassword } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Datos incompletos' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return json({ ok: false, error: 'Datos incompletos' }, 400);

  const admin = await env.DB.prepare('SELECT id, email, password_hash FROM admin_users WHERE email = ?').bind(email).first<{ id: string; email: string; password_hash: string }>();
  const valid = admin ? await verifyPassword(password, admin.password_hash) : false;
  if (!valid || !admin) return json({ ok: false, error: 'Credenciales inválidas' }, 401);

  await env.DB.prepare('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').bind(admin.id).run();
  const sessionId = await createSession(env.DB, admin.id);
  return json({ ok: true, admin: { email: admin.email } }, 200, { 'Set-Cookie': sessionCookie(sessionId, 60 * 60 * 24 * 7) });
};
