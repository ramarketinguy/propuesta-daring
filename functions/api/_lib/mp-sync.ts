import { json } from './response';

interface Env {
  DB: D1Database;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  RESEND_API_KEY?: string;
  MEDIA: R2Bucket;
}

export interface OrderRow {
  id: string;
  order_code: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_department: string | null;
  shipping_city: string | null;
  shipping_address: string | null;
  color: string;
  amount_cents: number;
}

export interface EmailResult {
  ok: boolean;
  messageId: string;
  error: string;
}

export interface SyncResult {
  ok: boolean;
  previous: string;
  current: string;
  changed: boolean;
  orderId: string;
  error: string;
}

const STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  authorized: 'pending',
  pending: 'pending',
  in_process: 'pending',
  in_mediation: 'pending',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
  charged_back: 'refunded'
};

const EVENT_MAP: Record<string, string> = {
  approved: 'payment_approved',
  authorized: 'payment_pending',
  pending: 'payment_pending',
  in_process: 'payment_pending',
  in_mediation: 'payment_pending',
  rejected: 'payment_rejected',
  cancelled: 'payment_cancelled',
  refunded: 'payment_refunded',
  charged_back: 'payment_refunded'
};

const PDF_KEY = 'entregables/recetario-pizza-daring.pdf';
const VIDEO_KEY = 'entregables/video-armado-daring.mp4';

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function escapeHTML(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildBuyerEmailHTML(order: OrderRow, origin: string, hasVideo: boolean, waPhone: string = '59899695118'): string {
  const nombre = escapeHTML(order.customer_name.split(' ')[0]);
  const codigoCompra = escapeHTML(order.order_code ?? order.id);
  const recetarioLink = `${origin}/api/descargas/recetario?orden=${order.id}`;
  const videoLink = `${origin}/api/descargas/video-armado?orden=${order.id}`;
  const videoBlock = hasVideo
    ? `<tr>
         <td style="padding:14px 18px;background:#241418;border:1px solid rgba(229,138,149,.35);border-radius:12px">
           <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#f6eced">Video de armado paso a paso</p>
           <a href="${videoLink}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:999px;font-weight:bold;font-size:13px">Descargar video</a>
         </td>
       </tr>`
    : '';
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#0d080a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1c0f13;border:1px solid rgba(229,138,149,.35);border-radius:16px">
  <tr><td style="padding:24px 28px 10px" align="center">
    <img src="https://daring.com.uy/assets/Logo%20Daring%20(1).png" width="150" alt="Daring" style="display:block;margin:0 auto">
  </td></tr>
  <tr><td style="padding:0 28px">
    <h1 style="margin:0 0 6px;font-size:22px;color:#f6eced;font-weight:bold">Gracias por tu compra, ${nombre}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#b3a3a7">Sartén Daring 28 cm · Color: <strong style="color:#f6eced">${escapeHTML(order.color)}</strong> · <strong style="color:#f6eced">$ ${(order.amount_cents / 100).toLocaleString('es-UY')}</strong></p>
  </td></tr>
  <tr><td style="padding:0 18px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:14px 18px;background:#241418;border:1px solid rgba(229,138,149,.35);border-radius:12px">
          <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#f6eced">Tu recetario de la Pizza Daring</p>
          <a href="${recetarioLink}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:999px;font-weight:bold;font-size:13px">Descargar recetario</a>
        </td>
      </tr>
      <tr><td style="height:10px;font-size:0">&nbsp;</td></tr>
      ${videoBlock}
    </table>
  </td></tr>
  <tr><td style="padding:6px 18px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(229,138,149,.12);border-left:3px solid #e58a95;border-radius:12px">
      <tr><td style="padding:16px 18px">
        <p style="margin:0 0 10px;font-size:15px;font-weight:bold;color:#e58a95">Cuidados de tu sartén</p>
        <p style="margin:0 0 8px;font-size:13px;color:#f6eced;line-height:1.5"><strong>• Limpieza:</strong> dejala enfriar antes de lavar. Lavala a mano con agua tibia, detergente suave y esponja suave.</p>
        <p style="margin:0 0 8px;font-size:13px;color:#f6eced;line-height:1.5"><strong>• Nunca uses:</strong> virulanas, productos abrasivos ni utensilios metálicos.</p>
        <p style="margin:0 0 8px;font-size:13px;color:#f6eced;line-height:1.5"><strong>• Al cocinar:</strong> fuego medio y utensilios de silicona, madera o nylon. Con el antiadherente alcanzó con muy poco aceite.</p>
        <p style="margin:0 0 8px;font-size:13px;color:#f6eced;line-height:1.5"><strong>• Al guardarla:</strong> si apilás ollas encima, poné un paño o separador para que no se raye.</p>
        <p style="margin:0;font-size:13px;color:#f6eced;line-height:1.5"><strong>• Compatibilidad:</strong> gas, eléctricas, anafe y garrafa. No es apta para inducción ni fuego abierto.</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:4px 28px 8px">
    <p style="margin:0;font-size:12px;color:#b3a3a7;line-height:1.5">Despacho en 24 horas · Entrega en 24 a 72 horas por Mercado Envíos · Envío incluido en el precio</p>
  </td></tr>
  <tr><td style="padding:0 28px 24px">
    <hr style="border:none;border-top:1px solid rgba(229,138,149,.25);margin:0 0 12px">
    <p style="margin:0 0 12px;font-size:13px;color:#f6eced">Ante cualquier consulta, nuestro equipo está a tu disposición:</p>
    <a href="https://wa.me/${escapeHTML(waPhone)}?text=${encodeURIComponent('Hola! Tengo una consulta sobre mi sartén Daring, compra ' + (order.order_code ?? order.id))}" style="display:inline-block;background:#25d366;color:#0d080a;text-decoration:none;padding:10px 26px;border-radius:999px;font-weight:bold;font-size:13px">Escribinos por WhatsApp</a>
    <p style="margin:14px 0 0;font-size:11px;color:#7a6e72">Compra ${codigoCompra}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildOwnerEmailHTML(order: OrderRow, paymentId: string, buyerEmailOk: boolean): string {
  const fila = (titulo: string, valor: string): string =>
    `<tr><td style="padding:6px 10px;border:1px solid #eee2e0;font-weight:bold;background:#faf5f4">${titulo}</td><td style="padding:6px 10px;border:1px solid #eee2e0">${escapeHTML(valor)}</td></tr>`;
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f7f2f0;font-family:Arial,Helvetica,sans-serif;color:#2b1a1d">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f0dcd9;border-radius:16px;padding:32px">
<p style="margin:0 0 16px;font-size:13px;letter-spacing:2px;color:#c8102e;font-weight:bold">DARING · VENTAS</p>
<h1 style="font-size:20px;margin:0 0 12px">Nueva venta aprobada</h1>
<p style="margin:0 0 16px;font-size:14px">Entró un pago aprobado de <strong>${escapeHTML(order.customer_name)}</strong>. Detalle completo de la orden:</p>
<table style="border-collapse:collapse;width:100%;font-size:13px">
${fila('Cliente', order.customer_name)}
${fila('Correo', order.customer_email)}
${fila('Teléfono', order.customer_phone ?? '-')}
${fila('Departamento', order.shipping_department ?? '-')}
${fila('Localidad', order.shipping_city ?? '-')}
${fila('Dirección', order.shipping_address ?? '-')}
${fila('Color elegido', order.color)}
${fila('Producto', 'Sartén Daring 28 cm')}
${fila('Total', `$ ${(order.amount_cents / 100).toLocaleString('es-UY')}`)}
${fila('N° de orden', order.id)}
${fila('Pago Mercado Pago', paymentId)}
${fila('Mail al comprador', buyerEmailOk ? 'enviado con recetario y video' : 'FALLO el envío: revisar email_deliveries en la base')}
</table>
<p style="margin:16px 0 0;font-size:12px;color:#8a6d70">Recordatorio: coordinar el despacho por Mercado Envíos dentro de las 24 horas.</p>
</div></body></html>`;
}

export async function getSetting(env: Env, key: string): Promise<string | null> {
  try {
    const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function enviarTelegram(env: Env, texto: string): Promise<void> {
  try {
    const enabled = (await getSetting(env, 'telegram_enabled')) ?? 'false';
    if (enabled !== 'true') return;
    const token = await getSetting(env, 'telegram_bot_token');
    const chatId = await getSetting(env, 'telegram_chat_id');
    if (!token || !chatId) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto })
    });
  } catch {
    return;
  }
}

function reemplazarTokens(html: string, tokens: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

async function sendEmail(env: Env, payload: Record<string, unknown>): Promise<EmailResult> {
  if (!env.RESEND_API_KEY) return { ok: false, messageId: '', error: 'RESEND_API_KEY no configurada' };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json() as { id?: string; message?: string };
    if (!response.ok) return { ok: false, messageId: '', error: data.message ?? `HTTP ${response.status}` };
    return { ok: true, messageId: data.id ?? '', error: '' };
  } catch (error) {
    return { ok: false, messageId: '', error: error instanceof Error ? error.message : 'error de red' };
  }
}

async function enviarEmailComprador(env: Env, origin: string, order: OrderRow): Promise<EmailResult> {
  let hasVideo = false;
  try {
    hasVideo = Boolean(await env.MEDIA.head(VIDEO_KEY));
  } catch {
    hasVideo = false;
  }

  const fromEmail = (await getSetting(env, 'buyer_from_email')) ?? 'recetario@daring.com.uy';
  const fromName = (await getSetting(env, 'buyer_from_name')) ?? 'Daring';
  const waPhone = (await getSetting(env, 'whatsapp_phone')) ?? '59899695118';
  const videoLink = `${origin}/api/descargas/video-armado?orden=${order.id}`;
  const nombre = order.customer_name.split(' ')[0];

  let html: string;
  const plantilla = await getSetting(env, 'buyer_email_html');
  if (plantilla && plantilla.trim()) {
    html = reemplazarTokens(plantilla, {
      nombre,
      color: order.color,
      orden: order.order_code ?? order.id,
      video_link: videoLink,
      video: hasVideo
        ? `<p style="margin:0 0 10px">También grabamos un <strong>video paso a paso</strong> para el primer uso de tu sartén:</p><p style="margin:0 0 10px"><a href="${videoLink}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold">Descargar video de armado</a></p>`
        : ''
    });
  } else {
    html = buildBuyerEmailHTML(order, origin, hasVideo, waPhone);
  }

  const subjectPlantilla = await getSetting(env, 'buyer_email_subject');
  const subject = subjectPlantilla && subjectPlantilla.trim()
    ? reemplazarTokens(subjectPlantilla, { nombre, color: order.color })
    : '¡Gracias por tu compra! Tu recetario y el video de armado';

  return sendEmail(env, {
    from: `${fromName} <${fromEmail}>`,
    to: [order.customer_email],
    subject,
    html
  });
}

async function enviarEmailDueno(env: Env, order: OrderRow, paymentId: string, buyerEmailOk: boolean): Promise<EmailResult | null> {
  const enabled = (await getSetting(env, 'owner_email_enabled')) ?? 'true';
  if (enabled !== 'true') return null;
  const ownerEmail = (await getSetting(env, 'owner_email')) ?? 'irineomadrid.daring@gmail.com';
  const fromEmail = (await getSetting(env, 'owner_from_email')) ?? 'ventas@daring.com.uy';
  const fromName = (await getSetting(env, 'owner_from_name')) ?? 'Daring Ventas';

  let html: string;
  const plantilla = await getSetting(env, 'owner_email_html');
  if (plantilla && plantilla.trim()) {
    html = reemplazarTokens(plantilla, {
      cliente: order.customer_name,
      mail: order.customer_email,
      telefono: order.customer_phone ?? '-',
      departamento: order.shipping_department ?? '-',
      localidad: order.shipping_city ?? '-',
      direccion: order.shipping_address ?? '-',
      color: order.color,
      total: `$ ${(order.amount_cents / 100).toLocaleString('es-UY')}`,
      orden: order.order_code ?? order.id,
      pago: paymentId,
      estado_mail: buyerEmailOk ? 'enviado al comprador' : 'FALLO el envío al comprador'
    });
  } else {
    html = buildOwnerEmailHTML(order, paymentId, buyerEmailOk);
  }

  const subjectPlantilla = await getSetting(env, 'owner_email_subject');
  const subject = subjectPlantilla && subjectPlantilla.trim()
    ? reemplazarTokens(subjectPlantilla, { color: order.color, cliente: order.customer_name })
    : `Nueva venta aprobada — Sartén Daring color ${order.color}`;

  return sendEmail(env, {
    from: `${fromName} <${fromEmail}>`,
    to: [ownerEmail],
    subject,
    html
  });
}

async function registrarEmail(env: Env, orderId: string, provider: string, result: EmailResult): Promise<void> {
  try {
    await env.DB.prepare('INSERT INTO email_deliveries (id, order_id, provider, provider_message_id, status, error_message, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), orderId, provider, result.messageId || null, result.ok ? 'sent' : 'failed', result.error || null, result.ok ? new Date().toISOString() : null)
      .run();
  } catch {
    return;
  }
}

const PRODUCT_ID = 'sarten-daring-28';

async function ajustarStock(env: Env, color: string, campo: 'stock_reserved' | 'stock_sold', delta: number, reason: string, orderId: string): Promise<void> {
  try {
    if (campo === 'stock_reserved') {
      await env.DB.prepare('UPDATE product_colors SET stock_reserved = MAX(0, stock_reserved + ?) WHERE product_id = ? AND color = ?').bind(delta, PRODUCT_ID, color).run();
    } else {
      await env.DB.prepare('UPDATE product_colors SET stock_sold = MAX(0, stock_sold + ?) WHERE product_id = ? AND color = ?').bind(delta, PRODUCT_ID, color).run();
    }
    await env.DB.prepare('INSERT INTO stock_movements (id, product_id, quantity, reason, order_id) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), PRODUCT_ID, delta, reason, orderId)
      .run();
  } catch {
    return;
  }
}

async function aplicarMovimientoStock(env: Env, orderId: string, color: string, oldStatus: string, newStatus: string): Promise<void> {
  if (!color) return;
  if (newStatus === 'approved' && oldStatus !== 'approved') {
    await ajustarStock(env, color, 'stock_reserved', -1, `venta aprobada: reserva convertida en venta (${color})`, orderId);
    await ajustarStock(env, color, 'stock_sold', 1, `venta aprobada (${color})`, orderId);
    return;
  }
  if (newStatus === 'refunded' && oldStatus === 'approved') {
    await ajustarStock(env, color, 'stock_sold', -1, `reembolso: venta devuelta al stock (${color})`, orderId);
    return;
  }
  if ((newStatus === 'rejected' || newStatus === 'cancelled') && (oldStatus === 'checkout_started' || oldStatus === 'pending')) {
    await ajustarStock(env, color, 'stock_reserved', -1, `reserva liberada: pago no concretado (${color})`, orderId);
  }
}

export async function sincronizarPago(env: Env, origin: string, paymentId: string): Promise<SyncResult> {
  const token = env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return { ok: false, previous: '', current: '', changed: false, orderId: '', error: 'MERCADOPAGO_ACCESS_TOKEN no configurada' };

  let status = '';
  let reference = '';
  let feeCents = 0;
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return { ok: false, previous: '', current: '', changed: false, orderId: '', error: `Mercado Pago respondió HTTP ${response.status}` };
    const payment = await response.json() as { status?: string; external_reference?: string; fee_details?: Array<{ type?: string; amount?: number }> };
    status = STATUS_MAP[payment.status ?? ''] ?? 'pending';
    reference = payment.external_reference ?? '';
    feeCents = Math.round((Array.isArray(payment.fee_details) ? payment.fee_details : [])
      .filter((f) => f.type === 'fee')
      .reduce((total, f) => total + (Number(f.amount) || 0), 0) * 100);
  } catch (error) {
    return { ok: false, previous: '', current: '', changed: false, orderId: '', error: error instanceof Error ? error.message : 'error de red con Mercado Pago' };
  }

  if (!reference) return { ok: false, previous: '', current: '', changed: false, orderId: '', error: 'El pago no tiene orden asociada en esta tienda.' };

  const previous = await env.DB.prepare('SELECT id, status, color, order_code FROM orders WHERE external_reference = ?').bind(reference).first<{ id: string; status: string; color: string; order_code: string | null }>();
  if (!previous) return { ok: false, previous: '', current: '', changed: false, orderId: '', error: 'El pago no pertenece a esta tienda.' };

  const oldStatus = previous.status;
  const eventType = EVENT_MAP[status === 'pending' ? 'pending' : status] ?? 'payment_pending';

  try {
    await env.DB.prepare('UPDATE orders SET status = ?, payment_id = ?, mp_fee_cents = ?, updated_at = CURRENT_TIMESTAMP, approved_at = CASE WHEN ? = ? THEN CURRENT_TIMESTAMP ELSE approved_at END WHERE id = ?')
      .bind(status, paymentId, feeCents, status, 'approved', previous.id)
      .run();

    if (oldStatus !== status) {
      await aplicarMovimientoStock(env, previous.id, previous.color, oldStatus, status);
    }

    const existingEvent = await env.DB.prepare('SELECT id FROM checkout_events WHERE payment_id = ? AND event_type = ? LIMIT 1')
      .bind(paymentId, eventType)
      .first<{ id: string }>();
    if (!existingEvent) {
      await env.DB.prepare('INSERT INTO checkout_events (id, order_id, event_type, payment_id) VALUES (?, ?, ?, ?)')
        .bind(crypto.randomUUID(), previous.id, eventType, paymentId)
        .run();
    }

    if (status === 'approved' && oldStatus !== 'approved') {
      const order = await env.DB.prepare('SELECT id, customer_name, customer_email, customer_phone, shipping_department, shipping_city, shipping_address, color, amount_cents FROM orders WHERE id = ?').bind(previous.id).first<OrderRow>();
      if (order) {
        const existingEmail = await env.DB.prepare('SELECT id FROM email_deliveries WHERE order_id = ? AND provider = ? AND status = ? LIMIT 1')
          .bind(order.id, 'resend-buyer', 'sent')
          .first<{ id: string }>();
        if (!existingEmail) {
          const buyerResult = await enviarEmailComprador(env, origin, order);
          await registrarEmail(env, order.id, 'resend-buyer', buyerResult);
          const ownerResult = await enviarEmailDueno(env, order, paymentId, buyerResult.ok);
          if (ownerResult) await registrarEmail(env, order.id, 'resend-owner', ownerResult);
          await enviarTelegram(env, `Nueva venta aprobada en daring.com.uy\n\nCliente: ${order.customer_name}\nCorreo: ${order.customer_email}\nColor: ${order.color}\nTotal: $ ${(order.amount_cents / 100).toLocaleString('es-UY')}\nPago Mercado Pago: ${paymentId}\nOrden: ${order.id}`);
        }
      }
    }
  } catch (error) {
    return { ok: false, previous: oldStatus, current: status, changed: oldStatus !== status, orderId: previous.id, error: error instanceof Error ? error.message : 'error actualizando la orden' };
  }

  return { ok: true, previous: oldStatus, current: status, changed: oldStatus !== status, orderId: previous.id, error: '' };
}

export async function reembolsarPago(env: Env, orderId: string): Promise<{ ok: boolean; error: string }> {
  const token = env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return { ok: false, error: 'MERCADOPAGO_ACCESS_TOKEN no configurada' };

  const order = await env.DB.prepare('SELECT id, status, payment_id, color, amount_cents, customer_name, order_code FROM orders WHERE id = ?').bind(orderId).first<{ id: string; status: string; payment_id: string | null; color: string; order_code: string | null }>();
  if (!order) return { ok: false, error: 'Venta no encontrada.' };
  if (!order.payment_id) return { ok: false, error: 'Esta venta no tiene un pago de Mercado Pago asociado todavía.' };
  if (order.status !== 'approved') return { ok: false, error: 'Solo se pueden reembolsar ventas con pago aprobado.' };

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${order.payment_id}/refunds`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json() as { status?: string; message?: string; error?: string } | null;
    if (!response.ok) {
      return { ok: false, error: data?.message ?? data?.error ?? `Mercado Pago respondió HTTP ${response.status}` };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'error de red con Mercado Pago' };
  }

  try {
    await env.DB.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind('refunded', orderId).run();
    await aplicarMovimientoStock(env, orderId, order.color, 'approved', 'refunded');
    await env.DB.prepare('INSERT INTO checkout_events (id, order_id, event_type, payment_id) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), orderId, 'payment_refunded', order.payment_id)
      .run();
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), 'orders.refund', 'orders', orderId, JSON.stringify({ payment_id: order.payment_id, color: order.color, amount_cents: order.amount_cents, order_code: order.order_code, customer_name: order.customer_name }))
      .run();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'error actualizando la venta' };
  }

  return { ok: true, error: '' };
}
