import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

const SORT_COLUMNS: Record<string, string> = {
  created_at: 'created_at',
  customer_name: 'customer_name',
  amount_cents: 'amount_cents'
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const status = url.searchParams.get('status')?.trim() ?? '';
  const period = url.searchParams.get('period')?.trim() ?? 'all';
  const sortKey = url.searchParams.get('sort')?.trim() ?? 'created_at';
  const order = url.searchParams.get('order')?.trim() === 'asc' ? 'ASC' : 'DESC';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const sortColumn = SORT_COLUMNS[sortKey] ?? 'created_at';

  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (status === 'initiated') {
    conditions.push('(status = ? OR status = ?)');
    bindings.push('checkout_started', 'pending');
  } else if (status === 'completed') {
    conditions.push('status = ?');
    bindings.push('approved');
  } else if (status === 'rejected') {
    conditions.push('status = ?');
    bindings.push('rejected');
  } else if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  }

  if (period === '7d') {
    conditions.push('created_at >= datetime(\'now\', \'-7 days\')');
  } else if (period === '30d') {
    conditions.push('created_at >= datetime(\'now\', \'-30 days\')');
  }

  if (q) {
    conditions.push('(customer_email LIKE ? OR customer_name LIKE ? OR id LIKE ?)');
    const like = `%${q}%`;
    bindings.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const baseFrom = `FROM orders ${where}`;

  const orders = await env.DB.prepare(
    `SELECT id, order_code, customer_name, customer_email, customer_phone, shipping_department, shipping_city, color, amount_cents, currency, status, shipping_status, tracking_number, created_at, approved_at ${baseFrom} ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`
  ).bind(...bindings, limit, offset).all<Record<string, unknown>>();

  const total = await env.DB.prepare(`SELECT COUNT(*) AS total ${baseFrom}`).bind(...bindings).first<{ total: number }>();

  const counts = await env.DB.prepare('SELECT status, COUNT(*) AS total FROM orders GROUP BY status').all<{ status: string; total: number }>();
  const buckets = { initiated: 0, pending: 0, completed: 0, rejected: 0, cancelled: 0, refunded: 0, total: 0 };
  for (const row of counts.results) {
    if (row.status === 'checkout_started') buckets.initiated += row.total;
    else if (row.status === 'pending') { buckets.initiated += row.total; buckets.pending += row.total; }
    else if (row.status === 'approved') buckets.completed += row.total;
    else if (row.status === 'rejected') buckets.rejected += row.total;
    else if (row.status === 'cancelled') buckets.cancelled += row.total;
    else if (row.status === 'refunded') buckets.refunded += row.total;
    buckets.total += row.total;
  }
  const revenue = await env.DB.prepare('SELECT COALESCE(SUM(amount_cents), 0) AS revenue FROM orders WHERE status = ?').bind('approved').first<{ revenue: number }>();

  return json({
    orders: orders.results,
    page,
    limit,
    total: total?.total ?? 0,
    counts: { initiated: buckets.initiated, completed: buckets.completed, rejected: buckets.rejected, pending: buckets.pending, cancelled: buckets.cancelled, refunded: buckets.refunded },
    revenue_cents: Number(revenue?.revenue ?? 0)
  });
};
