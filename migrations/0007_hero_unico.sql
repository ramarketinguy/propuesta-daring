DELETE FROM page_images WHERE slot IN ('hero.fondo', 'hero.sarten', 'hero.pizza', 'hero.logo');

INSERT INTO page_images (id, slot, section, label, default_path, sort_order) VALUES
  ('img-hero-anim', 'hero.animacion', 'hero', 'Animación del hero (podés reemplazar la animación completa por una imagen o un video)', 'assets/Imagen Hero/2 - Sartén.png', 1);
