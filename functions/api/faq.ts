import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const rows = await env.DB.prepare('SELECT id, question, answer, sort_order, published, updated_at FROM page_faq ORDER BY sort_order, created_at').all<{ id: string; question: string; answer: string; sort_order: number; published: number; updated_at: string }>();
  return json({ faq: rows.results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { question?: unknown; answer?: unknown; sort_order?: unknown };
  try { body = await request.json(); }
  catch { return json({ error: 'Datos inválidos.' }, 400); }
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 240) : '';
  const answer = typeof body.answer === 'string' ? body.answer.trim().slice(0, 2000) : '';
  const sortOrder = Math.max(0, Number(body.sort_order ?? 0) | 0);
  if (!question || !answer) return json({ error: 'La pregunta y la respuesta son obligatorias.' }, 400);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO page_faq (id, question, answer, sort_order, published) VALUES (?, ?, ?, ?, 1)').bind(id, question, answer, sortOrder).run();
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), 'faq.create', 'page_faq', id, JSON.stringify({ question })).run();
  } catch {
    return json({ error: 'No se pudo crear la pregunta.' }, 500);
  }
  return json({ ok: true, id }, 201);
};
