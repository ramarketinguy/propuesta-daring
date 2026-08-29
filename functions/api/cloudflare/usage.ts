import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
}

interface PlanLimits {
  r2: { storage_gb: number; reads_per_month: number; writes_per_month: number };
  d1: { storage_gb: number; rows_read_per_day: number; rows_write_per_day: number };
  pages: { builds_per_month: number; custom_domains: number; files_per_project: number };
  workers: { requests_per_day: number; cpu_ms_per_request: number };
}

const FREE_PLAN: PlanLimits = {
  r2: { storage_gb: 10, reads_per_month: 10_000_000, writes_per_month: 1_000_000 },
  d1: { storage_gb: 5, rows_read_per_day: 5_000_000, rows_write_per_day: 100_000 },
  pages: { builds_per_month: 500, custom_domains: 100, files_per_project: 20000 },
  workers: { requests_per_day: 100_000, cpu_ms_per_request: 10 }
};

async function mediaUsage(bucket: R2Bucket): Promise<{ object_count: number; size_bytes: number }> {
  let cursor: string | undefined;
  let objectCount = 0;
  let sizeBytes = 0;
  do {
    const page = await bucket.list({ limit: 1000, cursor });
    objectCount += page.objects.length;
    sizeBytes += page.objects.reduce((total, object) => total + object.size, 0);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return { object_count: objectCount, size_bytes: sizeBytes };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  const media = await mediaUsage(env.MEDIA);
  const analytics = await env.DB.prepare('SELECT COUNT(*) AS event_count FROM analytics_events').first<{ event_count: number }>();
  const orders = await env.DB.prepare('SELECT COUNT(*) AS total FROM orders').first<{ total: number }>();
  const ordersApproved = await env.DB.prepare('SELECT COUNT(*) AS total FROM orders WHERE status = ?').bind('approved').first<{ total: number }>();

  const r2LimitBytes = FREE_PLAN.r2.storage_gb * 1024 * 1024 * 1024;
  const d1EstimateRows = Number(analytics?.event_count ?? 0) + Number(orders?.total ?? 0);

  return json({
    ok: true,
    plan: 'free',
    plan_label: 'Cloudflare Free',
    r2: {
      ...media,
      limit_bytes: r2LimitBytes,
      limit_label: `${FREE_PLAN.r2.storage_gb} GB`,
      used_percent: r2LimitBytes ? Math.min(100, Math.round((media.size_bytes / r2LimitBytes) * 1000) / 10) : 0,
      status: 'available'
    },
    d1: {
      analytics_events: Number(analytics?.event_count ?? 0),
      orders_total: Number(orders?.total ?? 0),
      orders_approved: Number(ordersApproved?.total ?? 0),
      estimate_rows: d1EstimateRows,
      limit_label: `${FREE_PLAN.d1.storage_gb} GB`,
      status: 'available'
    },
    pages: {
      builds_per_month_limit: FREE_PLAN.pages.builds_per_month,
      custom_domains_limit: FREE_PLAN.pages.custom_domains,
      files_per_project_limit: FREE_PLAN.pages.files_per_project
    },
    workers: {
      requests_per_day_limit: FREE_PLAN.workers.requests_per_day,
      cpu_ms_per_request_limit: FREE_PLAN.workers.cpu_ms_per_request
    },
    cloudflare_plan_limits: { status: 'available', message: `Estás en plan Free. Usá los recuadros para entender dónde estás parado en cada servicio.` }
  });
};
