import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id ?? '');
  if (!UUID_PATTERN.test(id)) return json({ error: 'ID inválido.' }, 400);
  const row = await env.DB.prepare('SELECT id, question, answer, sort_order, published FROM page_faq WHERE id = ?').bind(id).first<{ id: string; question: string; answer: string; sort_order: number; published: number }>();
  if (!row) return json({ error: 'Pregunta no encontrada.' }, 404);
  return json({ faq: row });
};

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  const id = String(params.id ?? '');
  if (!UUID_PATTERN.test(id)) return json({ error: 'ID inválido.' }, 400);
  let body: { question?: unknown; answer?: unknown; sort_order?: unknown; published?: unknown };
  try { body = await request.json(); }
  catch { return json({ error: 'Datos inválidos.' }, 400); }

  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (body.question !== undefined) {
    if (typeof body.question !== 'string') return json({ error: 'Pregunta inválida.' }, 400);
    const q = body.question.trim().slice(0, 240);
    if (!q) return json({ error: 'La pregunta no puede estar vacía.' }, 400);
    updates.push('question = ?'); bindings.push(q);
  }
  if (body.answer !== undefined) {
    if (typeof body.answer !== 'string') return json({ error: 'Respuesta inválida.' }, 400);
    const a = body.answer.trim().slice(0, 2000);
    if (!a) return json({ error: 'La respuesta no puede estar vacía.' }, 400);
    updates.push('answer = ?'); bindings.push(a);
  }
  if (body.sort_order !== undefined) {
    updates.push('sort_order = ?'); bindings.push(Math.max(0, Number(body.sort_order) | 0));
  }
  if (body.published !== undefined) {
    updates.push('published = ?'); bindings.push(body.published === true || body.published === 'true' ? 1 : 0);
  }

  if (!updates.length) return json({ error: 'Nada para actualizar.' }, 400);
  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);

  try {
    await env.DB.prepare(`UPDATE page_faq SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), 'faq.update', 'page_faq', id).run();
  } catch {
    return json({ error: 'No se pudo actualizar la pregunta.' }, 500);
  }
  return json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id ?? '');
  if (!UUID_PATTERN.test(id)) return json({ error: 'ID inválido.' }, 400);
  try {
    await env.DB.prepare('DELETE FROM page_faq WHERE id = ?').bind(id).run();
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), 'faq.delete', 'page_faq', id).run();
  } catch {
    return json({ error: 'No se pudo eliminar.' }, 500);
  }
  return json({ ok: true });
};
