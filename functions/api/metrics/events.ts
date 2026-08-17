import { normalizeEvent } from './_lib';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

const ALLOWED_KEYS = new Set(['event', 'visitor_id', 'session_id', 'page_path', 'referrer', 'device_type']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > 4096) return json({ accepted: false, error: 'Evento inválido' }, 400);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ accepted: false, error: 'Evento inválido' }, 400);
  }

  if (Object.keys(body).some((key) => !ALLOWED_KEYS.has(key))) return json({ accepted: false, error: 'Evento inválido' }, 400);
  const event = normalizeEvent(body);
  if (!event) return json({ accepted: false, error: 'Evento inválido' }, 400);

  try {
    await env.DB.prepare('INSERT INTO analytics_events (id, event_name, visitor_id, session_id, page_path, referrer, device_type) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), event.eventName, event.visitorId ?? null, event.sessionId ?? null, event.pagePath, event.referrer ?? null, event.deviceType).run();
  } catch {
    return json({ accepted: false }, 202);
  }
  return json({ accepted: true }, 202);
};
