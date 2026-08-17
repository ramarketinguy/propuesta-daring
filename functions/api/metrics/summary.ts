import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';
import { calculateConversion, periodStart } from './_lib';

interface Env {
  DB: D1Database;
}

type MetricRow = {
  page_views: number;
  unique_visitors: number;
  buy_clicks: number;
  checkout_opens: number;
  checkout_submits: number;
};

function periodValue(value: string | null): '7d' | '30d' | 'all' {
  return value === '30d' || value === 'all' ? value : '7d';
}

async function metrics(db: D1Database, period: '7d' | '30d' | 'all', now: Date): Promise<MetricRow> {
  const filter = period === 'all' ? '1 = 1' : 'created_at >= ?';
  const statement = db.prepare(`SELECT COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) AS page_views, COUNT(DISTINCT visitor_id) AS unique_visitors, COUNT(CASE WHEN event_name = 'hero_buy_click' THEN 1 END) AS buy_clicks, COUNT(CASE WHEN event_name = 'checkout_open' THEN 1 END) AS checkout_opens, COUNT(CASE WHEN event_name = 'checkout_submit' THEN 1 END) AS checkout_submits FROM analytics_events WHERE ${filter}`);
  const row = period === 'all' ? await statement.first<MetricRow>() : await statement.bind(periodStart(period, now)).first<MetricRow>();
  return {
    page_views: Number(row?.page_views ?? 0),
    unique_visitors: Number(row?.unique_visitors ?? 0),
    buy_clicks: Number(row?.buy_clicks ?? 0),
    checkout_opens: Number(row?.checkout_opens ?? 0),
    checkout_submits: Number(row?.checkout_submits ?? 0),
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  const url = new URL(request.url);
  const period = periodValue(url.searchParams.get('period'));
  const current = await metrics(env.DB, period, new Date());
  return json({
    period,
    ...current,
    approved_payments: null,
    conversion_rate: calculateConversion(current.page_views, 0),
    comparison: null,
  });
};
