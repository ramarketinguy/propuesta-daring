import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
}

const PRODUCT_ID = 'sarten-daring-28';
const HORAS_LIMITE = 24;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ error: 'No autorizado' }, 401);

  const viejas = await env.DB.prepare(
    `SELECT id, order_code, color FROM orders WHERE status = 'checkout_started' AND created_at < datetime('now', '-${HORAS_LIMITE} hours')`
  ).all<{ id: string; order_code: string | null; color: string }>();

  let liberadas = 0;
  const codigos: string[] = [];
  for (const orden of viejas.results ?? []) {
    const cambio = await env.DB.prepare(
      "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'checkout_started'"
    ).bind(orden.id).run();
    if (!cambio.meta.changes) continue;
    await env.DB.prepare('UPDATE product_colors SET stock_reserved = MAX(0, stock_reserved - 1) WHERE product_id = ? AND color = ?').bind(PRODUCT_ID, orden.color).run();
    await env.DB.prepare('INSERT INTO stock_movements (id, product_id, quantity, reason, order_id) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), PRODUCT_ID, -1, `reserva vencida liberada (${orden.color})`, orden.id).run();
    await env.DB.prepare('INSERT INTO checkout_events (id, order_id, event_type) VALUES (?, ?, ?)').bind(crypto.randomUUID(), orden.id, 'reservation_expired').run();
    liberadas++;
    if (orden.order_code) codigos.push(orden.order_code);
  }

  await env.DB.prepare('INSERT INTO audit_log (id, action, entity, details) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), 'stock.release', 'orders', JSON.stringify({ released: liberadas, order_codes: codigos })).run();

  return json({ ok: true, released: liberadas, order_codes: codigos });
};
