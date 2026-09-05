import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status')?.trim() ?? '';
  const provider = url.searchParams.get('provider')?.trim() ?? '';
  const period = url.searchParams.get('period')?.trim() ?? 'all';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (status === 'sent' || status === 'failed' || status === 'queued') {
    conditions.push('e.status = ?');
    bindings.push(status);
  }
  if (provider === 'buyer' || provider === 'owner') {
    conditions.push('e.provider = ?');
    bindings.push(provider === 'buyer' ? 'resend-buyer' : 'resend-owner');
  }
  if (period === '7d') conditions.push('e.created_at >= datetime(\'now\', \'-7 days\')');
  else if (period === '30d') conditions.push('e.created_at >= datetime(\'now\', \'-30 days\')');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await env.DB.prepare(`SELECT e.id, e.order_id, o.order_code, e.provider, e.provider_message_id, e.status, e.error_message, e.created_at, e.sent_at FROM email_deliveries e LEFT JOIN orders o ON o.id = e.order_id ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`).bind(...bindings, limit, offset).all<{ id: string; order_id: string; order_code: string | null; provider: string; provider_message_id: string | null; status: string; error_message: string | null; created_at: string; sent_at: string | null }>();
  const total = await env.DB.prepare(`SELECT COUNT(*) AS total FROM email_deliveries e ${where}`).bind(...bindings).first<{ total: number }>();

  const counts = await env.DB.prepare('SELECT provider, status, COUNT(*) AS total FROM email_deliveries GROUP BY provider, status').all<{ provider: string; status: string; total: number }>();
  const buckets = { buyer_total: 0, buyer_sent: 0, buyer_failed: 0, owner_total: 0, owner_sent: 0, owner_failed: 0 };
  for (const row of counts.results ?? []) {
    if (row.provider === 'resend-buyer') {
      buckets.buyer_total += row.total;
      if (row.status === 'sent') buckets.buyer_sent += row.total;
      if (row.status === 'failed') buckets.buyer_failed += row.total;
    } else if (row.provider === 'resend-owner') {
      buckets.owner_total += row.total;
      if (row.status === 'sent') buckets.owner_sent += row.total;
      if (row.status === 'failed') buckets.owner_failed += row.total;
    }
  }

  return json({
    emails: rows.results,
    page,
    limit,
    total: total?.total ?? 0,
    counts: buckets
  });
};
