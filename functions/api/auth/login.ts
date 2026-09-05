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

  const ip = request.headers.get('CF-Connecting-IP')?.trim() || 'desconocida';
  try {
    const intento = await env.DB.prepare('SELECT attempts, locked_until FROM login_attempts WHERE ip = ?').bind(ip).first<{ attempts: number; locked_until: string | null }>();
    if (intento?.locked_until) {
      const desbloqueo = new Date(intento.locked_until + 'Z').getTime();
      if (Number.isFinite(desbloqueo) && desbloqueo > Date.now()) {
        return json({ ok: false, error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, 429);
      }
    }
  } catch { /* si falla el control, igual se intenta el login */ }

  const admin = await env.DB.prepare('SELECT id, email, password_hash FROM admin_users WHERE email = ?').bind(email).first<{ id: string; email: string; password_hash: string }>();
  const valid = admin ? await verifyPassword(password, admin.password_hash) : false;
  if (!valid || !admin) {
    try {
      const previo = await env.DB.prepare('SELECT attempts FROM login_attempts WHERE ip = ?').bind(ip).first<{ attempts: number }>();
      const intentos = Number(previo?.attempts ?? 0) + 1;
      if (intentos >= 5) {
        await env.DB.prepare('INSERT INTO login_attempts (ip, attempts, locked_until) VALUES (?, ?, datetime(\'now\', \'+15 minutes\')) ON CONFLICT(ip) DO UPDATE SET attempts = ?, locked_until = datetime(\'now\', \'+15 minutes\')').bind(ip, intentos, intentos).run();
        return json({ ok: false, error: 'Demasiados intentos. Probá de nuevo en 15 minutos.' }, 429);
      }
      await env.DB.prepare('INSERT INTO login_attempts (ip, attempts, locked_until) VALUES (?, 1, NULL) ON CONFLICT(ip) DO UPDATE SET attempts = ?, locked_until = NULL').bind(ip, intentos).run();
    } catch { /* no se pudo registrar el intento */ }
    return json({ ok: false, error: 'Credenciales inválidas' }, 401);
  }

  try {
    await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
    await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP').run();
  } catch { /* limpieza opcional */ }

  await env.DB.prepare('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').bind(admin.id).run();
  const sessionId = await createSession(env.DB, admin.id);
  return json({ ok: true, admin: { email: admin.email } }, 200, { 'Set-Cookie': sessionCookie(sessionId, 60 * 60 * 24 * 7) });
};
