import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

const PRODUCT_ID = 'sarten-daring-28';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const product = await env.DB.prepare('SELECT id, sku, name, stock_total, stock_reserved, stock_sold, active, updated_at FROM products WHERE id = ?').bind(PRODUCT_ID).first<{ id: string; sku: string; name: string; stock_total: number; stock_reserved: number; stock_sold: number; active: number; updated_at: string }>();
  if (!product) return json({ error: 'Producto no encontrado.' }, 404);
  const available = product.stock_total - product.stock_reserved - product.stock_sold;
  const movements = await env.DB.prepare('SELECT quantity, reason, order_id, created_at FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 20').bind(PRODUCT_ID).all<{ quantity: number; reason: string; order_id: string | null; created_at: string }>();
  return json({ product: { ...product, available }, movements: movements.results });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  let body: { stock_total?: unknown; reason?: unknown };
  try { body = await request.json(); }
  catch { return json({ error: 'Datos inválidos.' }, 400); }

  const product = await env.DB.prepare('SELECT stock_total, stock_reserved, stock_sold FROM products WHERE id = ?').bind(PRODUCT_ID).first<{ stock_total: number; stock_reserved: number; stock_sold: number }>();
  if (!product) return json({ error: 'Producto no encontrado.' }, 404);

  const newTotal = Number(body.stock_total);
  if (!Number.isInteger(newTotal) || newTotal < 0 || newTotal > 1000000) {
    return json({ error: 'El stock total debe ser un número entero entre 0 y 1.000.000.' }, 400);
  }
  if (newTotal < product.stock_reserved + product.stock_sold) {
    return json({ error: `El stock total no puede ser menor que lo reservado más lo vendido (${product.stock_reserved + product.stock_sold}).` }, 400);
  }

  const delta = newTotal - product.stock_total;
  const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 200) : 'ajuste manual desde el panel';

  try {
    await env.DB.prepare('UPDATE products SET stock_total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newTotal, PRODUCT_ID).run();
    if (delta !== 0) {
      await env.DB.prepare('INSERT INTO stock_movements (id, product_id, quantity, reason) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), PRODUCT_ID, delta, reason).run();
    }
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), 'stock.update', 'products', PRODUCT_ID, JSON.stringify({ previous: product.stock_total, next: newTotal, reason })).run();
  } catch {
    return json({ error: 'No se pudo actualizar el stock.' }, 500);
  }
  return json({ ok: true });
};
