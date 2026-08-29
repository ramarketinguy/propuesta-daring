import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const slots = await env.DB.prepare(`
    SELECT pi.id, pi.slot, pi.section, pi.label, pi.default_path, pi.media_id, pi.alt_text, pi.sort_order, pi.updated_at,
           ma.file_name AS media_file_name, ma.title AS media_title, ma.published AS media_published, ma.media_type AS media_type
    FROM page_images pi
    LEFT JOIN media_assets ma ON ma.id = pi.media_id
    ORDER BY pi.section, pi.sort_order
  `).all<{ id: string; slot: string; section: string; label: string; default_path: string; media_id: string | null; alt_text: string | null; sort_order: number; updated_at: string; media_file_name: string | null; media_title: string | null; media_published: number | null; media_type: string | null }>();

  const options = await env.DB.prepare('SELECT id, file_name, title, media_type, placement FROM media_assets WHERE published = 1 ORDER BY placement, sort_order, created_at DESC').all<{ id: string; file_name: string; title: string | null; media_type: string; placement: string }>();

  return json({ images: slots.results, options: options.results });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  let body: { slot?: unknown; media_id?: unknown; alt_text?: unknown };
  try { body = await request.json(); }
  catch { return json({ error: 'Datos inválidos.' }, 400); }

  const slot = typeof body.slot === 'string' ? body.slot.trim() : '';
  if (!slot) return json({ error: 'Falta el slot.' }, 400);

  const existing = await env.DB.prepare('SELECT id, media_id, alt_text FROM page_images WHERE slot = ?').bind(slot).first<{ id: string; media_id: string | null; alt_text: string | null }>();
  if (!existing) return json({ error: 'Posición no encontrada.' }, 404);

  let mediaId: string | null = null;
  if (typeof body.media_id === 'string' && body.media_id.trim()) {
    const media = await env.DB.prepare('SELECT id, published FROM media_assets WHERE id = ?').bind(body.media_id.trim()).first<{ id: string; published: number }>();
    if (!media) return json({ error: 'El archivo seleccionado no existe.' }, 404);
    if (media.published !== 1) return json({ error: 'El archivo debe estar publicado antes de usarlo en la página. Publicalo desde la sección Medios.' }, 400);
    mediaId = media.id;
  }

  const altText = typeof body.alt_text === 'string' && body.alt_text.trim() ? body.alt_text.trim().slice(0, 240) : existing.alt_text;

  try {
    await env.DB.prepare('UPDATE page_images SET media_id = ?, alt_text = ?, updated_at = CURRENT_TIMESTAMP WHERE slot = ?').bind(mediaId, altText, slot).run();
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), 'page_images.update', 'page_images', slot, JSON.stringify({ previous: existing.media_id, next: mediaId })).run();
  } catch {
    return json({ error: 'No se pudo guardar la imagen.' }, 500);
  }
  return json({ ok: true });
};
