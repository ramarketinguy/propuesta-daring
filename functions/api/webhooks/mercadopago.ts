import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  RESEND_API_KEY?: string;
  MEDIA: R2Bucket;
}

interface OrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_department: string | null;
  shipping_city: string | null;
  shipping_address: string | null;
  color: string;
  amount_cents: number;
}

interface EmailResult {
  ok: boolean;
  messageId: string;
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

function buildBuyerEmailHTML(order: OrderRow, origin: string, hasVideo: boolean): string {
  const nombre = escapeHTML(order.customer_name.split(' ')[0]);
  const videoLink = `${origin}/api/descargas/video-armado?orden=${order.id}`;
  const videoBlock = hasVideo
    ? `<p style="margin:0 0 10px">También grabamos un <strong>video paso a paso</strong> para el primer uso de tu sartén. Lo descargás desde acá (queda habilitado con tu número de compra):</p>
       <p style="margin:0 0 10px"><a href="${videoLink}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold">Descargar video de armado</a></p>
       <p style="margin:0 0 24px;font-size:12px;color:#8a6d70">Si el botón no funciona, copiá este enlace: ${videoLink}</p>`
    : '';
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f7f2f0;font-family:Arial,Helvetica,sans-serif;color:#2b1a1d">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #f0dcd9;border-radius:16px;padding:32px">
<p style="margin:0 0 16px;font-size:13px;letter-spacing:2px;color:#c8102e;font-weight:bold">DARING</p>
<h1 style="font-size:22px;margin:0 0 12px">¡Gracias por tu compra, ${nombre}!</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.5">Tu Sartén Daring color <strong>${escapeHTML(order.color)}</strong> quedó confirmada y ya está en camino: despachamos en 24 horas y la entrega es en 24 a 72 horas según tu zona.</p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.5">Como prometimos, adjuntamos el <strong>Recetario de la Pizza Daring</strong> en PDF para que estrenes la sartén como se debe.</p>
${videoBlock}
<p style="margin:0 0 6px;font-size:14px">Cualquier duda o consulta, escribinos por WhatsApp y te respondemos al toque.</p>
<p style="margin:0;font-size:14px">¡Buenas pizzas!</p>
<hr style="border:none;border-top:1px solid #f0dcd9;margin:24px 0">
<p style="margin:0;font-size:11px;color:#8a6d70">Compra ${order.id}. Daring — Una sartén para cocinarlo todo.</p>
</div></body></html>`;
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

function reemplazarTokens(html: string, tokens: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

async function enviarEmailComprador(env: Env, origin: string, order: OrderRow): Promise<EmailResult> {
  const attachments: Array<{ filename: string; content: string }> = [];
  try {
    const pdf = await env.MEDIA.get(PDF_KEY);
    if (pdf) {
      attachments.push({ filename: 'Recetario Pizza Daring.pdf', content: toBase64(await pdf.arrayBuffer()) });
    }
  } catch {
    attachments.length = 0;
  }

  let hasVideo = false;
  try {
    hasVideo = Boolean(await env.MEDIA.head(VIDEO_KEY));
  } catch {
    hasVideo = false;
  }

  const fromEmail = (await getSetting(env, 'buyer_from_email')) ?? 'recetario@daring.com.uy';
  const fromName = (await getSetting(env, 'buyer_from_name')) ?? 'Daring';
  const videoLink = `${origin}/api/descargas/video-armado?orden=${order.id}`;
  const nombre = order.customer_name.split(' ')[0];

  let html: string;
  const plantilla = await getSetting(env, 'buyer_email_html');
  if (plantilla && plantilla.trim()) {
    html = reemplazarTokens(plantilla, {
      nombre,
      color: order.color,
      orden: order.id,
      video_link: videoLink,
      video: hasVideo
        ? `<p style="margin:0 0 10px">También grabamos un <strong>video paso a paso</strong> para el primer uso de tu sartén:</p><p style="margin:0 0 10px"><a href="${videoLink}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold">Descargar video de armado</a></p>`
        : ''
    });
  } else {
    html = buildBuyerEmailHTML(order, origin, hasVideo);
  }

  const subjectPlantilla = await getSetting(env, 'buyer_email_subject');
  const subject = subjectPlantilla && subjectPlantilla.trim()
    ? reemplazarTokens(subjectPlantilla, { nombre, color: order.color })
    : '¡Gracias por tu compra! Tu recetario y el video de armado';

  return sendEmail(env, {
    from: `${fromName} <${fromEmail}>`,
    to: [order.customer_email],
    subject,
    html,
    ...(attachments.length ? { attachments } : {})
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
      orden: order.id,
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

async function getSetting(env: Env, key: string): Promise<string | null> {
  try {
    const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
    return row?.value ?? null;
  } catch {
    return null;
  }
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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return json({ received: true });

  let body: { type?: string; action?: string; data?: { id?: string | number } };
  try {
    body = await request.json();
  } catch {
    return json({ received: true });
  }

  const paymentId = body?.data?.id ? String(body.data.id) : '';
  const topic = `${body?.type ?? ''}${body?.action ?? ''}`;
  if (!paymentId || !topic.includes('payment')) return json({ received: true });

  let status = '';
  let reference = '';
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return json({ received: true });
    const payment = await response.json() as { status?: string; external_reference?: string };
    status = STATUS_MAP[payment.status ?? ''] ?? 'pending';
    reference = payment.external_reference ?? '';
  } catch {
    return json({ received: true });
  }

  if (!reference) return json({ received: true });
  const eventType = EVENT_MAP[status === 'pending' ? 'pending' : status] ?? 'payment_pending';
  const origin = new URL(request.url).origin;

  try {
    const previous = await env.DB.prepare('SELECT id, status, color FROM orders WHERE external_reference = ?').bind(reference).first<{ id: string; status: string; color: string }>();
    const oldStatus = previous?.status ?? '';

    await env.DB.prepare('UPDATE orders SET status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP, approved_at = CASE WHEN ? = ? THEN CURRENT_TIMESTAMP ELSE approved_at END WHERE external_reference = ?')
      .bind(status, paymentId, status, 'approved', reference)
      .run();

    if (previous && oldStatus !== status) {
      await aplicarMovimientoStock(env, previous.id, previous.color, oldStatus, status);
    }

    const order = await env.DB.prepare('SELECT id, customer_name, customer_email, customer_phone, shipping_department, shipping_city, shipping_address, color, amount_cents FROM orders WHERE external_reference = ?').bind(reference).first<OrderRow>();

    const existing = await env.DB.prepare('SELECT id FROM checkout_events WHERE payment_id = ? AND event_type = ? LIMIT 1')
      .bind(paymentId, eventType)
      .first<{ id: string }>();
    if (!existing && order) {
      await env.DB.prepare('INSERT INTO checkout_events (id, order_id, event_type, payment_id) VALUES (?, ?, ?, ?)')
        .bind(crypto.randomUUID(), order.id, eventType, paymentId)
        .run();
    }

    if (order && status === 'approved') {
      const existingEmail = await env.DB.prepare('SELECT id FROM email_deliveries WHERE order_id = ? AND provider = ? AND status = ? LIMIT 1')
        .bind(order.id, 'resend-buyer', 'sent')
        .first<{ id: string }>();
      if (!existingEmail) {
        const buyerResult = await enviarEmailComprador(env, origin, order);
        await registrarEmail(env, order.id, 'resend-buyer', buyerResult);
        const ownerResult = await enviarEmailDueno(env, order, paymentId, buyerResult.ok);
        if (ownerResult) await registrarEmail(env, order.id, 'resend-owner', ownerResult);
      }
    }
  } catch {
    return json({ received: true }, 200);
  }

  return json({ received: true });
};
