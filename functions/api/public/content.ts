import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') ?? '';
  const sameOrigin = origin === '' || origin === url.origin;
  const headers: Record<string, string> = {};
  if (sameOrigin) headers['Access-Control-Allow-Origin'] = origin || '*';
  headers['Cache-Control'] = 'public, max-age=30';

  const content = await env.DB.prepare('SELECT key, value FROM page_content').all<{ key: string; value: string | null }>();
  const faq = await env.DB.prepare('SELECT id, question, answer, sort_order FROM page_faq WHERE published = 1 ORDER BY sort_order').all<{ id: string; question: string; answer: string; sort_order: number }>();
  const flat: Record<string, string> = {};
  for (const row of content.results) flat[row.key] = row.value ?? '';

  const imagesRows = await env.DB.prepare(`
    SELECT pi.slot, pi.default_path, pi.alt_text, pi.media_id, ma.published AS media_published
    FROM page_images pi LEFT JOIN media_assets ma ON ma.id = pi.media_id
  `).all<{ slot: string; default_path: string; alt_text: string | null; media_id: string | null; media_published: number | null }>();
  const images: Record<string, { url: string; alt: string }> = {};
  for (const row of imagesRows.results) {
    if (row.media_id && row.media_published === 1) {
      images[row.slot] = { url: `/api/media/file?id=${row.media_id}`, alt: row.alt_text ?? '' };
    }
  }

  let stock: { available: number; total: number } | null = null;
  try {
    const product = await env.DB.prepare('SELECT stock_total, stock_reserved, stock_sold FROM products WHERE id = ?').bind('sarten-daring-28').first<{ stock_total: number; stock_reserved: number; stock_sold: number }>();
    if (product) stock = { available: Math.max(0, product.stock_total - product.stock_reserved - product.stock_sold), total: product.stock_total };
  } catch { stock = null; }

  let priceCents: number | null = null;
  try {
    const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('price_cents').first<{ value: string }>();
    priceCents = row ? Number(row.value) : null;
  } catch { priceCents = null; }

  return new Response(JSON.stringify({ content: flat, faq: faq.results, images, stock, price_cents: priceCents }), { headers: { ...headers, 'Content-Type': 'application/json' } });
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  const origin = request.headers.get('Origin') ?? '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600'
    }
  });
};
