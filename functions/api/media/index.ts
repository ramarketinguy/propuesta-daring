import { getSessionAdmin } from '../_lib/auth';
import { json } from '../_lib/response';
import { mediaKey, validMedia, validPlacement } from './_lib';

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  const rows = await env.DB.prepare('SELECT id, object_key, media_type, mime_type, file_name, size_bytes, placement, sort_order, published, title, alt_text, created_at FROM media_assets ORDER BY placement, sort_order, created_at DESC').all();
  return json({ ok: true, media: rows.results.map((row) => ({ ...row, url: `/api/media/file?id=${encodeURIComponent(String(row.id))}` })) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await getSessionAdmin(env.DB, request);
  if (!admin) return json({ ok: false, error: 'No autorizado' }, 401);
  const form = await request.formData();
  const file = form.get('file');
  const placement = String(form.get('placement') ?? '');
  const title = String(form.get('title') ?? '').trim().slice(0, 160);
  const altText = String(form.get('alt_text') ?? '').trim().slice(0, 240);
  const sortOrder = Math.max(0, Number(form.get('sort_order') ?? 0) || 0);
  if (!(file instanceof File) || !validPlacement(placement) || !validMedia(file.type, file.size)) return json({ ok: false, error: 'Archivo o ubicación inválida' }, 400);

  const id = crypto.randomUUID();
  const key = mediaKey(placement, file.name);
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await env.DB.prepare('INSERT INTO media_assets (id, object_key, media_type, mime_type, file_name, size_bytes, placement, sort_order, published, title, alt_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)').bind(id, key, file.type.startsWith('video/') ? 'video' : 'image', file.type, file.name, file.size, placement, sortOrder, title || null, altText || null).run();
  return json({ ok: true, id, status: 'uploaded_unpublished' }, 201);
};
