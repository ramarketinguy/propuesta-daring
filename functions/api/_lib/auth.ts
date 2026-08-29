const SESSION_COOKIE = 'daring_session';
const PASSWORD_ITERATIONS = 100000;
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function cookieValue(cookie: string | null, name: string): string | null {
  if (!cookie) return null;
  const prefix = `${name}=`;
  const pair = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return pair ? decodeURIComponent(pair.slice(prefix.length)) : null;
}

export function parseSessionCookie(cookie: string | null): string | null {
  return cookieValue(cookie, SESSION_COOKIE);
}

export function sessionCookie(id: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(id)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return sessionCookie('', 0);
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256);
}

export async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error('Password cannot be empty');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = new Uint8Array(await derive(password, salt, PASSWORD_ITERATIONS));
  return `pbkdf2$${PASSWORD_ITERATIONS}$${base64(salt)}$${base64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, iterationText, saltText, hashText] = stored.split('$');
  const iterations = Number(iterationText);
  if (algorithm !== 'pbkdf2' || !Number.isSafeInteger(iterations) || !saltText || !hashText) return false;
  try {
    const expected = bytes(hashText);
    const actual = new Uint8Array(await derive(password, bytes(saltText), iterations));
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
    return difference === 0;
  } catch {
    return false;
  }
}

export async function createSession(db: D1Database, adminUserId: string): Promise<string> {
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await db.prepare('INSERT INTO admin_sessions (id, admin_user_id, expires_at) VALUES (?, ?, ?)').bind(id, adminUserId, expires).run();
  return id;
}

export async function getSessionAdmin(db: D1Database, request: Request): Promise<{ id: string; email: string } | null> {
  const sessionId = parseSessionCookie(request.headers.get('Cookie'));
  if (!sessionId) return null;
  const result = await db.prepare('SELECT admin_users.id, admin_users.email FROM admin_sessions JOIN admin_users ON admin_users.id = admin_sessions.admin_user_id WHERE admin_sessions.id = ? AND admin_sessions.expires_at > CURRENT_TIMESTAMP').bind(sessionId).first<{ id: string; email: string }>();
  return result ?? null;
}

export async function revokeSession(db: D1Database, request: Request): Promise<void> {
  const sessionId = parseSessionCookie(request.headers.get('Cookie'));
  if (sessionId) await db.prepare('DELETE FROM admin_sessions WHERE id = ?').bind(sessionId).run();
}
