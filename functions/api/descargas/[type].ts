import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
}

const FILES: Record<string, { key: string; filename: string; contentType: string }> = {
  'video-armado': { key: 'entregables/video-armado-daring.mp4', filename: 'Video de armado Daring.mp4', contentType: 'video/mp4' },
  'recetario': { key: 'entregables/recetario-pizza-daring.pdf', filename: 'Recetario Pizza Daring.pdf', contentType: 'application/pdf' }
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const onRequestGet: PagesFunction<Env> = async ({ params, request, env }) => {
  const type = String(params.type ?? '');
  const file = FILES[type];
  if (!file) return json({ error: 'Descarga no encontrada.' }, 404);

  const url = new URL(request.url);
  const orden = url.searchParams.get('orden') ?? '';
  if (!UUID_PATTERN.test(orden)) return json({ error: 'Link de descarga inválido.' }, 400);

  const order = await env.DB.prepare('SELECT id FROM orders WHERE id = ? AND status = ?').bind(orden, 'approved').first<{ id: string }>();
  if (!order) return json({ error: 'Este link todavía no está habilitado. Se activa cuando el pago queda aprobado.' }, 403);

  const object = await env.MEDIA.get(file.key);
  if (!object) return json({ error: 'El archivo todavía no está disponible. Escribinos por WhatsApp y te lo mandamos.' }, 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(object.size),
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
};
