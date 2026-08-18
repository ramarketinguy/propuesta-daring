import { json } from '../_lib/response';

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Recurso no encontrado' }, 404);
  const asset = await env.DB.prepare('SELECT object_key, mime_type, file_name FROM media_assets WHERE id = ? AND published = 1').bind(id).first<{ object_key: string; mime_type: string; file_name: string }>();
  if (!asset) return json({ error: 'Recurso no encontrado' }, 404);
  const object = await env.MEDIA.get(asset.object_key);
  if (!object) return json({ error: 'Recurso no encontrado' }, 404);
  const headers = new Headers({ 'Content-Type': asset.mime_type, 'Cache-Control': 'public, max-age=31536000, immutable' });
  if (object.httpEtag) headers.set('ETag', object.httpEtag);
  return new Response(object.body, { headers });
};
