import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHIPPING_STATUSES = new Set(['preparing', 'shipped', 'delivered', 'returned']);

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id ?? '');
  if (!UUID_PATTERN.test(id)) return json({ error: 'ID inválido' }, 400);

  const order = await env.DB.prepare('SELECT id, external_reference, payment_id, status, shipping_status, tracking_number, admin_notes, customer_name, customer_email, customer_phone, shipping_department, shipping_city, shipping_address, color, quantity, amount_cents, currency, created_at, updated_at, approved_at FROM orders WHERE id = ?').bind(id).first<Record<string, unknown>>();
  if (!order) return json({ error: 'Orden no encontrada' }, 404);

  const timeline = await env.DB.prepare('SELECT event_type, payment_id, metadata_json, created_at FROM checkout_events WHERE order_id = ? ORDER BY created_at ASC').bind(id).all<{ event_type: string; payment_id: string | null; metadata_json: string | null; created_at: string }>();

  const emails = await env.DB.prepare('SELECT provider, provider_message_id, status, error_message, created_at, sent_at FROM email_deliveries WHERE order_id = ? ORDER BY created_at DESC').bind(id).all<{ provider: string; provider_message_id: string | null; status: string; error_message: string | null; created_at: string; sent_at: string | null }>();

  return json({ order, timeline: timeline.results, emails: emails.results });
};

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  const id = String(params.id ?? '');
  if (!UUID_PATTERN.test(id)) return json({ error: 'ID inválido' }, 400);

  let body: { shipping_status?: unknown; tracking_number?: unknown; admin_notes?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Datos inválidos' }, 400);
  }

  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (body.shipping_status !== undefined) {
    if (body.shipping_status === null || body.shipping_status === '') {
      updates.push('shipping_status = ?');
      bindings.push(null);
    } else if (typeof body.shipping_status === 'string' && SHIPPING_STATUSES.has(body.shipping_status)) {
      updates.push('shipping_status = ?');
      bindings.push(body.shipping_status);
    } else {
      return json({ error: 'Estado de envío inválido. Usá: preparando, despachado, entregado o devuelto.' }, 400);
    }
  }

  if (body.tracking_number !== undefined) {
    if (body.tracking_number === null || body.tracking_number === '') {
      updates.push('tracking_number = ?');
      bindings.push(null);
    } else if (typeof body.tracking_number === 'string' && body.tracking_number.length <= 80) {
      updates.push('tracking_number = ?');
      bindings.push(body.tracking_number.trim());
    } else {
      return json({ error: 'Número de seguimiento inválido.' }, 400);
    }
  }

  if (body.admin_notes !== undefined) {
    if (body.admin_notes === null) {
      updates.push('admin_notes = ?');
      bindings.push(null);
    } else if (typeof body.admin_notes === 'string' && body.admin_notes.length <= 1000) {
      updates.push('admin_notes = ?');
      bindings.push(body.admin_notes.trim());
    } else {
      return json({ error: 'Notas demasiado largas (máximo 1000 caracteres).' }, 400);
    }
  }

  if (!updates.length) return json({ error: 'Nada para actualizar.' }, 400);

  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);

  try {
    await env.DB.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), 'orders.update', 'orders', id, JSON.stringify({ shipping_status: body.shipping_status ?? null, tracking_number: body.tracking_number ?? null, admin_notes: body.admin_notes ?? null }))
      .run();
  } catch {
    return json({ error: 'No se pudo actualizar la orden.' }, 500);
  }

  return json({ ok: true });
};
