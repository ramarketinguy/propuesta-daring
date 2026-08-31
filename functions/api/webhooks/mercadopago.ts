import { json } from '../_lib/response';
import { sincronizarPago } from '../_lib/mp-sync';

interface Env {
  DB: D1Database;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  RESEND_API_KEY?: string;
  MEDIA: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) return json({ received: true });

  let body: { type?: string; action?: string; data?: { id?: string | number } };
  try {
    body = await request.json();
  } catch {
    return json({ received: true });
  }

  const paymentId = body?.data?.id ? String(body.data.id) : '';
  const topic = `${body?.type ?? ''}${body?.action ?? ''}`;
  if (!paymentId || !topic.includes('payment')) return json({ received: true });

  const origin = new URL(request.url).origin;
  await sincronizarPago(env, origin, paymentId);

  return json({ received: true });
};
