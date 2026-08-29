import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ error: 'No autorizado' }, 401);

  const known = new Set<string>();
  const rows = await env.DB.prepare('SELECT object_key FROM media_assets').all<{ object_key: string }>();
  for (const row of rows.results) known.add(row.object_key);

  const orphans: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.MEDIA.list({ limit: 1000, cursor });
    for (const object of page.objects) {
      if (!known.has(object.key) && !object.key.startsWith('entregables/')) orphans.push(object.key);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return json({ orphans, protected_prefix: 'entregables/' });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ error: 'No autorizado' }, 401);

  const known = new Set<string>();
  const rows = await env.DB.prepare('SELECT object_key FROM media_assets').all<{ object_key: string }>();
  for (const row of rows.results) known.add(row.object_key);

  const orphans: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.MEDIA.list({ limit: 1000, cursor });
    for (const object of page.objects) {
      if (!known.has(object.key) && !object.key.startsWith('entregables/')) orphans.push(object.key);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  let deleted = 0;
  for (const key of orphans) {
    try {
      await env.MEDIA.delete(key);
      deleted++;
    } catch {
      return json({ error: `No se pudo borrar ${key}` }, 500);
    }
  }

  await env.DB.prepare('INSERT INTO audit_log (id, action, entity, details) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), 'maintenance.cleanup', 'r2', JSON.stringify({ deleted, keys: orphans })).run();

  return json({ deleted, keys: orphans });
};
