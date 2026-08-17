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
  return json({ period: summary.period ?? '7d', alerts });
};
