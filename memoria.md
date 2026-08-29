# Memoria Del Proyecto Daring

Última actualización: 2026-08-29 (sesión 3: etapa 1.5 del panel + CMS de contenidos + límites del plan + precio en pesos)

## Estado Actual

- Proyecto: landing de venta de la sartén Daring.
- Archivo principal: `daring-landing.html`.
- Servidor local habitual: `http://localhost:4173/daring-landing.html` o `wrangler pages dev --port 8788`.
- Repositorio: `https://github.com/ramarketinguy/propuesta-daring.git`.
- Rama principal: `main`.
- El precio de lanzamiento es `$1.590 UYU` (configurable desde el panel; se guarda en centavos).
- Checkout Pro de Mercado Pago integrado, desplegado y verificado en producción (ver sección Checkout Pro).
- Dominio oficial `daring.com.uy` en Cloudflare Pages (sección Dominio).
- Resend configurado con dominio verificado, clave cargada y envío automático funcionando (sección Resend).
- Panel admin rediseñado como SPA con sidebar, 7 secciones, dark/light, límites de plan visibles, CMS de contenidos de la landing (sección Panel Admin).
- Landing consume contenidos dinámicos desde la base con fallback al HTML hardcoded.
- WhatsApp funciona únicamente como canal de consultas desde la barra inferior.

## Checkout Pro (Mercado Pago)

- Aplicación Mercado Pago: "Daring web", App ID `1304026149030121`.
- Token de producción `APP_USR-` guardado en `.dev.vars` local y como secreto `MERCADOPAGO_ACCESS_TOKEN` en Cloudflare Pages.
- Endpoint `POST /api/checkout/create-preference` (`functions/api/checkout/create-preference.ts`).
- El endpoint valida los datos del formulario, crea la orden con estado `checkout_started` en D1 y la preferencia en Mercado Pago.
- Precio fijo `1590 UYU`, cantidad 1, `statement_descriptor` DARING.
- `back_urls` vuelven a la landing con `?pago=aprobado|pendiente|rechazado` y la landing muestra un aviso fijo con el resultado.
- En origen local (http) se usan URLs públicas de reemplazo y se omite `notification_url`, porque Mercado Pago rechaza URLs locales.
- En producción se envía `notification_url` apuntando a `/api/webhooks/mercadopago`.
- Endpoint `POST /api/webhooks/mercadopago` (`functions/api/webhooks/mercadopago.ts`).
- El webhook consulta el pago a la API de Mercado Pago, actualiza la orden por `external_reference` y registra el evento en `checkout_events` con control de duplicados.
- La landing envía el formulario a `create-preference` y redirige a `init_point` (o `sandbox_init_point` si no hay producción).
- MCP de Mercado Pago conectado en opencode con token común: listar apps funciona, pero `get_credentials` y `save_webhook` exigen conexión OAuth.
- Desplegado a Cloudflare Pages el 26-ago-2026 (deployment `b8e2e95e`): health OK, validación OK y preferencia real generada en producción.
- Orden de prueba de producción borrada de D1 remoto; solo quedan órdenes reales.
- Los videos originales de más de 25 MB (límite de Pages) no se publican; la landing usa las versiones optimizadas de `Testimonios nuevos/web/`.
- El despliegue a Pages se hace con una copia en carpeta temporal sin `.git`, `.wrangler`, `cloudflare-dist`, `.dev.vars` ni los videos pesados (ver "Cómo desplegar" más abajo).
- Pendiente: activar la URL de webhook en el panel de Mercado Pago y probar un pago real de prueba.
- Migraciones 0002 y 0003 aplicadas también en D1 remoto de producción.

## Cómo Desplegar

- La carpeta raíz contiene archivos que Pages rechaza (videos de más de 25 MB), así que no se publica directo.
- Procedimiento usado: `robocopy` a una carpeta temporal excluyendo `.git`, `.wrangler`, `cloudflare-dist`, `.dev.vars` y los MP4 de la raíz de `Testimonios nuevos`; luego `wrangler pages deploy <carpeta> --project-name daring-landing`.
- Wrangler instalado en `%TEMP%\opencode\wr` (no hay `package.json` en el proyecto).
- Login de wrangler: cuenta `irineomadrid.daring@gmail.com`, credenciales en `%APPDATA%\xdg.config\.wrangler\config\default.toml`.

## Dominio Oficial (daring.com.uy)

- Dominio comprado en dominios.uy (NIC Uruguay), a nombre de Irineo (`irineomadridsosa@gmail.com`), vence 19/11/2026.
- Agregado a la cuenta de Cloudflare; zone ID `c3ecd843c82e1f2dc4e5ff61b8fae17c`; zona **activa** desde el 27-ago-2026.
- Nameservers: `abby.ns.cloudflare.com` y `alexis.ns.cloudflare.com` (cargados en dominios.uy y propagados).
- `daring.com.uy` y `www.daring.com.uy` agregados como custom domains del proyecto Pages `daring-landing` y **activos y funcionando** (verificado el 27-ago-2026).
- Antes apuntaba a un WordPress viejo en Hostinger; el usuario borró los registros A/AAAA/CNAME viejos y creó dos CNAME (@ y www → `daring-landing.pages.dev`, Proxied).
- Verificado: landing actual con título correcto en ambos dominios, `/api/health` 200 y webhook respondiendo desde el dominio definitivo.
- Importante: el token de wrangler NO tiene permiso DNS sobre la zona (403); los cambios de DNS van por dashboard o con un token API con permisos de DNS.
- El checkout generado desde el dominio nuevo usa `daring.com.uy` automáticamente en `back_urls` y `notification_url` (se arman con el origen de cada pedido).
- El token OAuth de wrangler vence seguido; si la API da 403/"Authentication error", correr cualquier comando de wrangler para refrescarlo antes de usar la API.

## Resend (Email)

- Cuenta de Resend creada por Ramiro; clave API vigente: la primera quedó inaccesible (Resend no la vuelve a mostrar), se creó una nueva.
- Clave cargada en `.dev.vars` local y como secreto `RESEND_API_KEY` en Cloudflare Pages (ambos verificados).
- Dominio `daring.com.uy` agregado y **verificado** en Resend (DKIM, SPF y MX en verde; región São Paulo).
- Los registros DNS los cargó Resend automáticamente en Cloudflare (botón Auto-configure).
- El plan "Enable Sending" quedó activado; "Enable Receiving" (recibir mails) quedó apagado y no hace falta para el flujo actual.
- Remitente del mail de compra: `Daring <recetario@daring.com.uy>`.

## Envío Automático De Entregables

- Recetario PDF: `assets/Pizza daring.pdf` (5,9 MB), subido a R2 como `entregables/recetario-pizza-daring.pdf`.
- Video de armado: `assets/Armado sartén .mp4` (42,2 MB), subido a R2 como `entregables/video-armado-daring.mp4`. (Importante: wrangler 4.126 se rompe con "é"/espacios en el nombre del archivo al subir; copiar a un nombre simple antes de `r2 object put`.)
- Endpoint `GET /api/descargas/[type]?orden=<uuid>` (`functions/api/descargas/[type].ts`): sirve `video-armado` y `recetario` desde R2 solo si la orden existe con estado `approved`; inválido 400, sin pago aprobado 403, archivo faltante 404.
- El webhook (`functions/api/webhooks/mercadopago.ts`) al aprobarse un pago: envía mail al COMPRADOR con el PDF adjunto y botón de descarga del video, y mail al DUEÑO (`owner_email` desde settings, remitente `owner_from_email`/`owner_from_name` desde settings) con la orden completa: datos del formulario, teléfono, dirección, color elegido, total, número de orden y pago MP. Ambos quedan en `email_deliveries` con provider `resend-buyer` / `resend-owner` y control anti-duplicados.
- Si `owner_email_enabled` está en `false`, no se manda el mail al dueño.
- El mail al comprador usa remitente `buyer_from_email`/`buyer_from_name` desde settings.
- El precio se lee de `settings.price_cents` (default 159000); `create-preference` ya no tiene el precio hardcoded.
- Desplegado y verificado en producción el 28-ago-2026.

## Panel Admin — Etapa 1

- Migración nueva `0004_admin_panel_etapa1.sql` aplicada en D1 producción: columnas `shipping_status`, `tracking_number`, `admin_notes` en `orders`; tabla `settings` (clave/valor con categoría); tabla `audit_log`.
- 13 settings sembradas en 4 categorías: `producto` (precio, moneda, stock visible), `contacto` (WhatsApp, mail del dueño, activar avisos), `resend` (remitente comprador y dueño), `notifications` (Telegram). Cambiables desde el panel.
- Endpoints nuevos: `GET/PATCH /api/orders/:id` (detalle con timeline y emails + cambiar estado de envío, tracking y notas), `GET /api/orders` (lista con filtros: búsqueda, estado, período + contadores y revenue), `GET /api/settings`, `PUT /api/settings` (validado por tipo, registra audit_log), `GET /api/emails` (lista con filtros + contadores buyer/owner).
- `create-preference` lee precio y moneda desde `settings`; ya no están hardcoded.
- Webhook lee remitentes y mail del dueño desde `settings`.
- Panel rediseñado como SPA con sidebar y 6 secciones: Resumen, Ventas, Configuración, Emails enviados, Medios, Uso. Estilo back-office denso (tipografía Inter, colores tipo dashboard). Hash routing (`#ventas`, `#configuracion`, etc.).
- Ventas: 4 KPI cards (Iniciados / Concluidas / Rechazadas / Ingresos), tabla con búsqueda por mail/nombre/orden, filtros por estado y período, paginación, detalle con timeline + envío + notas, exportar CSV.
- Configuración: form con Producto / Contacto / Remitentes Resend (Telegram queda para etapa 3). El campo "Precio" se muestra en **pesos uruguayos** (no centavos) y el backend convierte a centavos antes de guardar.
- Emails enviados: contadores buyer/owner, tabla con filtros y paginación.
- Logs de auditoría: cualquier cambio en settings y orders se registra en `audit_log`.
- Login del panel con Path=/ (corregido el 28-ago para que la sesión sirva también a `/api/auth/session` y `/api/admin/health`).

## Panel Admin — Etapa 1.5 (CMS de la landing)

- Migración `0005_page_content.sql`: tablas `page_content` (textos con sección, label, type, sort_order) y `page_faq` (preguntas con orden y published).
- 27 campos `page_content` sembrados cubriendo Hero, Platos, Diseño, Oferta, Cierre (incluye título del hero por línea, subtítulo, badges, bullets de la oferta, CTA, copy del lanzamiento, etc.) y 4 preguntas frecuentes iniciales.
- Endpoints nuevos: `GET/PUT /api/content` (admin), `GET /api/faq`, `POST /api/faq`, `GET/PATCH/DELETE /api/faq/:id`, `GET /api/public/content` (público, con CORS y cache de 30 s).
- La landing (`daring-landing.html`) tiene `data-cms="key"` en cada elemento editable y `data-cms-faq` en el contenedor de preguntas. Un script al final carga `/api/public/content`, aplica los textos y popula el FAQ desde la base. Si la API falla, queda el contenido hardcoded (fallback).
- Panel: nueva sección **Contenido** en el sidebar con:
  - Bloque "Textos de la página": form con campos agrupados por sección (Hero, Versatilidad, Diseño, Oferta, Cierre), cada uno con su **label descriptivo** que dice exactamente qué parte de la página modifica (ej: "Título del hero · primera línea (aparece arriba de todo en la página)", "Bullet 1 de lo que incluye la oferta", "Texto del botón de compra de la sección Oferta"). Un solo botón "Guardar todos los cambios".
  - Bloque "Preguntas frecuentes": form para agregar + lista con cards por pregunta que permiten editar pregunta, respuesta, orden y publicado, con botones Guardar y Eliminar.
- La landing ya consume el contenido dinámico: verificable en producción (ver `/api/public/content`).

## Panel — Límites del plan arreglados

- Endpoint `GET /api/cloudflare/usage` ya no requiere `CF_API_TOKEN`/`CF_ACCOUNT_ID` (siempre mostraba "No disponible"). Ahora devuelve:
  - `plan: 'free'` y `plan_label: 'Cloudflare Free'`
  - R2: objetos, tamaño usado, `limit_label: '10 GB'`, `used_percent` calculado.
  - D1: filas estimadas, `limit_label: '5 GB'`.
  - Pages y Workers: límites hardcoded del plan Free.
- Panel renderiza 4 grupos con tabla de uso vs límite (objetos, espacio, lecturas, escrituras, requests, builds, dominios personalizados, etc.).

## Panel Admin — CMS de contenidos (Etapa 1.5)

- El panel permite editar los **textos visibles** de la landing y las **preguntas frecuentes** sin tocar código.
- Migración `0005_page_content.sql`: tablas `page_content` (clave/valor con sección, label descriptivo, tipo y orden) y `page_faq` (pregunta + respuesta + orden + publicado).
- 27 campos `page_content` sembrados cubriendo todas las zonas editables: Hero (título por línea, subtítulo, CTAs, 4 badges), Platos (eyebrow, título, lead), Diseño e ingeniería (eyebrow, título, lead), Oferta (eyebrow, título, 4 bullets, CTA, copy del lanzamiento), Cierre (título, copy).
- 4 preguntas frecuentes iniciales sembradas (inducción, envío, garantía, peso).
- Cada campo tiene un `label` que indica exactamente qué parte de la página modifica (ej: "Título del hero · primera línea (aparece arriba de todo en la página)"), de modo que el usuario no necesita adivinar dónde impacta el cambio.
- Endpoints:
  - `GET/PUT /api/content` (admin, con auth)
  - `GET /api/faq`, `POST /api/faq`, `GET/PATCH/DELETE /api/faq/:id`
  - `GET /api/public/content` (público, CORS abierto, cache de 30 s)
- La landing tiene `data-cms="clave"` en cada elemento editable y `data-cms-faq` en el contenedor de FAQ. Un script al final del body consume `/api/public/content` y aplica los textos/popula el FAQ. Si la API falla, queda el contenido hardcoded como fallback (sin ruptura de la página).
- Imagen mapping de la landing (qué media de R2 va en qué posición) sigue pendiente; las imágenes de la landing actualmente son hardcoded. Está contemplado para etapa 2.

## Panel Admin

- Usuario admin creado en D1 producción: `irineomadrid.daring@gmail.com` (contraseña la conoce Ramiro; hash PBKDF2 en la tabla `admin_users`, login solo contra D1).
- **Aprendizaje clave:** Cloudflare Workers NO soporta PBKDF2 con más de 100.000 iteraciones (`NotSupportedError: iteration counts above 100000 are not supported`). `PASSWORD_ITERATIONS` fijado en 100.000 en `functions/api/_lib/auth.ts`; con 120.000 el hash se generaba bien en Node pero `verifyPassword` fallaba silenciosamente en producción (el try/catch devolvía false).
- Login verificado de punta a punta en producción el 28-ago-2026: `/api/auth/login` devuelve ok:true y `/api/admin/health` responde con la sesión.
- **Fix importante (28-ago):** la cookie de sesión tenía `Path=/admin`, así que el navegador no la enviaba a `/api/auth/session` ni a los endpoints `/api/*` que usa el panel: se veía el panel un instante y volvía al login. Cambiado a `Path=/` en `functions/api/_lib/auth.ts`. Los tests anteriores no lo detectaron porque usaban curl con cookie forzada (ignora reglas de path); la verificación correcta se hace con cookie jar (`-c`/`-b`), que sí respeta paths.
- El formulario de login tiene botón de ojito para mostrar/ocultar la contraseña (`admin/login/index.html` + estilos en `admin/admin.css`).
- Los secrets `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` y `ADMIN_SESSION_SECRET` NO se usan en ningún endpoint; no hace falta configurarlos.
- Usuario accede por `daring.com.uy/admin` (login en `/admin/login`).

## Entorno De Desarrollo (opencode)

- MCP de Mercado Pago configurado en `~/.config/opencode/opencode.json` con `Authorization: Bearer {env:MERCADOPAGO_ACCESS_TOKEN}`; requiere la variable de entorno `MERCADOPAGO_ACCESS_TOKEN` a nivel usuario.
- Skills de Cloudflare instaladas en `~/.agents/skills` (cloudflare, wrangler, durable-objects, workers-best-practices, web-perf, etc.).
- 5 servidores MCP de Cloudflare agregados a la config global de opencode: `cloudflare`, `cloudflare-docs` (público), `cloudflare-bindings`, `cloudflare-builds`, `cloudflare-observability` (los de OAuth piden login al primer uso).
- `cloudflare-docs` MCP funciona en esta sesión; los de OAuth aún no fueron autenticados.
- Cuenta de Cloudflare: `irineomadrid.daring@gmail.com`, account ID `279493ad9c175d0a242f41a62789e83d`.

## Diseño Y Contenido

- Hero con el mensaje principal “Una sartén para todo” y CTA de compra/ver en acción.
- Intro de logo a pantalla completa, con scroll bloqueado hasta terminar.
- Hero construido por capas: fondo, sartén, pizza y logo.
- Animación secuencial del fondo, producto, logo, títulos y precio.
- Precio comparativo `$2.200` tachado y precio lanzamiento `$1.590`.
- Contador visual de 200 unidades disponibles.
- Chips del hero: 28 centímetros de base, antiadherente premium, tapa de vidrio templado y doble agarre.
- Indicador de scroll en dos líneas, con dos flechas laterales y estilo bordó.
- Banda animada de comidas entre el hero y la animación por scroll.
- Animación por scroll de la sartén ubicada después de la banda.
- Se eliminó la sección Beneficios Reales.
- Se eliminó la sección Diferencial frente al mercado.
- Diseño e Ingeniería quedó inmediatamente después de la animación.
- Diseño e Ingeniería incluye la característica 04: doble agarre, manija y agarradera para levantar la sartén con más firmeza y estabilidad.
- Ficha técnica disponible dentro de un modal.
- Versatilidad presentada como carrusel de imágenes.
- Testimonios presentados como carrusel de videos.
- Historia de Daring narrada en primera persona como Irineo, con su imagen y nombre debajo de la imagen.
- FAQ reducido a las preguntas aprobadas.

## Checkout

- En escritorio: imagen del checkout a la izquierda y contenido a la derecha.
- En móvil: disposición vertical.
- Imagen de checkout: `assets/Imagenes nuevas/Checkout.png`.
- El bloque incluye solamente: sartén con 28 centímetros de base, tapa de vidrio templado, menos tiempo en la cocina y más tiempo para vos.
- El formulario se abre desde el botón de compra.
- Campos del formulario: nombre completo, teléfono, departamento, localidad, dirección y correo electrónico.
- El formulario explica que el recetario de pizza y el video de armado se enviarán al correo indicado.
- Los datos quedan preparados en memoria para la futura integración de Checkout Pro, sin redirección real todavía.

## Recursos

- Capas del hero: `assets/Imagen Hero/`.
- Imágenes nuevas: `assets/Imagenes nuevas/`.
- Carrusel de pizza: `assets/Imagenes nuevas/Carrusel pizza Daring/`.
- Imagen de Irineo: `assets/Imagenes nuevas/Irineo.jpeg`.
- Testimonios originales: `assets/Testimonios nuevos/`.
- Testimonios optimizados para web: `assets/Testimonios nuevos/web/`.
- Los videos de testimonios están en 720×960, conservan audio y pesan aproximadamente 15 MB en total.
- Los testimonios no se reproducen automáticamente al cargar.
- Si la persona inicia un testimonio y cambia de slide, el video anterior se pausa y el nuevo comienza a reproducirse.

## Rendimiento

- Intro desktop optimizado: `assets/intro-logo-desktop.mp4`.
- Intro móvil optimizado: `assets/intro-logo-mobile.mp4`.
- El intro original fue reemplazado en la página por las versiones optimizadas con nombres simples.
- Frames móviles reducidos de aproximadamente 280 MB a 7,82 MB.
- Frames desktop reducidos de aproximadamente 29,2 MB a 6,98 MB.
- La página carga solamente el primer frame y algunos frames cercanos al inicio.
- Los demás frames se solicitan bajo demanda mientras la persona hace scroll.
- Se fuerza el inicio de la página en `scrollY = 0` y se desactiva la restauración automática del scroll.

## Verificaciones

- JavaScript validado mediante `new Function` sobre los scripts de la landing.
- Landing verificada con HTTP 200 en el servidor local.
- Assets principales verificados con HTTP 200.
- `git diff --check` ejecutado sin errores de formato.

## Commits Relevantes

- `76203d6` — sincronización inicial del estado del proyecto.
- `96f0687` — actualización de la experiencia de la landing Daring.
- `05c807a` — optimización de carga de medios.

## Sesión De Video Automático

- La animación de scroll dejó de usar el canvas con frames como mecanismo activo.
- Se generaron `assets/story-scroll-mobile.mp4` y `assets/story-scroll-desktop.mp4`.
- El video móvil pesa aproximadamente 2,61 MB.
- El video desktop pesa aproximadamente 3,13 MB.
- El video se carga de forma diferida cuando la sección se acerca al viewport.
- La reproducción comienza cuando el 60% de la sección está visible.
- Una vez iniciada, la reproducción continúa aunque la persona siga desplazándose.
- Los cinco títulos aparecen sincronizados con el tiempo del video.
- Se eliminaron los subtítulos de la animación.
- El cuarto título dice “Lista en menos de 15 minutos.”.
- El video queda detenido en el último frame durante 2 segundos antes de reiniciar.
- La sección móvil ocupa `100svh` para evitar espacios negros vacíos.
- Se agregó el asset `assets/Videos/Landing Daring Movil 2.mp4` al proyecto.

## Pendientes

- Integrar la URL y el flujo real de Mercado Pago Checkout Pro.
- Conectar el formulario con el backend o servicio que recibirá los datos de envío.
- Revisar visualmente en dispositivos reales después de cada cambio importante.
- Mantener este archivo actualizado al finalizar cada sesión de trabajo.

## Primera Etapa Del Panel Admin

- Se creó la especificación en `docs/superpowers/specs/2026-08-16-daring-admin-panel-design.md`.
- Se creó el plan en `docs/superpowers/plans/2026-08-16-daring-admin-foundation.md`.
- Se creó la documentación de provisioning en `docs/superpowers/runbooks/admin-provisioning.md`.
- Se agregaron primitivas de autenticación en `functions/api/_lib/auth.ts`.
- Se agregaron respuestas JSON comunes en `functions/api/_lib/response.ts`.
- Se implementó PBKDF2 con salt aleatorio para hash de contraseñas.
- Se implementaron sesiones D1 con cookies `HttpOnly`, `Secure`, `SameSite=Lax` y expiración de 7 días.
- Se agregaron rutas `POST /api/auth/login`, `POST /api/auth/logout` y `GET /api/auth/session`.
- Se agregó `GET /api/admin/health`, protegido contra acceso sin sesión.
- Se creó el panel inicial en `admin/index.html`.
- Se creó el estilo del panel en `admin/admin.css`.
- Se creó la lógica del panel en `admin/admin.js`.
- Se creó el login en `admin/login/index.html`.
- El panel verifica sesión y API antes de mostrar su estado.
- El panel no muestra métricas inventadas; indica que todavía no hay datos conectados.
- Se creó `scripts/create-admin-hash.mjs` para generar hashes sin guardar contraseñas.
- Se creó `tests/auth-contract.mjs` para validar cookies y contratos básicos.
- La migración D1 local fue aplicada correctamente.
- Sin sesión, `/api/auth/session` devuelve `authenticated:false`.
- Sin sesión, `/api/admin/health` devuelve HTTP 401.
- `/admin` y `/admin/login` responden HTTP 200 en Wrangler local.
- Commits de esta etapa: `72ca034`, `dda2b9c`, `4130d23`, `4aa6ecd`, `feee1bd`.
- Pendiente: provisionar el usuario administrador real en D1 con correo y hash seguros.

## Segunda Etapa: Analítica Y Dashboard

- Se creó el plan en `docs/superpowers/plans/2026-08-16-daring-analytics-dashboard.md`.
- Se creó la migración `migrations/0002_analytics_events.sql`.
- Se creó el helper de normalización y agregación en `functions/api/metrics/_lib.ts`.
- Se creó el contrato `tests/metrics-contract.mjs`.
- Se agregó `POST /api/metrics/events`.
- El endpoint acepta únicamente eventos definidos y rechaza payloads desconocidos o demasiado grandes.
- La landing registra page view, clics de compra, ver en acción, apertura/completado del checkout y consultas por WhatsApp.
- No se envían nombres, correos, teléfonos, direcciones ni valores del formulario a la analítica.
- Los identificadores de visitante y sesión son anónimos y se generan localmente.
- Se agregó `GET /api/metrics/summary`, protegido por sesión.
- Se agregó `GET /api/alerts`, protegido por sesión.
- El panel muestra visitas, clics de compra, formularios abiertos y formularios completados.
- El panel permite elegir 7 días, 30 días o todo el período.
- El panel muestra alertas explicadas en lenguaje simple cuando hay suficiente información.
- Los pagos aprobados y la conversión de pago permanecen como no disponibles hasta conectar Mercado Pago.
- La migración local de analítica fue aplicada correctamente.
- Eventos válidos devuelven HTTP 202 y eventos inválidos HTTP 400.
- Endpoints protegidos sin sesión devuelven HTTP 401.
- Commits de esta etapa: `8f15aa7`, `51a0e35`, `7bf7c26`, `68a2d2f`.

## Avances Recientes Del Panel

- Se creó el plan de analítica en `docs/superpowers/plans/2026-08-16-daring-analytics-dashboard.md`.
- Se agregó la tabla D1 `analytics_events` mediante la migración `0002_analytics_events.sql`.
- Se creó el endpoint público `POST /api/metrics/events`.
- Se validan eventos permitidos, tamaño de payload y tipo de dispositivo.
- La landing registra visitas, clics de compra, ver en acción, apertura/completado del checkout y consultas por WhatsApp.
- Los eventos no incluyen datos personales del formulario.
- Se creó `GET /api/metrics/summary` para el panel.
- Se creó `GET /api/alerts` con recomendaciones en lenguaje simple.
- El panel muestra visitas, clics, formularios y períodos de 7 días, 30 días o todo el período.
- El panel diferencia estados sin datos, errores y métricas todavía no disponibles.
- Se verificó que eventos inválidos devuelven HTTP 400 y endpoints protegidos sin sesión HTTP 401.
- Commits adicionales de analítica: `eaa73dd`, `8f15aa7`, `51a0e35`, `7bf7c26`, `68a2d2f`, `25a8658`.

## Optimización De Animación

- Se reemplazó la animación activa de frames por videos optimizados controlados automáticamente.
- Videos generados: `assets/story-scroll-mobile.mp4` y `assets/story-scroll-desktop.mp4`.
- El video móvil pesa aproximadamente 2,61 MB y el desktop 3,13 MB.
- La sección precarga el video al acercarse y empieza cuando el 60% está visible.
- La reproducción continúa aunque la persona siga desplazándose.
- Los textos se sincronizan con el tiempo del video.
- Se eliminaron los subtítulos y se mantienen solamente los títulos grandes.
- El cuarto título es “Lista en menos de 15 minutos.”.
- El video queda en el último frame durante 2 segundos antes de reiniciar.
- La sección móvil ocupa `100svh`, evitando espacios negros vacíos.
- Se generó una versión desktop y móvil del intro del logo con nombres simples y bajo peso.
- La landing fue validada con JavaScript correcto y HTTP 200 local.

## R2

- Se verificó autenticación de Wrangler con la cuenta `irineomadrid.daring@gmail.com`.
- Account ID detectado: `279493ad9c175d0a242f41a62789e83d`.
- Se intentó consultar y preparar el bucket R2 `daring-media`.
- Cloudflare respondió error `10042`: R2 está deshabilitado en la cuenta.
- No se creó el bucket ni se modificó la configuración de R2.
- Pendiente: activar R2 desde Cloudflare Dashboard y luego crear/conectar `daring-media`.

## R2 Activado

- R2 fue habilitado en la cuenta de Cloudflare.
- Se creó el bucket `daring-media`.
- Account ID: `279493ad9c175d0a242f41a62789e83d`.
- Ubicación reportada por Cloudflare: `ENAM`.
- Clase de almacenamiento: `Standard`.
- Estado inicial: 0 objetos y 0 B.
- Se agregó el binding `MEDIA` a `wrangler.jsonc`.
- Wrangler local confirma `env.MEDIA (daring-media) R2 Bucket`.
- El bucket todavía no contiene imágenes ni videos.

## Gestión De Medios R2

- Se creó la migración `migrations/0003_media_content.sql`.
- `media_assets` ahora guarda ubicación, orden, publicación, título y texto alternativo.
- Se creó `functions/api/media/_lib.ts` con validación de MIME, tamaño y ubicación.
- Se creó `GET/POST /api/media` para listar y cargar archivos.
- Se creó `POST /api/media/publish` para publicar u ocultar recursos.
- Se creó `GET /api/media/file` para servir únicamente recursos publicados.
- El panel permite seleccionar ubicación, orden, título, texto alternativo y archivo.
- Las imágenes se convierten a WebP en el navegador antes de subirlas.
- Los videos se validan con un límite de 12 MB antes de enviarlos.
- Los archivos se cargan a R2 como no publicados hasta revisión.
- El panel muestra una vista previa y estado de publicación.
- El contrato `tests/media-contract.mjs` valida formatos, límites y claves de objetos.
- La migración `0003` fue aplicada correctamente en D1 local.
- Los endpoints de medios sin sesión responden HTTP 401.

## Gestión De Medios Y Uso Cloudflare

- Se agregó `POST /api/media/reorder` para cambiar el orden de los recursos.
- El panel muestra un campo de orden y botón “Guardar orden” para cada archivo.
- Se agregó `GET /api/cloudflare/usage` protegido por sesión.
- El panel muestra cantidad y peso de objetos en R2.
- El panel muestra cantidad de eventos almacenados en D1.
- El panel informa cuando los límites exactos del plan no están disponibles por falta de API configurada.
- Las imágenes se comprimen en el navegador a WebP antes de subirlas.
- Los videos se validan con límite de 12 MB; no se agrega un compresor pesado al panel para proteger la velocidad de la web.
- Tests y sintaxis de media, panel y endpoints validados.

## Cierre De Etapa De Medios

- Los recursos publicados de R2 pueden reemplazar los carruseles públicos de pizza y testimonios.
- Si no existen recursos publicados, la landing conserva el contenido estático de respaldo.
- Se agregó orden manual, publicación/ocultamiento y eliminación de recursos.
- Se agregó consulta de uso de R2 y cantidad de eventos D1 en el panel.
- El límite definitivo para videos subidos al panel es de 12 MB.
- La validación de video ocurre en el navegador y en el endpoint del servidor.
- Se evitó incorporar `ffmpeg.wasm` para no hacer pesado el panel.
- Commits recientes: `303e0b5`, `6fa8023`.

## Integración Pública De Medios

- Se creó `GET /api/media/public?placement=...` para recursos publicados.
- La landing puede reemplazar dinámicamente los carruseles de pizza y testimonios con recursos publicados en R2.
- Si no hay recursos publicados, se mantiene el contenido estático actual como respaldo.
- Se agregó eliminación de archivos desde `DELETE /api/media?id=...`.
- Se agregó edición de metadatos y publicación mediante `PATCH /api/media`.
- Se agregó `POST /api/media/reorder` para ordenar los recursos.
- El panel ahora permite guardar orden y eliminar recursos.
- Los datos dinámicos se escapan antes de insertarse en la landing.
- El endpoint público solo entrega archivos con `published = 1`.

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

- Slots de imagenes simplificados: se eliminaron hero.animacion, cierre.logo, diseno.imagen, oferta.imagen y los 11 slots fijos de carruseles (platos.slide_1-5, voces.video_1-6). Queda solo historia.foto (foto del dueño). La animacion del hero no se modifica desde el panel (solo por codigo).
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
