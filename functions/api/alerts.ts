import { getSessionAdmin } from './_lib/auth';
import { json } from './_lib/response';
import { onRequestGet as getSummary } from './metrics/summary';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const admin = await getSessionAdmin(context.env.DB, context.request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  const summaryResponse = await getSummary(context);
  const summary = await summaryResponse.json() as Record<string, number | null> & { period?: string };
  const alerts: Array<{ severity: 'info' | 'review'; title: string; explanation: string; action: string }> = [];
  const pageViews = Number(summary.page_views ?? 0);
  const buyClicks = Number(summary.buy_clicks ?? 0);
  const checkoutOpens = Number(summary.checkout_opens ?? 0);
  const checkoutSubmits = Number(summary.checkout_submits ?? 0);
  if (pageViews === 0) alerts.push({ severity: 'info', title: 'Todavía no hay datos', explanation: 'La medición recién está conectada o todavía no recibió visitas.', action: 'Volvé a revisar después de recibir tráfico.' });
  if (pageViews >= 20 && buyClicks / pageViews < .01) alerts.push({ severity: 'review', title: 'Pocos clics en comprar', explanation: 'Hay visitas, pero menos del 1% está avanzando desde el hero.', action: 'Revisá el mensaje principal y la visibilidad del botón.' });
  if (checkoutOpens >= 5 && checkoutSubmits / checkoutOpens < .3) alerts.push({ severity: 'review', title: 'El formulario pierde personas', explanation: 'Muchas personas abren el checkout, pero pocas lo completan.', action: 'Revisá la cantidad de campos y la claridad del envío.' });
  try {
    const stock = await context.env.DB.prepare('SELECT color, (stock_total - stock_reserved - stock_sold) AS available FROM product_colors').all<{ color: string; available: number }>();
    for (const row of stock.results ?? []) {
      const disponibles = Number(row.available ?? 0);
      const colorNombre = row.color === 'rojo' ? 'Rojo' : row.color === 'negro' ? 'Negro' : row.color;
      if (disponibles <= 0) alerts.push({ severity: 'review', title: `Sin stock en ${colorNombre}`, explanation: 'Ese color está agotado y la página puede dejar de venderlo.', action: 'Cargá stock en la sección Stock.' });
      else if (disponibles <= 3) alerts.push({ severity: 'review', title: `Quedan pocas unidades en ${colorNombre} (${disponibles})`, explanation: 'Con ese ritmo podés quedarte sin stock en días.', action: 'Cargá stock en la sección Stock.' });
    }
    const mailsFallidos = await context.env.DB.prepare("SELECT COUNT(*) AS total FROM email_deliveries WHERE status = 'failed' AND created_at >= datetime('now', '-7 days')").first<{ total: number }>();
    if (Number(mailsFallidos?.total ?? 0) > 0) alerts.push({ severity: 'review', title: `Mails con error (${mailsFallidos?.total} en 7 días)`, explanation: 'Algunos avisos automáticos no llegaron, ni al comprador ni a vos.', action: 'Revisá la sección Emails enviados.' });
    const rechazados = await context.env.DB.prepare("SELECT COUNT(*) AS total FROM orders WHERE status = 'rejected' AND created_at >= datetime('now', '-7 days')").first<{ total: number }>();
    if (Number(rechazados?.total ?? 0) >= 3) alerts.push({ severity: 'review', title: `Varios pagos rechazados (${rechazados?.total} en 7 días)`, explanation: 'Mercado Pago está rechazando pagos. A veces es normal (tarjetas sin fondos), pero vale la pena mirarlo.', action: 'Revisá la sección Ventas.' });
  } catch { /* las alertas de negocio son opcionales: si fallan, igual se muestran las de tráfico */ }
  return json({ period: summary.period ?? '7d', alerts });
};
