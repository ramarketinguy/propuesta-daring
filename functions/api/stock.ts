import { json } from './_lib/response';

interface Env {
  DB: D1Database;
}

const PRODUCT_ID = 'sarten-daring-28';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const colors = await env.DB.prepare('SELECT color, stock_total, stock_reserved, stock_sold FROM product_colors WHERE product_id = ? ORDER BY color DESC').bind(PRODUCT_ID).all<{ color: string; stock_total: number; stock_reserved: number; stock_sold: number }>();
  let available = 0;
  let reserved = 0;
  let sold = 0;
  let total = 0;
  for (const c of colors.results) {
    available += c.stock_total - c.stock_reserved - c.stock_sold;
    reserved += c.stock_reserved;
    sold += c.stock_sold;
    total += c.stock_total;
  }
  const movements = await env.DB.prepare('SELECT quantity, reason, order_id, created_at FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 20').bind(PRODUCT_ID).all<{ quantity: number; reason: string; order_id: string | null; created_at: string }>();
  return json({
    product: { id: PRODUCT_ID, name: 'Sartén Daring 28 cm' },
    colors: colors.results.map((c) => ({ ...c, available: Math.max(0, c.stock_total - c.stock_reserved - c.stock_sold) })),
    totals: { available, reserved, sold, total },
    movements: movements.results
  });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  let body: { color?: unknown; stock_total?: unknown; reason?: unknown };
  try { body = await request.json(); }
  catch { return json({ error: 'Datos inválidos.' }, 400); }

  const color = typeof body.color === 'string' ? body.color.trim().toLowerCase() : '';
  if (!color) return json({ error: 'Falta el color.' }, 400);
  const row = await env.DB.prepare('SELECT stock_total, stock_reserved, stock_sold FROM product_colors WHERE product_id = ? AND color = ?').bind(PRODUCT_ID, color).first<{ stock_total: number; stock_reserved: number; stock_sold: number }>();
  if (!row) return json({ error: 'Color no encontrado.' }, 404);

  const newTotal = Number(body.stock_total);
  if (!Number.isInteger(newTotal) || newTotal < 0 || newTotal > 1000000) {
    return json({ error: 'El stock total debe ser un número entero entre 0 y 1.000.000.' }, 400);
  }
  if (newTotal < row.stock_reserved + row.stock_sold) {
    return json({ error: `El stock total no puede ser menor que lo reservado más lo vendido (${row.stock_reserved + row.stock_sold}).` }, 400);
  }

  const delta = newTotal - row.stock_total;
  const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 200) : 'ajuste manual desde el panel';

  try {
    await env.DB.prepare('UPDATE product_colors SET stock_total = ? WHERE product_id = ? AND color = ?').bind(newTotal, PRODUCT_ID, color).run();
    if (delta !== 0) {
      await env.DB.prepare('INSERT INTO stock_movements (id, product_id, quantity, reason) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), PRODUCT_ID, delta, `${reason} (${color})`).run();
    }
    await env.DB.prepare('INSERT INTO audit_log (id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), 'stock.update', 'product_colors', color, JSON.stringify({ previous: row.stock_total, next: newTotal, reason })).run();
  } catch {
    return json({ error: 'No se pudo actualizar el stock.' }, 500);
  }
  return json({ ok: true });
};
