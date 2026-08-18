import { json } from '../_lib/response';
import { validPlacement } from './_lib';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const placement = new URL(request.url).searchParams.get('placement') ?? '';
  if (!validPlacement(placement)) return json({ ok: false, error: 'Ubicación inválida' }, 400);
  const rows = await env.DB.prepare('SELECT id, media_type, mime_type, file_name, title, alt_text, sort_order FROM media_assets WHERE placement = ? AND published = 1 ORDER BY sort_order, created_at').bind(placement).all();
  return json({ ok: true, media: rows.results.map((row) => ({ ...row, url: `/api/media/file?id=${encodeURIComponent(String(row.id))}` })) }, 200, { 'Cache-Control': 'public, max-age=60' });
};
