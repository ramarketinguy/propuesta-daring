import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action')?.trim() ?? '';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '30')));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (action) {
    conditions.push('action LIKE ?');
    bindings.push(action + '%');
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await env.DB.prepare(`SELECT id, action, entity, entity_id, details, created_at FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...bindings, limit, offset).all<{ id: string; action: string; entity: string; entity_id: string | null; details: string | null; created_at: string }>();
  const total = await env.DB.prepare(`SELECT COUNT(*) AS total FROM audit_log ${where}`).bind(...bindings).first<{ total: number }>();

  const actions = await env.DB.prepare('SELECT DISTINCT action FROM audit_log ORDER BY action').all<{ action: string }>();

  return json({ entries: rows.results, page, limit, total: total?.total ?? 0, actions: actions.results.map((a) => a.action) });
};
