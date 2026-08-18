import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
}

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
  return json({
    ok: true,
    r2: { ...media, limit_bytes: null, status: 'available' },
    d1: { analytics_events: Number(analytics?.event_count ?? 0), limit_bytes: null, status: 'available' },
    cloudflare_plan_limits: { status: env.CF_API_TOKEN && env.CF_ACCOUNT_ID ? 'api_configured' : 'not_configured', message: env.CF_API_TOKEN && env.CF_ACCOUNT_ID ? 'Los límites del plan requieren consulta API.' : 'Configurá CF_API_TOKEN y CF_ACCOUNT_ID como secretos para consultar límites del plan.' },
  });
};
