import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const sections = await env.DB.prepare('SELECT id, key, section, label, type, value, sort_order, updated_at FROM page_content ORDER BY section, sort_order, key').all<{ id: string; key: string; section: string; label: string; type: string; value: string | null; sort_order: number; updated_at: string }>();
  const grouped: Record<string, Array<{ id: string; key: string; label: string; type: string; value: string | null; updated_at: string }>> = {};
  for (const row of sections.results) {
    grouped[row.section] ??= [];
    grouped[row.section].push({ id: row.id, key: row.key, label: row.label, type: row.type, value: row.value, updated_at: row.updated_at });
  }
  const flat: Record<string, string | null> = {};
  for (const row of sections.results) flat[row.key] = row.value;
  return json({ sections: grouped, flat });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  let body: { values?: Record<string, unknown> };
  try { body = await request.json(); }
  catch { return json({ error: 'Datos inválidos.' }, 400); }
  const values = body?.values;
  if (!values || typeof values !== 'object') return json({ error: 'Datos inválidos.' }, 400);

  const updates: Array<{ key: string; value: string | null; previous: string | null }> = [];
  for (const [key, raw] of Object.entries(values)) {
    const row = await env.DB.prepare('SELECT type FROM page_content WHERE key = ?').bind(key).first<{ type: string }>();
    if (!row) continue;
    let normalized: string | null = null;
    if (raw === null || raw === '') normalized = null;
    else if (typeof raw === 'string') normalized = raw;
    else normalized = String(raw);
    if (row.type === 'text' && normalized && normalized.length > 500) return json({ error: `El campo "${key}" supera los 500 caracteres.` }, 400);
    if (row.type === 'textarea' && normalized && normalized.length > 2000) return json({ error: `El campo "${key}" supera los 2000 caracteres.` }, 400);
    if (row.type === 'number' && normalized !== null) {
      const num = Number(normalized);
      if (!Number.isFinite(num)) return json({ error: `El campo "${key}" debe ser numérico.` }, 400);
      normalized = String(num);
    }
    const previous = await env.DB.prepare('SELECT value FROM page_content WHERE key = ?').bind(key).first<{ value: string | null }>();
    updates.push({ key, value: normalized, previous: previous?.value ?? null });
  }

  if (!updates.length) return json({ ok: true });
  try {
    for (const update of updates) {
      await env.DB.prepare('UPDATE page_content SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').bind(update.value, update.key).run();
    }
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, details) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), 'page_content.update', 'page_content', JSON.stringify(updates.map((u) => ({ key: u.key, previous: u.previous, next: u.value }))))
      .run();
  } catch {
    return json({ error: 'No se pudieron guardar los cambios.' }, 500);
  }
  return json({ ok: true });
};
