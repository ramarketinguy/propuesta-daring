# Memoria Del Proyecto Daring

Última actualización: 2026-08-16

## Estado Actual

- Proyecto: landing de venta de la sartén Daring.
- Archivo principal: `daring-landing.html`.
- Servidor local habitual: `http://localhost:4173/daring-landing.html`.
- Repositorio: `https://github.com/ramarketinguy/propuesta-daring.git`.
- Rama principal: `main`.
- El precio de lanzamiento es `$1.590 UYU`.
- La compra está preparada para Mercado Pago Checkout Pro, pero la integración real todavía es pendiente.
- WhatsApp funciona únicamente como canal de consultas desde la barra inferior.

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
- Los videos se validan con un límite de 60 MB antes de enviarlos.
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
- Los videos se validan con límite de 60 MB; la compresión avanzada de video queda pendiente de un procesador compatible con Cloudflare.
- Tests y sintaxis de media, panel y endpoints validados.

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
