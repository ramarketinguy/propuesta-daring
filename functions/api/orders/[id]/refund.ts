import { json } from '../../_lib/response';
import { reembolsarPago } from '../../_lib/mp-sync';

interface Env {
  DB: D1Database;
  MERCADOPAGO_ACCESS_TOKEN?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const onRequestPost: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id ?? '');
  if (!UUID_PATTERN.test(id)) return json({ error: 'ID inválido' }, 400);
  const resultado = await reembolsarPago(env, id);
  if (!resultado.ok) return json({ error: resultado.error }, 400);
  return json({ ok: true });
};
