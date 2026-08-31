import { json } from '../../_lib/response';
import { sincronizarPago } from '../../_lib/mp-sync';

interface Env {
  DB: D1Database;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  RESEND_API_KEY?: string;
  MEDIA: R2Bucket;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const onRequestPost: PagesFunction<Env> = async ({ params, request, env }) => {
  const id = String(params.id ?? '');
  if (!UUID_PATTERN.test(id)) return json({ error: 'ID inválido' }, 400);

  const order = await env.DB.prepare('SELECT id, status, payment_id FROM orders WHERE id = ?').bind(id).first<{ id: string; status: string; payment_id: string | null }>();
  if (!order) return json({ error: 'Venta no encontrada.' }, 404);
  if (!order.payment_id) return json({ error: 'Esta venta todavía no tiene un pago de Mercado Pago asociado.' }, 400);

  const origin = new URL(request.url).origin;
  const resultado = await sincronizarPago(env, origin, order.payment_id);
  if (!resultado.ok) return json({ error: resultado.error }, 502);

  const actualizada = await env.DB.prepare('SELECT id, status, payment_id, approved_at, updated_at FROM orders WHERE id = ?').bind(id).first<{ id: string; status: string; payment_id: string | null; approved_at: string | null; updated_at: string }>();
  return json({ ok: true, previous: resultado.previous, current: resultado.current, changed: resultado.changed, order: actualizada });
};
