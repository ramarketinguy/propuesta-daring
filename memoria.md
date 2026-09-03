# Memoria Del Proyecto Daring

Última actualización: 2026-09-03 (sesión 4: pixel de Meta en la landing con eventos del embudo + verificación de Google Search Console, desplegado y verificado en producción; CAPI sin conectar)

## Estado Actual

- Proyecto: landing de venta de la sartÃ©n Daring.
- Archivo principal: `daring-landing.html`.
- Servidor local habitual: `http://localhost:4173/index.html` o `wrangler pages dev --port 8788` (siempre con CurrentDirectory del proyecto).
- Repositorio: `https://github.com/ramarketinguy/propuesta-daring.git` â€” sincronizado con producciÃ³n (todo committeado y pusheado).
- Rama principal: `main`.
- El precio de lanzamiento es `$1.590 UYU` (configurable desde el panel en pesos; se guarda en centavos).
- Checkout Pro de Mercado Pago integrado, desplegado y verificado en producciÃ³n (ver secciÃ³n Checkout Pro).
- Pixel de Meta instalado en la landing con eventos del embudo; la API de conversiones (CAPI) NO está conectada (ver sección Pixel de Meta).
- Dominio oficial `daring.com.uy` en Cloudflare Pages (secciÃ³n Dominio).
- Resend configurado con dominio verificado, clave cargada y envÃ­o automÃ¡tico funcionando (secciÃ³n Resend).
- Panel admin como SPA con sidebar y 8 secciones: Resumen, Ventas, Stock (por color), Contenido (tabs: Textos / ImÃ¡genes / Preguntas frecuentes), ConfiguraciÃ³n (con editor de plantillas de mail), Emails enviados, AuditorÃ­a (en lenguaje claro), Uso Cloudflare. Tema claro/oscuro con switch.
- Landing consume contenidos dinÃ¡micos (textos, imÃ¡genes de carruseles, stock, precio) desde la base con fallback al HTML hardcoded.
- Ãšnico pendiente de negocio: **prueba de compra real con tarjeta** (y devoluciÃ³n posterior) + revisiÃ³n visual en celular.
- Descartados por decisiÃ³n del usuario: notificaciones Telegram, multi-usuario admin.
- WhatsApp funciona Ãºnicamente como canal de consultas desde la barra inferior.

## Checkout Pro (Mercado Pago)

- AplicaciÃ³n Mercado Pago: "Daring web", App ID `1304026149030121`.
- Token de producciÃ³n `APP_USR-` guardado en `.dev.vars` local y como secreto `MERCADOPAGO_ACCESS_TOKEN` en Cloudflare Pages.
- Endpoint `POST /api/checkout/create-preference` (`functions/api/checkout/create-preference.ts`).
- El endpoint valida los datos del formulario, verifica stock disponible del color elegido, crea la orden con estado `checkout_started` en D1, reserva una unidad y crea la preferencia en Mercado Pago.
- Precio y moneda se leen de `settings` (price_cents 159000, UYU), cantidad 1, `statement_descriptor` DARING.
- `back_urls` vuelven a la landing con `?pago=aprobado|pendiente|rechazado` y la landing muestra un aviso fijo con el resultado.
- En origen local (http) se usan URLs pÃºblicas de reemplazo y se omite `notification_url`, porque Mercado Pago rechaza URLs locales.
- En producciÃ³n se envÃ­a `notification_url` apuntando a `/api/webhooks/mercadopago`.
- Endpoint `POST /api/webhooks/mercadopago` (`functions/api/webhooks/mercadopago.ts`).
- El webhook consulta el pago a la API de Mercado Pago, actualiza la orden por `external_reference` y registra el evento en `checkout_events` con control de duplicados.
- La landing envÃ­a el formulario a `create-preference` y redirige a `init_point` (o `sandbox_init_point` si no hay producciÃ³n).
- MCP de Mercado Pago conectado en opencode con token comÃºn: listar apps funciona, pero `get_credentials` y `save_webhook` exigen conexiÃ³n OAuth.
- Desplegado a Cloudflare Pages el 26-ago-2026 (deployment `b8e2e95e`): health OK, validaciÃ³n OK y preferencia real generada en producciÃ³n.
- Orden de prueba de producciÃ³n borrada de D1 remoto; solo quedan Ã³rdenes reales.
- Los videos originales de mÃ¡s de 25 MB (lÃ­mite de Pages) no se publican; la landing usa las versiones optimizadas de `Testimonios nuevos/web/`.
- El despliegue a Pages se hace con una copia en carpeta temporal sin `.git`, `.wrangler`, `cloudflare-dist`, `.dev.vars` ni los videos pesados (ver "CÃ³mo desplegar" mÃ¡s abajo).
- URL de webhook ya configurada en el panel de Mercado Pago contra el dominio definitivo (confirmado por el usuario).
- Pendiente: prueba de compra real con tarjeta y devoluciÃ³n posterior.
- Migraciones 0002, 0003, 0004, 0005, 0006, 0007 y 0008 aplicadas en D1 remoto de producciÃ³n.

## CÃ³mo Desplegar

- La carpeta raÃ­z contiene archivos que Pages rechaza (videos de mÃ¡s de 25 MB), asÃ­ que no se publica directo.
- Procedimiento usado: `robocopy` a una carpeta temporal excluyendo `.git`, `.wrangler`, `cloudflare-dist`, `.dev.vars` y los MP4 de la raÃ­z de `Testimonios nuevos`; luego `wrangler pages deploy <carpeta> --project-name daring-landing`.
- Wrangler instalado en `%TEMP%\opencode\wr` (no hay `package.json` en el proyecto).
- Login de wrangler: cuenta `irineomadrid.daring@gmail.com`, credenciales en `%APPDATA%\xdg.config\.wrangler\config\default.toml`.

## Dominio Oficial (daring.com.uy)

- Dominio comprado en dominios.uy (NIC Uruguay), a nombre de Irineo (`irineomadridsosa@gmail.com`), vence 19/11/2026.
- Agregado a la cuenta de Cloudflare; zone ID `c3ecd843c82e1f2dc4e5ff61b8fae17c`; zona **activa** desde el 27-ago-2026.
- Nameservers: `abby.ns.cloudflare.com` y `alexis.ns.cloudflare.com` (cargados en dominios.uy y propagados).
- `daring.com.uy` y `www.daring.com.uy` agregados como custom domains del proyecto Pages `daring-landing` y **activos y funcionando** (verificado el 27-ago-2026).
- Antes apuntaba a un WordPress viejo en Hostinger; el usuario borrÃ³ los registros A/AAAA/CNAME viejos y creÃ³ dos CNAME (@ y www â†’ `daring-landing.pages.dev`, Proxied).
- Verificado: landing actual con tÃ­tulo correcto en ambos dominios, `/api/health` 200 y webhook respondiendo desde el dominio definitivo.
- Importante: el token de wrangler NO tiene permiso DNS sobre la zona (403); los cambios de DNS van por dashboard o con un token API con permisos de DNS.
- El checkout generado desde el dominio nuevo usa `daring.com.uy` automÃ¡ticamente en `back_urls` y `notification_url` (se arman con el origen de cada pedido).
- Verificacion de Google Search Console (03-sep-2026): primera intentona con archivo estatico google83c5729b27d1923d.html + regla en _redirects FALLO en Google (file not found). Causa raiz: Cloudflare Pages hace 308 automatico quitando el .html (/google83c5729b27d1923d.html -> /google83c5729b27d1923d) y Google no sigue ese redirect al verificar. Ese 308 tambien afecta a la raiz del sitio (/ -> /daring-landing) y al archivo viejo google4a7ae9e6139d186e.html.
- Solucion: el archivo de verificacion ahora lo sirve una Pages Function (functions/google83c5729b27d1923d.html.ts) con 200 directo, sin redirect. El archivo estatico se borro del proyecto y la regla de _redirects del nuevo se quito (la del archivo viejo se deja). Verificado en produccion (deployment 629e4eea): 200 con contenido exacto en daring.com.uy y www.daring.com.uy, y la home sigue respondiendo 200.
- IMPORTANTE aprendido: con Pages Function hay que exportar onRequest generico (no onRequestGet): Google hace peticiones HEAD al verificar y onRequestGet puro responde 404 al HEAD (eso dio el mismo error de verificacion dos veces). Con onRequest, GET y HEAD responden 200 (verificado deployment b720b5f7 en daring.com.uy, www y daring-landing.pages.dev).
- Causa final del error de verificacion: la propiedad de Search Console estaba creada como https://daring.com.uy/daring-landing (con la ruta, porque la home hace 308 a /daring-landing y el navegador mostro esa URL). Google buscaba el archivo dentro de esa ruta. Solucion: functions/daring-landing/google83c5729b27d1923d.html.ts sirve el archivo tambien en /daring-landing/... (deployment 7fef371c, GET y HEAD 200 verificados en ambas rutas). Ideal a futuro: recrear la propiedad como https://daring.com.uy a secas.
- El token OAuth de wrangler vence seguido; si la API da 403/"Authentication error", correr cualquier comando de wrangler para refrescarlo antes de usar la API.

## Resend (Email)

- Cuenta de Resend creada por Ramiro; clave API vigente: la primera quedÃ³ inaccesible (Resend no la vuelve a mostrar), se creÃ³ una nueva.
- Clave cargada en `.dev.vars` local y como secreto `RESEND_API_KEY` en Cloudflare Pages (ambos verificados).
- Dominio `daring.com.uy` agregado y **verificado** en Resend (DKIM, SPF y MX en verde; regiÃ³n SÃ£o Paulo).
- Los registros DNS los cargÃ³ Resend automÃ¡ticamente en Cloudflare (botÃ³n Auto-configure).
- El plan "Enable Sending" quedÃ³ activado; "Enable Receiving" (recibir mails) quedÃ³ apagado y no hace falta para el flujo actual.
- Remitente del mail de compra: `Daring <recetario@daring.com.uy>`.

## EnvÃ­o AutomÃ¡tico De Entregables

- Recetario PDF: `assets/Pizza daring.pdf` (5,9 MB), subido a R2 como `entregables/recetario-pizza-daring.pdf`.
- Video de armado: `assets/Armado sartÃ©n .mp4` (42,2 MB), subido a R2 como `entregables/video-armado-daring.mp4`. (Importante: wrangler 4.126 se rompe con "Ã©"/espacios en el nombre del archivo al subir; copiar a un nombre simple antes de `r2 object put`.)
- Endpoint `GET /api/descargas/[type]?orden=<uuid>` (`functions/api/descargas/[type].ts`): sirve `video-armado` y `recetario` desde R2 solo si la orden existe con estado `approved`; invÃ¡lido 400, sin pago aprobado 403, archivo faltante 404.
- El webhook (`functions/api/webhooks/mercadopago.ts`) al aprobarse un pago: envÃ­a mail al COMPRADOR con el PDF adjunto y botÃ³n de descarga del video, y mail al DUEÃ‘O (`owner_email` desde settings, remitente `owner_from_email`/`owner_from_name` desde settings) con la orden completa: datos del formulario, telÃ©fono, direcciÃ³n, color elegido, total, nÃºmero de orden y pago MP. Ambos quedan en `email_deliveries` con provider `resend-buyer` / `resend-owner` y control anti-duplicados.
- Si `owner_email_enabled` estÃ¡ en `false`, no se manda el mail al dueÃ±o.
- El mail al comprador usa remitente `buyer_from_email`/`buyer_from_name` desde settings.
- El precio se lee de `settings.price_cents` (default 159000); `create-preference` ya no tiene el precio hardcoded.
- Desplegado y verificado en producciÃ³n el 28-ago-2026.

## Panel Admin â€” Etapa 1

- MigraciÃ³n nueva `0004_admin_panel_etapa1.sql` aplicada en D1 producciÃ³n: columnas `shipping_status`, `tracking_number`, `admin_notes` en `orders`; tabla `settings` (clave/valor con categorÃ­a); tabla `audit_log`.
- 13 settings sembradas en 4 categorÃ­as: `producto` (precio, moneda, stock visible), `contacto` (WhatsApp, mail del dueÃ±o, activar avisos), `resend` (remitente comprador y dueÃ±o), `notifications` (Telegram). Cambiables desde el panel.
- Endpoints nuevos: `GET/PATCH /api/orders/:id` (detalle con timeline y emails + cambiar estado de envÃ­o, tracking y notas), `GET /api/orders` (lista con filtros: bÃºsqueda, estado, perÃ­odo + contadores y revenue), `GET /api/settings`, `PUT /api/settings` (validado por tipo, registra audit_log), `GET /api/emails` (lista con filtros + contadores buyer/owner).
- `create-preference` lee precio y moneda desde `settings`; ya no estÃ¡n hardcoded.
- Webhook lee remitentes y mail del dueÃ±o desde `settings`.
- Panel rediseÃ±ado como SPA con sidebar y 6 secciones: Resumen, Ventas, ConfiguraciÃ³n, Emails enviados, Medios, Uso. Estilo back-office denso (tipografÃ­a Inter, colores tipo dashboard). Hash routing (`#ventas`, `#configuracion`, etc.).
- Ventas: 4 KPI cards (Iniciados / Concluidas / Rechazadas / Ingresos), tabla con bÃºsqueda por mail/nombre/orden, filtros por estado y perÃ­odo, paginaciÃ³n, detalle con timeline + envÃ­o + notas, exportar CSV.
- ConfiguraciÃ³n: form con Producto / Contacto / Remitentes Resend (Telegram queda para etapa 3). El campo "Precio" se muestra en **pesos uruguayos** (no centavos) y el backend convierte a centavos antes de guardar.
- Emails enviados: contadores buyer/owner, tabla con filtros y paginaciÃ³n.
- Logs de auditorÃ­a: cualquier cambio en settings y orders se registra en `audit_log`.
- Login del panel con Path=/ (corregido el 28-ago para que la sesiÃ³n sirva tambiÃ©n a `/api/auth/session` y `/api/admin/health`).

## Panel Admin â€” Etapa 1.5 (CMS de la landing)

- MigraciÃ³n `0005_page_content.sql`: tablas `page_content` (textos con secciÃ³n, label, type, sort_order) y `page_faq` (preguntas con orden y published).
- 27 campos `page_content` sembrados cubriendo Hero, Platos, DiseÃ±o, Oferta, Cierre (incluye tÃ­tulo del hero por lÃ­nea, subtÃ­tulo, badges, bullets de la oferta, CTA, copy del lanzamiento, etc.) y 4 preguntas frecuentes iniciales.
- Endpoints nuevos: `GET/PUT /api/content` (admin), `GET /api/faq`, `POST /api/faq`, `GET/PATCH/DELETE /api/faq/:id`, `GET /api/public/content` (pÃºblico, con CORS y cache de 30 s).
- La landing (`daring-landing.html`) tiene `data-cms="key"` en cada elemento editable y `data-cms-faq` en el contenedor de preguntas. Un script al final carga `/api/public/content`, aplica los textos y popula el FAQ desde la base. Si la API falla, queda el contenido hardcoded (fallback).
- Panel: nueva secciÃ³n **Contenido** en el sidebar con:
  - Bloque "Textos de la pÃ¡gina": form con campos agrupados por secciÃ³n (Hero, Versatilidad, DiseÃ±o, Oferta, Cierre), cada uno con su **label descriptivo** que dice exactamente quÃ© parte de la pÃ¡gina modifica (ej: "TÃ­tulo del hero Â· primera lÃ­nea (aparece arriba de todo en la pÃ¡gina)", "Bullet 1 de lo que incluye la oferta", "Texto del botÃ³n de compra de la secciÃ³n Oferta"). Un solo botÃ³n "Guardar todos los cambios".
  - Bloque "Preguntas frecuentes": form para agregar + lista con cards por pregunta que permiten editar pregunta, respuesta, orden y publicado, con botones Guardar y Eliminar.
- La landing ya consume el contenido dinÃ¡mico: verificable en producciÃ³n (ver `/api/public/content`).

## Panel â€” LÃ­mites del plan arreglados

- Endpoint `GET /api/cloudflare/usage` ya no requiere `CF_API_TOKEN`/`CF_ACCOUNT_ID` (siempre mostraba "No disponible"). Ahora devuelve:
  - `plan: 'free'` y `plan_label: 'Cloudflare Free'`
  - R2: objetos, tamaÃ±o usado, `limit_label: '10 GB'`, `used_percent` calculado.
  - D1: filas estimadas, `limit_label: '5 GB'`.
  - Pages y Workers: lÃ­mites hardcoded del plan Free.
- Panel renderiza 4 grupos con tabla de uso vs lÃ­mite (objetos, espacio, lecturas, escrituras, requests, builds, dominios personalizados, etc.).

## Panel Admin â€” CMS de contenidos (Etapa 1.5)

- El panel permite editar los **textos visibles** de la landing y las **preguntas frecuentes** sin tocar cÃ³digo.
- MigraciÃ³n `0005_page_content.sql`: tablas `page_content` (clave/valor con secciÃ³n, label descriptivo, tipo y orden) y `page_faq` (pregunta + respuesta + orden + publicado).
- 27 campos `page_content` sembrados cubriendo todas las zonas editables: Hero (tÃ­tulo por lÃ­nea, subtÃ­tulo, CTAs, 4 badges), Platos (eyebrow, tÃ­tulo, lead), DiseÃ±o e ingenierÃ­a (eyebrow, tÃ­tulo, lead), Oferta (eyebrow, tÃ­tulo, 4 bullets, CTA, copy del lanzamiento), Cierre (tÃ­tulo, copy).
- 4 preguntas frecuentes iniciales sembradas (inducciÃ³n, envÃ­o, garantÃ­a, peso).
- Cada campo tiene un `label` que indica exactamente quÃ© parte de la pÃ¡gina modifica (ej: "TÃ­tulo del hero Â· primera lÃ­nea (aparece arriba de todo en la pÃ¡gina)"), de modo que el usuario no necesita adivinar dÃ³nde impacta el cambio.
- Endpoints:
  - `GET/PUT /api/content` (admin, con auth)
  - `GET /api/faq`, `POST /api/faq`, `GET/PATCH/DELETE /api/faq/:id`
  - `GET /api/public/content` (pÃºblico, CORS abierto, cache de 30 s)
- La landing tiene `data-cms="clave"` en cada elemento editable y `data-cms-faq` en el contenedor de FAQ. Un script al final del body consume `/api/public/content` y aplica los textos/popula el FAQ. Si la API falla, queda el contenido hardcoded como fallback (sin ruptura de la pÃ¡gina).
- Imagen mapping de la landing (quÃ© media de R2 va en quÃ© posiciÃ³n) sigue pendiente; las imÃ¡genes de la landing actualmente son hardcoded. EstÃ¡ contemplado para etapa 2.

## Panel Admin

- Usuario admin creado en D1 producciÃ³n: `irineomadrid.daring@gmail.com` (contraseÃ±a la conoce Ramiro; hash PBKDF2 en la tabla `admin_users`, login solo contra D1).
- **Aprendizaje clave:** Cloudflare Workers NO soporta PBKDF2 con mÃ¡s de 100.000 iteraciones (`NotSupportedError: iteration counts above 100000 are not supported`). `PASSWORD_ITERATIONS` fijado en 100.000 en `functions/api/_lib/auth.ts`; con 120.000 el hash se generaba bien en Node pero `verifyPassword` fallaba silenciosamente en producciÃ³n (el try/catch devolvÃ­a false).
- Login verificado de punta a punta en producciÃ³n el 28-ago-2026: `/api/auth/login` devuelve ok:true y `/api/admin/health` responde con la sesiÃ³n.
- **Fix importante (28-ago):** la cookie de sesiÃ³n tenÃ­a `Path=/admin`, asÃ­ que el navegador no la enviaba a `/api/auth/session` ni a los endpoints `/api/*` que usa el panel: se veÃ­a el panel un instante y volvÃ­a al login. Cambiado a `Path=/` en `functions/api/_lib/auth.ts`. Los tests anteriores no lo detectaron porque usaban curl con cookie forzada (ignora reglas de path); la verificaciÃ³n correcta se hace con cookie jar (`-c`/`-b`), que sÃ­ respeta paths.
- El formulario de login tiene botÃ³n de ojito para mostrar/ocultar la contraseÃ±a (`admin/login/index.html` + estilos en `admin/admin.css`).
- Los secrets `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` y `ADMIN_SESSION_SECRET` NO se usan en ningÃºn endpoint; no hace falta configurarlos.
- Usuario accede por `daring.com.uy/admin` (login en `/admin/login`).

## Entorno De Desarrollo (opencode)

- MCP de Mercado Pago configurado en `~/.config/opencode/opencode.json` con `Authorization: Bearer {env:MERCADOPAGO_ACCESS_TOKEN}`; requiere la variable de entorno `MERCADOPAGO_ACCESS_TOKEN` a nivel usuario.
- Skills de Cloudflare instaladas en `~/.agents/skills` (cloudflare, wrangler, durable-objects, workers-best-practices, web-perf, etc.).
- 5 servidores MCP de Cloudflare agregados a la config global de opencode: `cloudflare`, `cloudflare-docs` (pÃºblico), `cloudflare-bindings`, `cloudflare-builds`, `cloudflare-observability` (los de OAuth piden login al primer uso).
- `cloudflare-docs` MCP funciona en esta sesiÃ³n; los de OAuth aÃºn no fueron autenticados.
- Cuenta de Cloudflare: `irineomadrid.daring@gmail.com`, account ID `279493ad9c175d0a242f41a62789e83d`.

## DiseÃ±o Y Contenido

- Hero con el mensaje principal â€œUna sartÃ©n para todoâ€ y CTA de compra/ver en acciÃ³n.
- Intro de logo a pantalla completa, con scroll bloqueado hasta terminar.
- Hero construido por capas: fondo, sartÃ©n, pizza y logo.
- AnimaciÃ³n secuencial del fondo, producto, logo, tÃ­tulos y precio.
- Precio comparativo `$2.200` tachado y precio lanzamiento `$1.590`.
- Contador visual de 200 unidades disponibles.
- Chips del hero: 28 centÃ­metros de base, antiadherente premium, tapa de vidrio templado y doble agarre.
- Indicador de scroll en dos lÃ­neas, con dos flechas laterales y estilo bordÃ³.
- Banda animada de comidas entre el hero y la animaciÃ³n por scroll.
- AnimaciÃ³n por scroll de la sartÃ©n ubicada despuÃ©s de la banda.
- Se eliminÃ³ la secciÃ³n Beneficios Reales.
- Se eliminÃ³ la secciÃ³n Diferencial frente al mercado.
- DiseÃ±o e IngenierÃ­a quedÃ³ inmediatamente despuÃ©s de la animaciÃ³n.
- DiseÃ±o e IngenierÃ­a incluye la caracterÃ­stica 04: doble agarre, manija y agarradera para levantar la sartÃ©n con mÃ¡s firmeza y estabilidad.
- Ficha tÃ©cnica disponible dentro de un modal.
- Versatilidad presentada como carrusel de imÃ¡genes.
- Testimonios presentados como carrusel de videos.
- Historia de Daring narrada en primera persona como Irineo, con su imagen y nombre debajo de la imagen.
- FAQ reducido a las preguntas aprobadas.

## Checkout

- En escritorio: imagen del checkout a la izquierda y contenido a la derecha.
- En mÃ³vil: disposiciÃ³n vertical.
- Imagen de checkout: `assets/Imagenes nuevas/Checkout.png`.
- El bloque incluye solamente: sartÃ©n con 28 centÃ­metros de base, tapa de vidrio templado, menos tiempo en la cocina y mÃ¡s tiempo para vos.
- El formulario se abre desde el botÃ³n de compra.
- Campos del formulario: nombre completo, telÃ©fono, departamento, localidad, direcciÃ³n y correo electrÃ³nico.
- El formulario explica que el recetario de pizza y el video de armado se enviarÃ¡n al correo indicado.
- Los datos quedan preparados en memoria para la futura integraciÃ³n de Checkout Pro, sin redirecciÃ³n real todavÃ­a.

## Recursos

- Capas del hero: `assets/Imagen Hero/`.
- ImÃ¡genes nuevas: `assets/Imagenes nuevas/`.
- Carrusel de pizza: `assets/Imagenes nuevas/Carrusel pizza Daring/`.
- Imagen de Irineo: `assets/Imagenes nuevas/Irineo.jpeg`.
- Testimonios originales: `assets/Testimonios nuevos/`.
- Testimonios optimizados para web: `assets/Testimonios nuevos/web/`.
- Los videos de testimonios estÃ¡n en 720Ã—960, conservan audio y pesan aproximadamente 15 MB en total.
- Los testimonios no se reproducen automÃ¡ticamente al cargar.
- Si la persona inicia un testimonio y cambia de slide, el video anterior se pausa y el nuevo comienza a reproducirse.

## Rendimiento

- Intro desktop optimizado: `assets/intro-logo-desktop.mp4`.
- Intro mÃ³vil optimizado: `assets/intro-logo-mobile.mp4`.
- El intro original fue reemplazado en la pÃ¡gina por las versiones optimizadas con nombres simples.
- Frames mÃ³viles reducidos de aproximadamente 280 MB a 7,82 MB.
- Frames desktop reducidos de aproximadamente 29,2 MB a 6,98 MB.
- La pÃ¡gina carga solamente el primer frame y algunos frames cercanos al inicio.
- Los demÃ¡s frames se solicitan bajo demanda mientras la persona hace scroll.
- Se fuerza el inicio de la pÃ¡gina en `scrollY = 0` y se desactiva la restauraciÃ³n automÃ¡tica del scroll.

## Verificaciones

- JavaScript validado mediante `new Function` sobre los scripts de la landing.
- Landing verificada con HTTP 200 en el servidor local.
- Assets principales verificados con HTTP 200.
- `git diff --check` ejecutado sin errores de formato.

## Commits Relevantes

- `76203d6` â€” sincronizaciÃ³n inicial del estado del proyecto.
- `96f0687` â€” actualizaciÃ³n de la experiencia de la landing Daring.
- `05c807a` â€” optimizaciÃ³n de carga de medios.

## SesiÃ³n De Video AutomÃ¡tico

- La animaciÃ³n de scroll dejÃ³ de usar el canvas con frames como mecanismo activo.
- Se generaron `assets/story-scroll-mobile.mp4` y `assets/story-scroll-desktop.mp4`.
- El video mÃ³vil pesa aproximadamente 2,61 MB.
- El video desktop pesa aproximadamente 3,13 MB.
- El video se carga de forma diferida cuando la secciÃ³n se acerca al viewport.
- La reproducciÃ³n comienza cuando el 60% de la secciÃ³n estÃ¡ visible.
- Una vez iniciada, la reproducciÃ³n continÃºa aunque la persona siga desplazÃ¡ndose.
- Los cinco tÃ­tulos aparecen sincronizados con el tiempo del video.
- Se eliminaron los subtÃ­tulos de la animaciÃ³n.
- El cuarto tÃ­tulo dice â€œLista en menos de 15 minutos.â€.
- El video queda detenido en el Ãºltimo frame durante 2 segundos antes de reiniciar.
- La secciÃ³n mÃ³vil ocupa `100svh` para evitar espacios negros vacÃ­os.
- Se agregÃ³ el asset `assets/Videos/Landing Daring Movil 2.mp4` al proyecto.

## Pendientes (estado real - ver PENDIENTES.md para el detalle completo)

- Unica tarea de negocio pendiente: prueba de compra real con tarjeta y devolucion posterior (el usuario la ejecuta; verificacion tecnica acompanada).
- Revision visual en dispositivos reales (usuario).
- Opcional/etapa futura si se desea: ampliar el panel (mejoras menores). Telegram y multi-usuario admin descartados por decision del usuario.
- Mantener este archivo actualizado al finalizar cada sesion de trabajo.
- Conectar el formulario con el backend o servicio que recibirÃ¡ los datos de envÃ­o.
- Revisar visualmente en dispositivos reales despuÃ©s de cada cambio importante.
- Mantener este archivo actualizado al finalizar cada sesiÃ³n de trabajo.

## Primera Etapa Del Panel Admin

- Se creÃ³ la especificaciÃ³n en `docs/superpowers/specs/2026-08-16-daring-admin-panel-design.md`.
- Se creÃ³ el plan en `docs/superpowers/plans/2026-08-16-daring-admin-foundation.md`.
- Se creÃ³ la documentaciÃ³n de provisioning en `docs/superpowers/runbooks/admin-provisioning.md`.
- Se agregaron primitivas de autenticaciÃ³n en `functions/api/_lib/auth.ts`.
- Se agregaron respuestas JSON comunes en `functions/api/_lib/response.ts`.
- Se implementÃ³ PBKDF2 con salt aleatorio para hash de contraseÃ±as.
- Se implementaron sesiones D1 con cookies `HttpOnly`, `Secure`, `SameSite=Lax` y expiraciÃ³n de 7 dÃ­as.
- Se agregaron rutas `POST /api/auth/login`, `POST /api/auth/logout` y `GET /api/auth/session`.
- Se agregÃ³ `GET /api/admin/health`, protegido contra acceso sin sesiÃ³n.
- Se creÃ³ el panel inicial en `admin/index.html`.
- Se creÃ³ el estilo del panel en `admin/admin.css`.
- Se creÃ³ la lÃ³gica del panel en `admin/admin.js`.
- Se creÃ³ el login en `admin/login/index.html`.
- El panel verifica sesiÃ³n y API antes de mostrar su estado.
- El panel no muestra mÃ©tricas inventadas; indica que todavÃ­a no hay datos conectados.
- Se creÃ³ `scripts/create-admin-hash.mjs` para generar hashes sin guardar contraseÃ±as.
- Se creÃ³ `tests/auth-contract.mjs` para validar cookies y contratos bÃ¡sicos.
- La migraciÃ³n D1 local fue aplicada correctamente.
- Sin sesiÃ³n, `/api/auth/session` devuelve `authenticated:false`.
- Sin sesiÃ³n, `/api/admin/health` devuelve HTTP 401.
- `/admin` y `/admin/login` responden HTTP 200 en Wrangler local.
- Commits de esta etapa: `72ca034`, `dda2b9c`, `4130d23`, `4aa6ecd`, `feee1bd`.
- Pendiente: provisionar el usuario administrador real en D1 con correo y hash seguros.

## Segunda Etapa: AnalÃ­tica Y Dashboard

- Se creÃ³ el plan en `docs/superpowers/plans/2026-08-16-daring-analytics-dashboard.md`.
- Se creÃ³ la migraciÃ³n `migrations/0002_analytics_events.sql`.
- Se creÃ³ el helper de normalizaciÃ³n y agregaciÃ³n en `functions/api/metrics/_lib.ts`.
- Se creÃ³ el contrato `tests/metrics-contract.mjs`.
- Se agregÃ³ `POST /api/metrics/events`.
- El endpoint acepta Ãºnicamente eventos definidos y rechaza payloads desconocidos o demasiado grandes.
- La landing registra page view, clics de compra, ver en acciÃ³n, apertura/completado del checkout y consultas por WhatsApp.
- No se envÃ­an nombres, correos, telÃ©fonos, direcciones ni valores del formulario a la analÃ­tica.
- Los identificadores de visitante y sesiÃ³n son anÃ³nimos y se generan localmente.
- Se agregÃ³ `GET /api/metrics/summary`, protegido por sesiÃ³n.
- Se agregÃ³ `GET /api/alerts`, protegido por sesiÃ³n.
- El panel muestra visitas, clics de compra, formularios abiertos y formularios completados.
- El panel permite elegir 7 dÃ­as, 30 dÃ­as o todo el perÃ­odo.
- El panel muestra alertas explicadas en lenguaje simple cuando hay suficiente informaciÃ³n.
- Los pagos aprobados y la conversiÃ³n de pago permanecen como no disponibles hasta conectar Mercado Pago.
- La migraciÃ³n local de analÃ­tica fue aplicada correctamente.
- Eventos vÃ¡lidos devuelven HTTP 202 y eventos invÃ¡lidos HTTP 400.
- Endpoints protegidos sin sesiÃ³n devuelven HTTP 401.
- Commits de esta etapa: `8f15aa7`, `51a0e35`, `7bf7c26`, `68a2d2f`.

## Avances Recientes Del Panel

- Se creÃ³ el plan de analÃ­tica en `docs/superpowers/plans/2026-08-16-daring-analytics-dashboard.md`.
- Se agregÃ³ la tabla D1 `analytics_events` mediante la migraciÃ³n `0002_analytics_events.sql`.
- Se creÃ³ el endpoint pÃºblico `POST /api/metrics/events`.
- Se validan eventos permitidos, tamaÃ±o de payload y tipo de dispositivo.
- La landing registra visitas, clics de compra, ver en acciÃ³n, apertura/completado del checkout y consultas por WhatsApp.
- Los eventos no incluyen datos personales del formulario.
- Se creÃ³ `GET /api/metrics/summary` para el panel.
- Se creÃ³ `GET /api/alerts` con recomendaciones en lenguaje simple.
- El panel muestra visitas, clics, formularios y perÃ­odos de 7 dÃ­as, 30 dÃ­as o todo el perÃ­odo.
- El panel diferencia estados sin datos, errores y mÃ©tricas todavÃ­a no disponibles.
- Se verificÃ³ que eventos invÃ¡lidos devuelven HTTP 400 y endpoints protegidos sin sesiÃ³n HTTP 401.
- Commits adicionales de analÃ­tica: `eaa73dd`, `8f15aa7`, `51a0e35`, `7bf7c26`, `68a2d2f`, `25a8658`.

## OptimizaciÃ³n De AnimaciÃ³n

- Se reemplazÃ³ la animaciÃ³n activa de frames por videos optimizados controlados automÃ¡ticamente.
- Videos generados: `assets/story-scroll-mobile.mp4` y `assets/story-scroll-desktop.mp4`.
- El video mÃ³vil pesa aproximadamente 2,61 MB y el desktop 3,13 MB.
- La secciÃ³n precarga el video al acercarse y empieza cuando el 60% estÃ¡ visible.
- La reproducciÃ³n continÃºa aunque la persona siga desplazÃ¡ndose.
- Los textos se sincronizan con el tiempo del video.
- Se eliminaron los subtÃ­tulos y se mantienen solamente los tÃ­tulos grandes.
- El cuarto tÃ­tulo es â€œLista en menos de 15 minutos.â€.
- El video queda en el Ãºltimo frame durante 2 segundos antes de reiniciar.
- La secciÃ³n mÃ³vil ocupa `100svh`, evitando espacios negros vacÃ­os.
- Se generÃ³ una versiÃ³n desktop y mÃ³vil del intro del logo con nombres simples y bajo peso.
- La landing fue validada con JavaScript correcto y HTTP 200 local.

## R2

- Se verificÃ³ autenticaciÃ³n de Wrangler con la cuenta `irineomadrid.daring@gmail.com`.
- Account ID detectado: `279493ad9c175d0a242f41a62789e83d`.
- Se intentÃ³ consultar y preparar el bucket R2 `daring-media`.
- Cloudflare respondiÃ³ error `10042`: R2 estÃ¡ deshabilitado en la cuenta.
- No se creÃ³ el bucket ni se modificÃ³ la configuraciÃ³n de R2.
- Pendiente: activar R2 desde Cloudflare Dashboard y luego crear/conectar `daring-media`.

## R2 Activado

- R2 fue habilitado en la cuenta de Cloudflare.
- Se creÃ³ el bucket `daring-media`.
- Account ID: `279493ad9c175d0a242f41a62789e83d`.
- UbicaciÃ³n reportada por Cloudflare: `ENAM`.
- Clase de almacenamiento: `Standard`.
- Estado inicial: 0 objetos y 0 B.
- Se agregÃ³ el binding `MEDIA` a `wrangler.jsonc`.
- Wrangler local confirma `env.MEDIA (daring-media) R2 Bucket`.
- El bucket todavÃ­a no contiene imÃ¡genes ni videos.

## GestiÃ³n De Medios R2

- Se creÃ³ la migraciÃ³n `migrations/0003_media_content.sql`.
- `media_assets` ahora guarda ubicaciÃ³n, orden, publicaciÃ³n, tÃ­tulo y texto alternativo.
- Se creÃ³ `functions/api/media/_lib.ts` con validaciÃ³n de MIME, tamaÃ±o y ubicaciÃ³n.
- Se creÃ³ `GET/POST /api/media` para listar y cargar archivos.
- Se creÃ³ `POST /api/media/publish` para publicar u ocultar recursos.
- Se creÃ³ `GET /api/media/file` para servir Ãºnicamente recursos publicados.
- El panel permite seleccionar ubicaciÃ³n, orden, tÃ­tulo, texto alternativo y archivo.
- Las imÃ¡genes se convierten a WebP en el navegador antes de subirlas.
- Los videos se validan con un lÃ­mite de 12 MB antes de enviarlos.
- Los archivos se cargan a R2 como no publicados hasta revisiÃ³n.
- El panel muestra una vista previa y estado de publicaciÃ³n.
- El contrato `tests/media-contract.mjs` valida formatos, lÃ­mites y claves de objetos.
- La migraciÃ³n `0003` fue aplicada correctamente en D1 local.
- Los endpoints de medios sin sesiÃ³n responden HTTP 401.

## GestiÃ³n De Medios Y Uso Cloudflare

- Se agregÃ³ `POST /api/media/reorder` para cambiar el orden de los recursos.
- El panel muestra un campo de orden y botÃ³n â€œGuardar ordenâ€ para cada archivo.
- Se agregÃ³ `GET /api/cloudflare/usage` protegido por sesiÃ³n.
- El panel muestra cantidad y peso de objetos en R2.
- El panel muestra cantidad de eventos almacenados en D1.
- El panel informa cuando los lÃ­mites exactos del plan no estÃ¡n disponibles por falta de API configurada.
- Las imÃ¡genes se comprimen en el navegador a WebP antes de subirlas.
- Los videos se validan con lÃ­mite de 12 MB; no se agrega un compresor pesado al panel para proteger la velocidad de la web.
- Tests y sintaxis de media, panel y endpoints validados.

## Cierre De Etapa De Medios

- Los recursos publicados de R2 pueden reemplazar los carruseles pÃºblicos de pizza y testimonios.
- Si no existen recursos publicados, la landing conserva el contenido estÃ¡tico de respaldo.
- Se agregÃ³ orden manual, publicaciÃ³n/ocultamiento y eliminaciÃ³n de recursos.
- Se agregÃ³ consulta de uso de R2 y cantidad de eventos D1 en el panel.
- El lÃ­mite definitivo para videos subidos al panel es de 12 MB.
- La validaciÃ³n de video ocurre en el navegador y en el endpoint del servidor.
- Se evitÃ³ incorporar `ffmpeg.wasm` para no hacer pesado el panel.
- Commits recientes: `303e0b5`, `6fa8023`.

## IntegraciÃ³n PÃºblica De Medios

- Se creÃ³ `GET /api/media/public?placement=...` para recursos publicados.
- La landing puede reemplazar dinÃ¡micamente los carruseles de pizza y testimonios con recursos publicados en R2.
- Si no hay recursos publicados, se mantiene el contenido estÃ¡tico actual como respaldo.
- Se agregÃ³ eliminaciÃ³n de archivos desde `DELETE /api/media?id=...`.
- Se agregÃ³ ediciÃ³n de metadatos y publicaciÃ³n mediante `PATCH /api/media`.
- Se agregÃ³ `POST /api/media/reorder` para ordenar los recursos.
- El panel ahora permite guardar orden y eliminar recursos.
- Los datos dinÃ¡micos se escapan antes de insertarse en la landing.
- El endpoint pÃºblico solo entrega archivos con `published = 1`.

## Panel Admin - Etapa 2 (stock real + imagenes del CMS)

- Migracion 0006_stock_page_images.sql: producto sembrado (sarten-daring-28, SKU DARING-28, stock_total 200) y tabla page_images con 19 slots (hero fondo/sarten/pizza/logo, 5 slides de platos, diseno, oferta, foto de Irineo, logo de cierre, 6 videos de testimonios). Cada slot guarda default_path (imagen original del codigo) y media_id opcional hacia media_assets.
- Flujo de stock: create-preference rechaza con 409 si no hay stock disponible; al iniciar checkout reserva (+1 stock_reserved con movimiento); el webhook al aprobar convierte la reserva en venta (reserved -1, sold +1); si el pago se rechaza o cancela libera la reserva; si reembolsa devuelve la venta al stock. Guardia por transicion de estado (compara status previo y nuevo) para no duplicar movimientos si Mercado Pago reenvia el webhook.
- Endpoints nuevos: GET/PATCH /api/stock (producto + disponible + ultimos 20 movimientos; PATCH ajusta stock_total con motivo y audit_log), GET/PUT /api/images (slots con media asociada + opciones publicadas; PUT valida que el media este publicado, registra audit_log).
- /api/public/content ahora incluye ademas del contenido y FAQ: images (slot -> URL de /api/media/file?id=... solo si el media esta publicado, si no default), stock (available/total) y price_cents.
- Landing: 17 elementos con data-cms-img (imagenes y videos), y el script aplica imagenes, precio formateado (.price-chip strong y .price-big) y el contador de unidades (.flip-clock) con el stock disponible real.
- Panel: nueva seccion Stock con 4 KPIs (disponible/reservado/vendido/total), form de ajuste con motivo y tabla de ultimos movimientos. Seccion Contenido ahora tambien lista las 19 posiciones de imagenes/videos agrupadas por seccion: preview del archivo actual, selector de archivo publicado de la biblioteca (o Imagen original) y texto alternativo, con guardado por slot.
- Bug encontrado y corregido: imagesRows se iteraba sin .results -> TypeError 1101 en /api/public/content; detectado reproduciendo el error local con wrangler pages dev (importante: lanzar con CurrentDirectory del proyecto, si no intenta crear .wrangler en System32 y da EPERM).

## Cierre De Repositorio

- Los cambios estan commiteados localmente en 3 commits (9ecffdd checkout/stock/CMS, e664c89 panel admin, beab690 assets + docs) pero el push a GitHub quedo pendiente: la cuenta de gh autenticada en esta maquina (redulcerecetas) no tiene permiso sobre ramarketinguy/propuesta-daring (403).
- Para subir: git push origin main desde una terminal donde GitHub pida credenciales de ramarketinguy, o hacer gh auth login con esa cuenta y despues gh auth setup-git.

## Autenticacion GitHub

- gh CLI autenticado con la cuenta ramarketinguy (29-ago-2026) y configurado como credential helper de git (gh auth setup-git). La cuenta redulcerecetas sigue agregada pero inactiva.
- El push de todo el proyecto se realizo correctamente (6f0fc27..9e8afc4).
- Fix importante: admin.js tenia loadUso duplicado (vieja + nueva) -> SyntaxError que rompia TODO el modulo JS del panel (sin navegacion ni datos). El chequeo con new Function no lo detectaba (modo no estricto permite redeclaracion); usar node --check con .mjs para validar como modulo.

## Panel - Ajustes de usabilidad (29-ago-2026, segunda pasada)

- Tabs en la seccion Contenido: Textos / Imagenes / Preguntas frecuentes (antes las imagenes quedaban al final de un scroll largo).
- Hero unificado: los 4 slots separados (fondo, sarten, pizza, logo) se reemplazaron por un unico slot hero.animacion que acepta imagen O video de la biblioteca; si no tiene asignacion, la landing usa la animacion original de capas. La landing reemplaza el contenido de .hero-layered cuando hay asignacion (img o video autoplay muted loop, object-fit contain).
- Se quito el campo Texto alternativo de las cards de imagenes (el usuario no quiere editar alt en imagenes decorativas); el backend preserva el alt existente si no se envia.
- Fix de inputs blancos: los inputs sin atributo type no matcheaban selectores input[type=text] -> ahora .faq-admin-card input:not([type=checkbox]) y .settings-group textarea tambien tienen estilo oscuro.
- Secciones Contenido y Medios unificadas: la biblioteca (subir + archivos guardados) vive dentro de Contenido; la seccion Medios se elimino del sidebar.
- Migracion 0007_hero_unico.sql.

## Etapa 2 - Ajustes finales (29-ago-2026, tercera pasada)

- Slots de imagenes simplificados: se eliminaron hero.animacion, cierre.logo, diseno.imagen, oferta.imagen y los 11 slots fijos de carruseles (platos.slide_1-5, voces.video_1-6). Queda solo historia.foto (foto del dueÃ±o). La animacion del hero no se modifica desde el panel (solo por codigo).
- Los carruseles (platos y testimonios) se gestionan directo por placement de media_assets: la pestana Imagenes muestra el carrusel con botones Agregar (sube + publica en un paso), flechas para reordenar (intercambia sort_order) y Eliminar. Si no hay archivos publicados, la landing muestra las imagenes originales.
- Tabla nueva product_colors (migracion 0008): stock por color (rojo 100, negro 100 sembrados). create-preference chequea y reserva el stock del color elegido; el webhook aplica las transiciones (aprobado/rechazado/cancelado/reembolsado) por color usando el campo color de la orden.
- /api/stock devuelve colores + totales + movimientos; PATCH ajusta el stock_total de un color con motivo y audit_log. Bug corregido: el SELECT pedia columna updated_at que no existia en product_colors (1101).
- El stock total de la landing (contador) es la suma de los colores; /api/public/content tambien expone per_color por si se quiere mostrar disponibilidad por color cerca de los swatches.
- Leccion: despues de tocar functions/, SIEMPRE deployar con robocopy completo (no solo Copy-Item de archivos sueltos) para evitar drift entre el repo y staging.

## Fix de encoding de la landing (29-ago-2026)

- Causa: un script de PowerShell (fix-faq.ps1) releyo daring-landing.html con codificacion ANSI en vez de UTF-8 y lo reescribio, corrompiendo los 137 caracteres con acento/simbolos de TODO el archivo (sarten -> sartA(c)n, etc.).
- Reparacion: script Node (repair-mojibake.mjs en temp) que mapea las secuencias dobles (C3 83 C2 xx -> caracter correcto) y las triples para flechas/simbolos (E2 80 9C, E2 86 92, E2 97 86, etc.). 137 reemplazos, 0 secuencias restantes. Verificado en produccion: 15x sarten acentuado, 2x sartenes (plural correcto), 0 mojibake.
- Leccion: NUNCA leer/escribir la landing con Get-Content/Set-Content de PowerShell 5.1 sin especificar UTF8 explicito en AMBOS lados; usar Node o -Encoding UTF8 en lectura y escritura.
- Ademas: selects de formularios ahora oscuros (falta que cubra option nativa, hecho con select option), textos de estado vacio de carruseles corregidos.

## Carruseles migrados a la biblioteca (29-ago-2026)

- Los archivos originales de los carruseles (5 imagenes de platos + 6 videos de testimonios) se subieron a R2 y se registraron en media_assets con published=1, placement y sort_order 1..N. Asi aparecen en el panel (Contenido -> Imagenes) y se pueden eliminar, reordenar (flechas) o sustituir. Si se borran todos, la landing vuelve a las imagenes originales hardcoded (fallback de loadPublicMedia).
- Testimonio 6 web pesa 16 MB (por encima del limite de subida de 12 MB del panel): se cargo directo por wrangler. Ojo al reemplazarlo desde el panel: hay que subirlo comprimido o ampliara el limite.
- Fix de cierre: .close-copy tenia max-width 30rem que partia la frase; en pantallas >=720px va en una sola linea (white-space nowrap, max-width none).
- Nota tecnica: wrangler d1 execute --file falla con import polling failed; para inserts usar la API REST de D1 (POST /accounts/{id}/d1/database/{id}/query con {"sql": ...}) via Node fetch. media_type debe ser image/video (no el mime) por el CHECK constraint.

## Etapa 3 parcial (29-ago-2026)

- Editor de plantillas de mail en Configuracion: 4 campos nuevos (asunto/cuerpo del comprador y del dueno) guardados en settings (buyer_email_subject, buyer_email_html, owner_email_subject, owner_email_html). Cuerpo vacio = plantilla original de la marca. Tokens con {{...}}: comprador (nombre, color, orden, video_link, video) y dueno (cliente, mail, telefono, departamento, localidad, direccion, color, total, orden, pago, estado_mail). El webhook reemplaza tokens y cae a las plantillas built-in si el setting esta vacio.
- Vista de Auditoria: seccion nueva en el panel con GET /api/audit (filtro por accion + paginacion). El audit_log ya registra settings.update, orders.update, stock.update, faq.*, page_content.update, page_images.update, maintenance.cleanup.
- Limpieza: se quito el campo obsoleto Stock visible inicial de Configuracion (el contador de la landing usa el stock real por color). Endpoint admin POST /api/maintenance/cleanup: borra objetos R2 que no esten en media_assets (protegiendo entregables/); se borraron 11 huesrfanos de la subida fallida (~39 MB). R2 quedo en 13 objetos / 87 MB.
- Verificacion general: todos los endpoints 200, 0 mojibake en landing, sin funciones duplicadas en admin.js, favicon en las 3 paginas.
- Telegram y multi-usuario admin: descartados por decision del usuario.

## Fix de auditoria legible + biblioteca eliminada (29-ago-2026)

- Auditoria ahora muestra descripciones en espanol claro (ej: Se ajusto el stock del color rojo: de 100 a 150 unidades - motivo). El frontend traduce cada registro del audit_log segun su tipo. Filtro con etiquetas amigables y filtro backend por prefijo (action LIKE).
- Se elimino el panel Todos los archivos (biblioteca completa) por redundante: los carruseles tienen su propia gestion (agregar/reordenar/eliminar) y la foto del dueno su cambio directo. loadMedios eliminada de admin.js.
- Importante: los intentos de reemplazo con PowerShell corrompieron el encoding de admin.js (misma falla que la landing). Reparacion universal con script Node (mapeo cp1252 inverso -> bytes -> UTF-8). Leccion reforzada: NO usar Get-Content/Set-Content de PowerShell 5.1 sobre archivos UTF-8 sin BOM; usar Node o -Encoding UTF8 en ambos lados.

- Incidente: el panel Todos los archivos seguia apareciendo porque el deploy anterior solo copio admin.js al staging y el index.html quedo viejo. Regla definitiva: para deployar, SIEMPRE robocopy completo del proyecto a la carpeta staging (excluyendo .git/.wrangler/cloudflare-dist/node_modules/.dev.vars/videos pesados) y deployar esa carpeta; nunca confiar en copias sueltas de archivos individuales.

## SEO y posicionamiento en IAs (GEO) (29-ago-2026)

- Head de la landing: title optimizado (Daring: sarten 28 cm para pizza sin horno | Uruguay), meta description comercial, canonical, robots index/follow, Open Graph completo, Twitter card, theme-color.
- JSON-LD con @graph: Organization (fundador Irineo), WebSite, Product (nombre, marca, descripcion, imagen, Offer con precio 1590 UYU, disponibilidad InStock, shippingDetails con plazos, MerchantReturnPolicy 7 dias) y FAQPage con las 5 preguntas.
- Script del CMS actualiza el JSON-LD en tiempo real: precio (price_cents), disponibilidad (stock disponible -> InStock/OutOfStock) y las preguntas del FAQ dinamico.
- Archivos nuevos en la raiz: robots.txt (permite explicitamente GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, etc. y bloquea /admin), sitemap.xml y llms.txt (resumen de la marca/producto/preguntas para crawlers de IA).
- Panel y login con noindex, nofollow.
- PROBLEMA PENDIENTE DEL LADO DE CLOUDFLARE: la cuenta tiene activado AI Audit (Cloudflare) que INYECTA en robots.txt un bloque administrado que BLOQUEA GPTBot, ClaudeBot, Google-Extended, meta-externalagent, Bytespider, CCBot, Amazonbot y Applebot-Extended (ai-train=no). Contradice el objetivo de aparecer en IAs. El token de wrangler no tiene permiso para la API de AI Audit (403 en /zones/{id}/ai-audit/robots-txt). Solucion: desactivar el robots.txt administrado o permitir esos bots desde el dashboard: dash.cloudflare.com -> daring.com.uy -> AI Audit -> desactivar Managed robots.txt (o cambiar los bots a Allow).
- PerplexityBot y OAI-SearchBot (busqueda de ChatGPT) NO estan bloqueados por el bloque administrado: esas vias ya funcionan.
- Verificado en produccion: title/canonical/OG/Twitter servidos, JSON-LD completo (Organization, WebSite, Product con precio 1590 UYU, FAQPage con 5 preguntas), robots.txt, sitemap.xml (200) y llms.txt (200).
- Pendiente externo (fuera del codigo): crear Google Business Profile / Search Console y enviar sitemap; perfiles en redes citables; reseñas en Google. Eso es lo que mas pesa para que las IAs mencionen a Daring en consultas tipo 'donde compro una sarten para pizza sin horno en Uruguay'.

## Posicionamiento sarten antiadherente (29-ago-2026)

- Objetivo del usuario: posicionar a Daring para la busqueda sarten antiadherente (SEO + IA).
- Aplicado en: title (Daring: sarten antiadherente 28 cm | Pizza sin horno), meta description, og/twitter title, JSON-LD Product name + keywords (sarten antiadherente, sarten antiadherente 28 cm, sarten con tapa de vidrio, pizza sin horno, Uruguay), nueva pregunta frecuente en DB y schema (Daring es una sarten antiadherente premium...), llms.txt reescrito con enfoque antiadherente.
- robots.txt verificado limpio tras desactivar el robots.txt administrado de Cloudflare desde el dashboard (AI Audit): 0 bloqueos, todas las IAs permitidas (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.).
- Importante para el usuario: el siguiente paso de posicionamiento es EXTERNO al codigo: Google Business Profile, Search Console con el sitemap, redes y resenas. Eso es lo que las IAs citan ademas de la web.
- Nota tecnica: la landing tiene BOM UTF-8 (de PowerShell); los scripts de Node lo manejan bien. Con BOM, PowerShell 5.1 Get-Content lee UTF-8 correctamente (por eso el ultimo edit con PS no corrompio).

## Google Search Console (29-ago-2026)

- Meta de verificacion cargada en el head de la landing (lY8rV0VQ9D_ok7fijqZa0zdVAUu7mgjTPgeTXXrF25w) + archivo google4a7ae9e6139d186e.html en la raiz con contenido exacto.
- Problema conocido: Cloudflare Pages hace redirect 308 quitando el .html de la URL y Google NO sigue redirects al verificar. Fix: regla en _redirects (/google4a7ae9e6139d186e.html -> 200) + funcion de Pages functions/google4a7ae9e6139d186e.html.ts que sirve el contenido plano. Verificado 200 + contenido exacto.
- El usuario debe verificar en GSC usando el metodo Etiqueta HTML o Archivo HTML (NO el de Google Analytics, que no esta configurado). Luego: Sitemaps -> enviar sitemap.xml.

## Reparacion de encoding del panel (29-ago-2026, segunda pasada)

- El sidebar del panel mostraba ConfiguraciA3n / AuditorA-a: el script que agrego el noindex de Google (PowerShell Set-Content) corrompio admin/index.html, admin/login/index.html y admin/admin.css (79, 8 y 2 secuencias dañadas).
- Reparacion con script Node universal (repair-universal.mjs en temp): mapeo inverso cp1252 -> bytes -> decodificar UTF-8, descarta BOM, no guarda si algo queda sin reparar. Verificado en produccion: Configuracion/Auditoria/Envio correctos, 0 mojibake, noindex intacto.
- Estado verificado sin texto danado: landing (0), admin/index (0), admin/login (0), admin.css (0), admin.js (0, reparado antes), llms.txt (0).
- Script reutilizable: repair-universal.mjs toma cualquier archivo como argumento y solo guarda si la reparacion es completa.

## Acciones de Mercado Pago desde el panel (31-ago-2026)

- Primera venta real aprobada de punta a punta: Magdalena Bornia, rojo, .590 pagado por RedPagos (efectivo). RedPagos acredita con demora (~40 min: 12:50 pendiente -> 13:32 aprobado), el webhook funciono en ambas etapas, stock convertido, mails enviados (revisar spam del dueño si no aparecen).
- Libreria compartida functions/api/_lib/mp-sync.ts: sincronizarPago (consulta el pago a MP, aplica transicion de estado, movimientos de stock, eventos y mails) y reembolsarPago (reembolso completo por MP + venta a refunded + stock de vuelta + audit). El webhook quedo liviano usando la libreria.
- Endpoints nuevos: POST /api/orders/{id}/refresh (verifica el estado real del pago en MP y sincroniza) y POST /api/orders/{id}/refund (reembolso completo, solo ventas aprobadas, audit_log).
- Botones en el detalle de venta: Verificar pago en Mercado Pago (si tiene payment_id) y Devolver pago (solo ventas aprobadas, con confirmacion).
- Refresh probado con la venta real: previous=approved, current=approved, changed=false. Reembolso sin probar con plata real (se probara en la primera devolucion genuina).

- Cambio de estado de envio directo desde la tabla de Ventas (select inline en la columna Envio, guarda con PATCH al cambiar, sin abrir el detalle). Verificado 200.

## Rediseno del mail al comprador (31-ago-2026)

- Nuevo diseño oscuro tipográfico con la identidad de la marca: fondo #0d080a, tarjeta #1c0f13 con borde flame, wordmark D A R I N G espaciado en flame, resumen de compra (color + monto), tarjeta del recetario PDF, tarjeta del video con botón, y bloque DESTACADO de cuidados (limpieza, utensilios, fuego medio, apilado, no inducción) con borde flame lateral.
- Construido con técnicas de email seguro: tablas role=presentation, estilos inline, 560px, sin imágenes (tipográfico puro, a prueba de modo oscuro y de clientes que bloquean imágenes).
- El mail del dueño queda sin diseño (decisión del usuario).
- Probado enviando un mail real de prueba a ramarketing.uy@gmail.com con PDF adjunto (Resend id d92bc66a). Desplegado en producción: las próximas ventas usan el nuevo diseño.
- buildBuyerEmailHTML ahora es export (para pruebas); el sistema de plantillas editables sigue funcionando igual (vacío = nuevo diseño por defecto).

## Codigo de compra simple + mail v2 (31-ago-2026)

- Migracion 0009_order_code.sql: columna order_code en orders (indice unico) + backfill DR-000001 para la venta de Magdalena.
- create-preference genera codigo DR-XXXXXX (6 caracteres sin caracteres ambiguos, con reintentos por colision). El external_reference sigue siendo el UUID (webhook intacto).
- El codigo aparece en el detalle del panel (Compra DR-000001) y en los mails. Los links de descarga siguen usando el UUID internamente (invisible para el cliente).
- Mail al comprador v2: logo Daring (img hospedada en el dominio, alt si se bloquea), tono profesional (sin expresiones coloquiales), boton verde de WhatsApp con mensaje pre-cargado incluyendo el codigo de compra, y el codigo simple en el pie.
- Token {{orden}} de la plantilla editable ahora devuelve el codigo simple.
- Probado con segundo mail de prueba a ramarketing.uy@gmail.com (id f70fbddf).
- Importante: NO usar PowerShell Get-Content/Set-Content sobre los archivos del proyecto (corrompe UTF-8 sin BOM); usar Node o el Edit tool. Un BOM residual en admin.js/landing salva la situacion en algunos casos, pero no es garantia.

## Mail v3 - recetario con boton en vez de adjunto (31-ago-2026)

- El PDF del recetario ya no va adjunto al mail: la tarjeta muestra el boton Descargar recetario (mismo mecanismo que el video: /api/descargas/recetario?orden=UUID, habilitado solo con pago aprobado). El mail queda liviano y evita filtros de spam por adjuntos.
- enviarEmailComprador sin logicas de adjunto; PDF_KEY eliminado; el PDF sigue en R2 entregables/recetario-pizza-daring.pdf servido por el endpoint de descargas.
- Probado con mail real a ramarketing.uy@gmail.com (Resend id 7c26a567). Desplegado.

## Telegram activado (31-ago-2026)

- Bot Daring Avisos (@DaringAvisosBot) creado por Irineo. Token + chat id (5754401318) cargados en settings via API, telegram_enabled=true. Mensaje de prueba enviado y recibido OK.
- El aviso de Telegram se envia en mp-sync al aprobarse una venta (cliente, correo, color, total, pago, orden), junto con los mails. Si Telegram falla, el resto sigue funcionando.
- Configurable desde Configuracion -> Telegram (token, chat id, activar/desactivar).

## Panel simplificado (01-sep-2026)

- Se elimino el editor de plantillas de mail de Configuracion (decision del usuario: riesgo de que el cliente rompa algo). Las plantillas del codigo siguen siendo la fuente, con fallback incorporado.
- Telegram en Configuracion quedo solo como interruptor activar/desactivar (telegram_enabled). El token y el chat id siguen guardados en settings pero ya no se muestran en el panel. El aviso por Telegram sigue funcionando igual.

## Comision de Mercado Pago e ingresos netos (01-sep-2026)

- Migracion 0010_mp_fee.sql: columna mp_fee_cents en orders.
- sincronizarPago extrae fee_details (tipo fee) del pago de MP y guarda mp_fee_cents en cada sincronizacion (webhook o boton Verificar pago). Refrescando una venta vieja se completa el dato.
- /api/orders devuelve revenue_cents (bruto), fees_cents y net_cents (bruto - comision) sobre ventas aprobadas. KPI Ingresos ahora es Ingresos netos con la comision visible en el subtitulo, en Resumen y Ventas. Detalle de venta muestra Comision y Neto recibido. CSV con comision_mp_cents y neto_cents.
- Resultado real verificado con la venta de Magdalena (DR-000001, RedPagos/tarjeta): mp_fee_cents = 0 -> neto .590. MP no desconto comision en este pago segun su API.
- Aclaracion honesta: si MP factura comisiones en el resumen mensual en vez de por pago, eso no figura en el objeto del pago; el sistema refleja lo que MP reporta por pago.

## Pixel de Meta + estado de la API de conversiones (03-sep-2026)

- Pixel de Meta instalado en `daring-landing.html` (única página pública; propuesta/auditoria/admin quedan sin pixel a propósito para no ensuciar datos). ID de pixel: `1395478826107134`.
- Código base entre las etiquetas `<head>` (después del meta viewport, antes del favicon) + `<noscript>` de respaldo, con PageView incluido. Instalado una sola vez por página, según las reglas de instalación de Meta.
- Eventos estándar agregados (embudo completo): `ViewContent` al cargar la página (con value y currency UYU), `InitiateCheckout` justo antes de redirigir a Mercado Pago (solo si la preferencia se crea OK), `Purchase` cuando la landing vuelve con `?pago=aprobado`, y `Contact` al clickear el WhatsApp de la barra inferior.
- El valor de los eventos es dinámico: `window.daringPriceUYU` se setea con el precio que devuelve `/api/public/content` (fallback 1590 si la API no responde).
- Helper `fbqTrack` con guard `typeof fbq === 'function'` para que nada se rompa si el script del pixel falla al cargar.
- Desplegado y verificado en producción (deployment `f2190326`, 03-sep-2026): los 8 checks del HTML servido en https://daring.com.uy/ OK (pixel base, PageView, fbevents.js, noscript, y los 4 eventos estándar). `/api/health` 200.
- API de conversiones (CAPI): **NO conectada**. No hay ninguna llamada a `graph.facebook.com` ni token de Meta en el backend; todos los eventos viajan solo desde el navegador. Para conectarla hace falta: 1) token de Meta de la cuenta dueña del pixel (System User del Business Manager de Daring con permiso `ads_management`, o token de usuario), 2) enviar `Purchase` server-side desde `functions/api/webhooks/mercadopago.ts` al aprobarse el pago, usando el mismo `event_id` que el Purchase del navegador para que Meta deduplique. Ojo: la app "Ramarketer" de Meta sigue suspendida (apelación en curso), el token tiene que salir del BM propio de Daring.
- Pendiente: verificar el pixel en el Administrador de eventos de Meta (pestaña Probar eventos) o con la extensión Meta Pixel Helper, con tráfico real.

## Home en dominio limpio + GSC verificada (03-sep-2026)
- La verificacion de Google Search Console quedo ACEPTADA en la propiedad https://daring.com.uy/daring-landing (tras servir el archivo de verificacion en esa ruta via function).
- Causa de fondo de la URL fea: la home (/) hacia 308 a /daring-landing (regla _redirects + pretty-URL de Pages). Solucion: daring-landing.html renombrado a index.html (Pages lo sirve en / con 200 directo, sin redirect) y _redirects ahora manda /daring-landing y /daring-landing.html con 301 a / (consolida SEO y ads en el dominio limpio).
- vercel.json actualizado a /index.html. /api/health, pixel, eventos y archivos de verificacion re-verificados en produccion (deployment 931dca34): home 200 sin redirect, urls viejas 301 a /, verificacion GSC 200 GET+HEAD en ambas rutas, api/health 200.
- Los dos archivos de verificacion GSC se sirven via Pages Functions (functions/google83c5729b27d1923d.html.ts y functions/daring-landing/google83c5729b27d1923d.html.ts), no como archivos estaticos (el estatico hacia 308 por pretty-URL y Google no lo aceptaba).
