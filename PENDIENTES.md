# Pendientes Daring - Auto-generado

## Bloqueantes para venta real
- [x] Integrar Mercado Pago Checkout Pro: crear preferencia desde `/api/checkout/create-preference` usando `MERCADOPAGO_ACCESS_TOKEN`, redirigir al pago y manejar retorno. (Implementado, desplegado y verificado en producción.)
- [x] Webhook Mercado Pago: `functions/api/webhooks/mercadopago.ts` para confirmar pago aprobado, guardar orden en D1 y marcar stock. (Implementado y desplegado.)
- [x] Endpoint de envío: recibir datos del formulario y guardar orden pendiente de pago. (El formulario llama a `/api/checkout/create-preference`, que crea la orden en D1.)
- [x] Desplegar a Cloudflare Pages y verificar el flujo completo en producción. (Deployments `b8e2e95e`, `4ac9e9f0`, `35814fc6`, `aa83ceb0`, `e30d10e3`.)
- [ ] Probar una compra real con tarjeta y hacer la devolución después.
- [x] Configurar la URL de webhook en el panel de Mercado Pago. (El usuario confirmó que quedó configurada en producción contra el dominio `daring.com.uy`.)
- [x] Envío de recetario por email con Resend. (Mail al comprador con PDF adjunto + link de video, mail al dueño con toda la orden incluido color.)
- [x] Subir recetario y video de armado a R2 (`entregables/recetario-pizza-daring.pdf` y `entregables/video-armado-daring.mp4`).
- [x] Provisionar usuario admin real en D1 production. (Creado y login verificado el 28-ago-2026; fix iteraciones PBKDF2 a 100.000 por límite de Cloudflare Workers.)
- [ ] Probar el flujo completo de compra real: pago aprobado → mail al comprador con recetario y video + aviso al dueño.
- [x] Conectar `daring.com.uy` al proyecto Pages. (Activo y verificado el 27-ago-2026, con www y HTTPS.)
- [x] Actualizar la URL del webhook de Mercado Pago al dominio definitivo `https://daring.com.uy/api/webhooks/mercadopago`.

## Admin / Operación
- [x] Provisionar usuario admin real en D1 production.
- [x] Fix de iteraciones PBKDF2 (Workers soporta máximo 100.000, antes usaba 120.000 → login fallaba silenciosamente).
- [x] Fix de Path de la cookie de sesión (cambiado de `/admin` a `/` para que `/api/auth/session` y `/api/admin/health` la reciban).
- [x] Fix de imports en varios endpoints (rutas relativas mal calculadas por la profundidad de las subcarpetas).
- [x] Limites del plan: el endpoint `cloudflare/usage` ya no requiere token de API; muestra los limites del plan Free con uso real.
- [x] Precio se muestra en pesos uruguayos en el panel (internamente se guarda en centavos).
- [ ] Etapa 2 del panel: stock real con decremento automático, gestión de testimonios, mapeo de imágenes a posiciones de la landing.
- [ ] Etapa 3: notificaciones Telegram desde el panel, editor de plantillas de mail, log de auditoría, multi-usuario admin.

## CMS de contenidos
- [x] 27 textos de la landing editables desde el panel (sección Contenido) con etiquetas que indican dónde impactan.
- [x] CRUD de preguntas frecuentes desde el panel.
- [x] La landing consume `/api/public/content` y aplica los textos en cada visita, con fallback al HTML hardcoded si la API falla.
- [ ] Mapeo imagen → posición de la landing (qué media de R2 va en cada slot).

## Cierre
- [ ] Subir los cambios a GitHub (commits pendientes: login, webhook email, Resend + dominio, admin SPA etapa 1, etapa 1.5 CMS de contenidos).

## Calidad
- [ ] Revisión visual en dispositivos reales.
- [x] Actualizar `memoria.md` tras cada sesión.
- [ ] Validar HTTPS y CORS en producción.

Tests ejecutados ahora:
- auth-contract.mjs: passed
- media-contract.mjs: passed
- metrics-contract.mjs: passed
- Verificación producción 26-ago-2026: health 200, validación 400 (esperado), preferencia creada OK, orden de prueba eliminada.
- Verificación producción 27-ago-2026: dominio `daring.com.uy` responde, custom domain activo en Pages, webhook dummy OK.
- Verificación producción 28-ago-2026: login del panel OK, fix de cookie Path y PBKDF2 aplicados.
- Verificación producción 29-ago-2026: CMS de contenidos cargando 27 campos + 4 FAQ, límites de plan Free OK, precio en pesos, navegación entre secciones del panel funcionando.

## Etapa 2 (29-ago-2026)
- [x] Stock real: producto sembrado, reserva al iniciar checkout, venta al aprobar, liberacion al rechazar, devolucion al reembolsar. Endpoint /api/stock y seccion Stock en el panel.
- [x] Mapeo imagen -> posicion: tabla page_images con 19 slots, endpoints /api/images, seccion Contenido con selector de biblioteca, landing aplica con data-cms-img.
- [x] Landing muestra stock disponible (contador) y precio desde settings.
- [x] Commits locales creados (9ecffdd, e664c89, beab690).
- [ ] Push a GitHub: requiere credenciales de ramarketinguy (gh autenticado como redulcerecetas no tiene permiso, 403).
