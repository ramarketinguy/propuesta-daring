import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
  MERCADOPAGO_ACCESS_TOKEN?: string;
}

const ALLOWED_COLORS = new Set(['rojo', 'negro']);

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return json({ error: 'El checkout todavía no está configurado.' }, 503);

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > 4096) return json({ error: 'Datos inválidos.' }, 400);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Datos inválidos.' }, 400);
  }

  const name = clean(body.nombre, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.telefono, 40);
  const department = clean(body.departamento, 80);
  const city = clean(body.localidad, 120);
  const address = clean(body.direccion, 240);
  const color = clean(body.color, 20).toLowerCase();

  if (!name || !phone || !department || !city || !address) return json({ error: 'Faltan completar datos del formulario.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'El correo electrónico no es válido.' }, 400);
  if (!ALLOWED_COLORS.has(color)) return json({ error: 'Elegí un color de sartén.' }, 400);

  const priceRow = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('price_cents').first<{ value: string }>();
  const currencyRow = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('currency').first<{ value: string }>();
  const amountCents = priceRow ? Number(priceRow.value) : 159000;
  const currency = currencyRow?.value ?? 'UYU';
  const unitPrice = amountCents / 100;

  const orderId = crypto.randomUUID();
  const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let orderCode = '';
  for (let intento = 0; intento < 5 && !orderCode; intento++) {
    const aleatorio = crypto.getRandomValues(new Uint8Array(6));
    const candidato = 'DR-' + Array.from(aleatorio, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('');
    const existente = await env.DB.prepare('SELECT id FROM orders WHERE order_code = ?').bind(candidato).first();
    if (!existente) orderCode = candidato;
  }
  if (!orderCode) orderCode = 'DR-' + orderId.slice(0, 6).toUpperCase();
  const origin = new URL(request.url).origin;
  const isLocalOrigin = origin.startsWith('http://');
  const publicOrigin = isLocalOrigin ? 'https://example.com' : origin;

  const stockRow = await env.DB.prepare('SELECT stock_total - stock_sold - stock_reserved AS available FROM product_colors WHERE product_id = ? AND color = ?').bind('sarten-daring-28', color).first<{ available: number }>();
  if (stockRow && stockRow.available <= 0) {
    return json({ error: `Nos quedamos sin stock del color ${color}. Escribinos por WhatsApp y te anotamos para la próxima.` }, 409);
  }

  try {
    await env.DB.prepare('INSERT INTO orders (id, external_reference, order_code, status, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_department, color, quantity, amount_cents, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(orderId, orderId, orderCode, 'checkout_started', name, email, phone, address, city, department, color, 1, amountCents, currency)
      .run();
  } catch {
    return json({ error: 'No se pudo registrar la orden. Probá de nuevo.' }, 500);
  }

  const preference: Record<string, unknown> = {
    items: [{
      id: 'sarten-daring-28',
      title: `Sartén Daring 28 cm (${color})`,
      description: 'Sartén Daring 28 cm con tapa de vidrio templado',
      category_id: 'home',
      quantity: 1,
      currency_id: currency,
      unit_price: unitPrice
    }],
    payer: { name, email, phone: { number: phone } },
    back_urls: {
      success: `${publicOrigin}/?pago=aprobado`,
      pending: `${publicOrigin}/?pago=pendiente`,
      failure: `${publicOrigin}/?pago=rechazado`
    },
    auto_return: 'approved',
    external_reference: orderId,
    statement_descriptor: 'DARING',
    metadata: { department, city, address, phone }
  };
  if (!isLocalOrigin) preference.notification_url = `${origin}/api/webhooks/mercadopago`;

  let preferenceId = '';
  let initPoint = '';
  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preference)
    });
    const data = await response.json() as { id?: string; init_point?: string; sandbox_init_point?: string };
    if (!response.ok || !data.id) {
      await env.DB.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('cancelled', orderId).run();
      return json({ error: 'No se pudo iniciar el pago. Probá de nuevo en unos minutos.' }, 502);
    }
    preferenceId = data.id;
    initPoint = data.init_point ?? data.sandbox_init_point ?? '';
  } catch {
    await env.DB.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('cancelled', orderId).run();
    return json({ error: 'No se pudo iniciar el pago. Probá de nuevo en unos minutos.' }, 502);
  }

  if (!initPoint) {
    await env.DB.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('cancelled', orderId).run();
    return json({ error: 'No se pudo iniciar el pago. Probá de nuevo en unos minutos.' }, 502);
  }

  try {
    await env.DB.prepare('UPDATE product_colors SET stock_reserved = stock_reserved + 1 WHERE product_id = ? AND color = ?').bind('sarten-daring-28', color).run();
    await env.DB.prepare('INSERT INTO stock_movements (id, product_id, quantity, reason, order_id) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), 'sarten-daring-28', 1, `reserva: checkout iniciado (${color})`, orderId)
      .run();
  } catch {
    return json({ init_point: initPoint }, 201);
  }

  try {
    await env.DB.prepare('INSERT INTO checkout_events (id, order_id, event_type, metadata_json) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), orderId, 'checkout_started', JSON.stringify({ preference_id: preferenceId }))
      .run();
  } catch {
    return json({ init_point: initPoint }, 201);
  }

  return json({ init_point: initPoint }, 201);
};
