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
