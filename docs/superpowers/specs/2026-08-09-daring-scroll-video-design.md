# Daring Scroll Video

## Objetivo

Convertir la página principal en una experiencia visual de pantalla completa donde el scroll avance y retroceda una animación reconstruida con fotogramas WebP extraídos de los videos entregados.

## Comportamiento responsive

- Escritorio y tablet: usar `assets/Videos/Landing Daring web.mp4`, fuente 16:9 de `2560x1440`.
- Móvil: usar `assets/Videos/Landing Daring Móvil.mp4`, fuente 9:16 de `1440x2560`.
- El canvas debe cubrir el viewport manteniendo la proporción original, sin deformar el contenido.
- No se muestran textos, botones, controles, overlays ni elementos decorativos adicionales.

## Arquitectura

- Extraer los videos a secuencias WebP con resolución original y una frecuencia de 30 fps para reducir el peso sin perder fluidez percibida.
- Guardar las secuencias en `assets/video-frames/desktop` y `assets/video-frames/mobile`.
- Mantener un script reproducible en `scripts/extract-video-frames.ps1` para regenerar los assets.
- Renderizar los frames en un único `<canvas>` fijo. El HTML conserva una sección de scroll invisible cuya altura representa el total de frames.
- Seleccionar la secuencia según `matchMedia('(max-width: 767px)')`.

## Precarga y scroll

- Cargar primero el primer frame para pintar inmediatamente.
- Precargar el resto con `Image.decode()` cuando esté disponible y limitar la concurrencia para no bloquear la interfaz.
- Convertir `scrollY` a progreso entre 0 y 1, y progreso a índice de frame.
- Actualizar el canvas solamente dentro de `requestAnimationFrame`, evitando múltiples renders por evento de scroll.
- Si un frame aún no está listo, conservar el último frame pintado sin mostrar un estado adicional.

## Calidad y accesibilidad

- Usar `image-rendering: auto` y el canvas a resolución física del viewport multiplicada por `devicePixelRatio`, limitado para evitar consumo excesivo.
- Respetar `prefers-reduced-motion` mostrando el primer frame y evitando el scrub animado.
- Mantener `overflow-x: hidden` y no generar saltos de layout.

## Verificación

- Confirmar dimensiones y cantidad de WebP generados para ambas secuencias.
- Confirmar que el HTML no conserva textos ni controles visibles.
- Ejecutar el servidor local y validar la respuesta HTTP.
- Probar las rutas de assets y el cambio responsive de secuencia.
