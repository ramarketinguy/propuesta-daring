# Pendientes Daring - Auto-generado

## Bloqueantes para venta real
- [ ] Integrar Mercado Pago Checkout Pro: crear preferencia desde `/api/checkout/create-preference` usando `MERCADOPAGO_ACCESS_TOKEN`, redirigir al pago y manejar retorno.
- [ ] Webhook Mercado Pago: `functions/api/webhooks/mercadopago.ts` para confirmar pago aprobado, guardar orden en D1 y marcar stock.
- [ ] Endpoint de envío: recibir datos del formulario y guardar orden pendiente de pago.
- [ ] Envío de recetario por email con Resend.

## Admin / Operación
- [ ] Provisionar usuario admin real en D1 production: `INSERT INTO admin_users (id,email,password_hash)`.
- [ ] Crear `.dev.vars` local y configurar secrets en Cloudflare Pages: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `RESEND_API_KEY`.
- [ ] Subir primer lote de medios a R2 `daring-media` y publicarlos para pizza/testimonios.
- [ ] Push de los 18 commits locales a `origin/main`.

## Calidad
- [ ] Revisión visual en dispositivos reales.
- [ ] Actualizar `memoria.md` tras cada sesión.
- [ ] Validar HTTPS y CORS en producción.

Tests ejecutados ahora:
- auth-contract.mjs: passed
- media-contract.mjs: passed
- metrics-contract.mjs: passed
