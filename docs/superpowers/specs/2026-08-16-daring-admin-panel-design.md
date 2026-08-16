# Daring Admin Panel Design

## Goal

Construir una infraestructura administrativa segura y simple para que el cliente pueda entender el rendimiento de la landing, administrar contenidos y controlar el uso de Cloudflare sin depender de conocimientos técnicos.

## Scope

- Mantener la landing pública independiente del panel.
- Crear un panel privado para un administrador.
- Registrar eventos básicos de navegación, interés, checkout y pagos.
- Mostrar métricas resumidas con explicaciones y alertas accionables.
- Administrar imágenes, videos y textos de los carruseles.
- Validar y comprimir recursos antes de publicarlos.
- Mostrar el consumo de servicios y límites relevantes de Cloudflare.
- Dejar preparado el flujo para Mercado Pago Checkout Pro, pedidos y stock.

## Out Of Scope Initial

- No modificar visualmente la landing salvo para agregar eventos de medición.
- No activar pagos reales en la primera etapa.
- No permitir edición libre del diseño, tipografías o estilos desde el panel.
- No guardar tokens, contraseñas ni credenciales en el repositorio.

## Architecture

- Cloudflare Pages continúa alojando la landing y el panel desde el mismo repositorio.
- Cloudflare Pages Functions expone la API administrativa.
- D1 almacena usuarios, sesiones, eventos, pedidos, stock y configuración de contenidos.
- R2 almacena imágenes, videos y otros recursos administrables.
- El navegador recibe solamente datos autorizados por la API.
- Las credenciales de Mercado Pago, correo y Cloudflare viven como secretos de Cloudflare.

## Routes

- `/admin/`: shell protegido del panel.
- `/admin/login`: acceso del administrador.
- `/api/auth/login`: inicio de sesión.
- `/api/auth/logout`: cierre de sesión.
- `/api/auth/session`: validación de sesión actual.
- `/api/metrics/summary`: resumen de métricas.
- `/api/metrics/events`: registro de eventos públicos.
- `/api/metrics/timeseries`: datos agrupados por período.
- `/api/alerts`: alertas y recomendaciones.
- `/api/media`: listado y metadatos de recursos.
- `/api/media/upload`: carga validada de archivos.
- `/api/media/publish`: publicación u ocultamiento de recursos.
- `/api/cloudflare/usage`: consumo y límites disponibles.

## Authentication

- Un usuario administrador inicial.
- Contraseña almacenada únicamente como hash.
- Sesiones almacenadas en D1.
- Cookie `HttpOnly`, `Secure`, `SameSite=Lax` y con expiración.
- Revocación de sesión al cerrar sesión.
- Todas las rutas administrativas verifican la sesión antes de responder.
- Los endpoints públicos de eventos aceptan únicamente eventos definidos y datos mínimos.

## Metrics

### Public Events

- `page_view`: visita de página.
- `hero_buy_click`: clic en comprar desde el hero.
- `hero_action_click`: clic en ver en acción.
- `checkout_open`: apertura del formulario.
- `checkout_submit`: formulario completado.
- `whatsapp_click`: clic en consultas por WhatsApp.
- `checkout_started`: inicio de Checkout Pro.
- `payment_approved`: pago aprobado por webhook.
- `payment_rejected`: pago rechazado.
- `payment_cancelled`: pago cancelado.

### Dashboard Metrics

- Visitas totales.
- Visitantes únicos cuando la medición disponible lo permita.
- Clics en comprar.
- Formularios abiertos y completados.
- Pagos aprobados.
- Tasa de conversión.
- Ingresos.
- Ticket promedio.
- Embudo de conversión.
- Comparación con el período anterior.
- Dispositivo y origen básico de las visitas, sin recopilar datos innecesarios.

## Explanations And Alerts

El panel no debe mostrar solamente números. Cada métrica importante puede incluir:

- Estado: normal, revisar o urgente.
- Explicación en lenguaje simple.
- Causa probable cuando exista evidencia.
- Acción recomendada.

Ejemplos:

- Muchas visitas y pocos clics en comprar: revisar propuesta o CTA.
- Muchos formularios y pocos pagos aprobados: revisar el checkout.
- Aumento de pagos rechazados: revisar Mercado Pago.
- Uso de Cloudflare cercano al límite: reducir peso o revisar consumo.
- Stock disponible bajo: verificar reposición.

## Content Management

- Carrusel de imágenes de platos.
- Carrusel de videos testimoniales.
- Posibilidad de incorporar imágenes con texto asociado donde el formato lo permita.
- Orden manual mediante `sort_order`.
- Activar, ocultar, editar y eliminar recursos.
- Vista previa antes de publicar.
- No permitir que un recurso inválido se publique.

## Media Processing

- Validar MIME type real y extensión.
- Definir límites de tamaño por tipo de archivo.
- Imágenes: conversión a WebP o AVIF, redimensionado y compresión.
- Videos: generar una versión web optimizada, conservar formato vertical u horizontal y mantener audio cuando corresponda.
- Mostrar peso original y peso final.
- No publicar hasta terminar la compresión.
- Mantener el archivo original únicamente si la política de almacenamiento lo permite.
- La primera implementación debe priorizar procesamiento en navegador para imágenes y una estrategia compatible con los límites de Workers para videos.

## Cloudflare Usage

El panel debe mostrar, cuando las APIs y permisos estén disponibles:

- Requests de Pages.
- Invocaciones de Functions.
- Lecturas y escrituras de D1.
- Almacenamiento y operaciones de R2.
- Transferencia o egreso relevante.
- Porcentaje estimado de consumo frente al límite del plan.
- Fecha del período de medición.

Si un dato no está disponible por permisos o limitaciones del plan, debe mostrarse como “No disponible” y explicar cómo resolverlo, nunca inventar un valor.

## Data Model

La migración existente ya contempla `admin_users`, `admin_sessions`, `orders`, `checkout_events`, `media_assets`, `testimonials` y `email_deliveries`. La implementación agregará las tablas o índices mínimos necesarios para eventos de analítica, alertas y configuración, evitando duplicar estructuras existentes.

## Error Handling

- La landing nunca debe quedar bloqueada si la API de métricas falla.
- Los eventos públicos deben fallar silenciosamente después de un timeout corto.
- El panel debe mostrar estados claros cuando una fuente de datos no responde.
- Las cargas inválidas deben explicar el motivo en lenguaje simple.
- Los webhooks y actualizaciones de stock deben ser idempotentes.

## Delivery Order

1. Revisar y completar configuración de Cloudflare Pages, D1 y secretos.
2. Implementar autenticación y shell protegido del panel.
3. Implementar registro de eventos y resumen de métricas.
4. Implementar alertas y recomendaciones.
5. Implementar administración de imágenes, videos y textos.
6. Implementar compresión, validación y publicación de medios.
7. Implementar consulta de uso y límites de Cloudflare.
8. Conectar Checkout Pro, webhooks, pedidos, stock y correo.
9. Validar con datos de prueba y desplegar progresivamente.

## Acceptance Criteria

- Una persona no técnica puede iniciar sesión y entender el estado general de la página.
- Las métricas tienen contexto y recomendaciones, no solamente valores.
- Un fallo del panel no bloquea la landing pública.
- Un archivo pesado o inválido no puede publicarse sin advertencia.
- Los medios publicados se sirven en una versión optimizada.
- Los límites de Cloudflare muestran datos reales o un estado explícito de no disponibilidad.
- No hay secretos en archivos versionados.
- La estructura permite integrar Mercado Pago sin rehacer el panel.
