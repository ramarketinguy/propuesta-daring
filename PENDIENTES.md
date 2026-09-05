# Pendientes Daring - Auto-generado

## Bloqueantes para venta real
- [x] Integrar Mercado Pago Checkout Pro: crear preferencia desde `/api/checkout/create-preference` usando `MERCADOPAGO_ACCESS_TOKEN`, redirigir al pago y manejar retorno. (Implementado, desplegado y verificado en producciÃ³n.)
- [x] Webhook Mercado Pago: `functions/api/webhooks/mercadopago.ts` para confirmar pago aprobado, guardar orden en D1 y marcar stock. (Implementado y desplegado.)
- [x] Endpoint de envÃ­o: recibir datos del formulario y guardar orden pendiente de pago. (El formulario llama a `/api/checkout/create-preference`, que crea la orden en D1.)
- [x] Desplegar a Cloudflare Pages y verificar el flujo completo en producciÃ³n. (Deployments `b8e2e95e`, `4ac9e9f0`, `35814fc6`, `aa83ceb0`, `e30d10e3`.)
- [ ] Probar una compra real con tarjeta y hacer la devoluciÃ³n despuÃ©s.
- [ ] Conectar la API de conversiones (CAPI) de Meta: token del BM propio de Daring + Purchase server-side en el webhook de Mercado Pago con event_id para deduplicar contra el pixel del navegador.
- [x] Configurar la URL de webhook en el panel de Mercado Pago. (El usuario confirmÃ³ que quedÃ³ configurada en producciÃ³n contra el dominio `daring.com.uy`.)
- [x] EnvÃ­o de recetario por email con Resend. (Mail al comprador con PDF adjunto + link de video, mail al dueÃ±o con toda la orden incluido color.)
- [x] Subir recetario y video de armado a R2 (`entregables/recetario-pizza-daring.pdf` y `entregables/video-armado-daring.mp4`).
- [x] Provisionar usuario admin real en D1 production. (Creado y login verificado el 28-ago-2026; fix iteraciones PBKDF2 a 100.000 por lÃ­mite de Cloudflare Workers.)
- [x] Probar el flujo completo de compra real: pago aprobado -> mail al comprador con recetario y video + aviso al dueno. (Verificado 03-sep-2026 via D1: DR-000001 approved, mails resend-buyer y resend-owner en sent, stock convertido, sin reservas trabadas.)
- [x] Conectar `daring.com.uy` al proyecto Pages. (Activo y verificado el 27-ago-2026, con www y HTTPS.)
- [x] Actualizar la URL del webhook de Mercado Pago al dominio definitivo `https://daring.com.uy/api/webhooks/mercadopago`.

## Admin / OperaciÃ³n
- [x] Provisionar usuario admin real en D1 production.
- [x] Fix de iteraciones PBKDF2 (Workers soporta mÃ¡ximo 100.000, antes usaba 120.000 â†’ login fallaba silenciosamente).
- [x] Fix de Path de la cookie de sesiÃ³n (cambiado de `/admin` a `/` para que `/api/auth/session` y `/api/admin/health` la reciban).
- [x] Fix de imports en varios endpoints (rutas relativas mal calculadas por la profundidad de las subcarpetas).
- [x] Limites del plan: el endpoint `cloudflare/usage` ya no requiere token de API; muestra los limites del plan Free con uso real.
- [x] Precio se muestra en pesos uruguayos en el panel (internamente se guarda en centavos).
- [ ] Etapa 2 del panel: stock real con decremento automÃ¡tico, gestiÃ³n de testimonios, mapeo de imÃ¡genes a posiciones de la landing.
- [ ] Etapa 3: notificaciones Telegram desde el panel, editor de plantillas de mail, log de auditorÃ­a, multi-usuario admin.

## CMS de contenidos
- [x] 27 textos de la landing editables desde el panel (secciÃ³n Contenido) con etiquetas que indican dÃ³nde impactan.
- [x] CRUD de preguntas frecuentes desde el panel.
- [x] La landing consume `/api/public/content` y aplica los textos en cada visita, con fallback al HTML hardcoded si la API falla.
- [ ] Mapeo imagen â†’ posiciÃ³n de la landing (quÃ© media de R2 va en cada slot).

## Cierre
- [ ] Subir los cambios a GitHub (commits pendientes: login, webhook email, Resend + dominio, admin SPA etapa 1, etapa 1.5 CMS de contenidos).

## Calidad
- [ ] RevisiÃ³n visual en dispositivos reales.
- [x] Actualizar `memoria.md` tras cada sesiÃ³n.
- [ ] Validar HTTPS y CORS en producciÃ³n.

Tests ejecutados ahora:
- auth-contract.mjs: passed
- media-contract.mjs: passed
- metrics-contract.mjs: passed
- VerificaciÃ³n producciÃ³n 26-ago-2026: health 200, validaciÃ³n 400 (esperado), preferencia creada OK, orden de prueba eliminada.
- VerificaciÃ³n producciÃ³n 27-ago-2026: dominio `daring.com.uy` responde, custom domain activo en Pages, webhook dummy OK.
- VerificaciÃ³n producciÃ³n 28-ago-2026: login del panel OK, fix de cookie Path y PBKDF2 aplicados.
- VerificaciÃ³n producciÃ³n 29-ago-2026: CMS de contenidos cargando 27 campos + 4 FAQ, lÃ­mites de plan Free OK, precio en pesos, navegaciÃ³n entre secciones del panel funcionando.

## Etapa 2 (29-ago-2026)
- [x] Stock real: producto sembrado, reserva al iniciar checkout, venta al aprobar, liberacion al rechazar, devolucion al reembolsar. Endpoint /api/stock y seccion Stock en el panel.
- [x] Mapeo imagen -> posicion: tabla page_images con 19 slots, endpoints /api/images, seccion Contenido con selector de biblioteca, landing aplica con data-cms-img.
- [x] Landing muestra stock disponible (contador) y precio desde settings.
- [x] Commits locales creados (9ecffdd, e664c89, beab690).
- [x] Push a GitHub completado (29-ago-2026): 24 commits subidos a origin/main autenticando como ramarketinguy via gh.

- [x] Fix duplicado de loadUso en admin.js (rompia todo el JS del panel: sin navegacion ni datos).
