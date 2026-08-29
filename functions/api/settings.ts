import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

const SETTINGS_KEYS: Record<string, { type: 'number' | 'text' | 'boolean'; min?: number; max?: number; maxLength?: number }> = {
  price_cents: { type: 'number', min: 0, max: 100000000 },
  currency: { type: 'text', maxLength: 8 },
  initial_stock_visible: { type: 'number', min: 0, max: 1000000 },
  whatsapp_phone: { type: 'text', maxLength: 30 },
  owner_email: { type: 'text', maxLength: 160 },
  owner_email_enabled: { type: 'boolean' },
  buyer_from_email: { type: 'text', maxLength: 160 },
  buyer_from_name: { type: 'text', maxLength: 80 },
  owner_from_email: { type: 'text', maxLength: 160 },
  owner_from_name: { type: 'text', maxLength: 80 },
  telegram_enabled: { type: 'boolean' },
  telegram_bot_token: { type: 'text', maxLength: 200 },
  telegram_chat_id: { type: 'text', maxLength: 40 }
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const rows = await env.DB.prepare('SELECT key, value, category, description, updated_at FROM settings ORDER BY category, key').all<{ key: string; value: string; category: string; description: string | null; updated_at: string }>();
  const grouped: Record<string, Array<{ key: string; value: string; description: string | null; updated_at: string }>> = {};
  for (const row of rows.results) {
    grouped[row.category] ??= [];
    grouped[row.category].push({ key: row.key, value: row.value, description: row.description, updated_at: row.updated_at });
  }
  return json({ settings: grouped, flat: Object.fromEntries(rows.results.map((row) => [row.key, row.value])) });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  let body: { values?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Datos inválidos' }, 400);
  }
  const values = body?.values ?? {};
  if (typeof values !== 'object' || !values) return json({ error: 'Datos inválidos' }, 400);

  const updates: Array<{ key: string; value: string; previous: string | null }> = [];
  for (const [key, raw] of Object.entries(values)) {
    if (!(key in SETTINGS_KEYS)) continue;
    const spec = SETTINGS_KEYS[key];
    let normalized: string;
    if (spec.type === 'boolean') {
      normalized = raw === true || raw === 'true' ? 'true' : 'false';
    } else if (spec.type === 'number') {
      const num = Number(raw);
      if (!Number.isFinite(num) || (spec.min !== undefined && num < spec.min) || (spec.max !== undefined && num > spec.max)) {
        return json({ error: `El valor de ${key} no es válido.` }, 400);
      }
      normalized = String(Math.round(num));
    } else {
      if (typeof raw !== 'string') return json({ error: `El valor de ${key} debe ser texto.` }, 400);
      const trimmed = raw.trim();
      if (spec.maxLength && trimmed.length > spec.maxLength) return json({ error: `${key} demasiado largo.` }, 400);
      normalized = trimmed;
    }
    const previous = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
    updates.push({ key, value: normalized, previous: previous?.value ?? null });
  }

  if (!updates.length) return json({ ok: true });

  try {
    for (const update of updates) {
      await env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP').bind(update.key, update.value).run();
    }
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, details) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), 'settings.update', 'settings', JSON.stringify(updates.map((u) => ({ key: u.key, previous: u.previous, next: u.value }))))
      .run();
  } catch {
    return json({ error: 'No se pudieron guardar los cambios.' }, 500);
  }

  return json({ ok: true });
};
