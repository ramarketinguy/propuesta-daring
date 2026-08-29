INSERT OR IGNORE INTO products (id, sku, name, stock_total, stock_reserved, stock_sold, active) VALUES
  ('sarten-daring-28', 'DARING-28', 'Sartén Daring 28 cm', 200, 0, 0, 1);

CREATE TABLE IF NOT EXISTS page_images (
  id TEXT PRIMARY KEY,
  slot TEXT NOT NULL UNIQUE,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  default_path TEXT NOT NULL,
  media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_images_section ON page_images(section, sort_order);

INSERT INTO page_images (id, slot, section, label, default_path, sort_order) VALUES
  ('img-hero-fondo', 'hero.fondo', 'hero', 'Fondo del hero (imagen detrás de la sartén)', 'assets/Imagen Hero/1 - Fomdo.png', 1),
  ('img-hero-sarten', 'hero.sarten', 'hero', 'Sartén del hero (imagen principal del producto)', 'assets/Imagen Hero/2 - Sartén.png', 2),
  ('img-hero-pizza', 'hero.pizza', 'hero', 'Pizza del hero (imagen que acompaña a la sartén)', 'assets/Imagen Hero/3 - Pizza.png', 3),
  ('img-hero-logo', 'hero.logo', 'hero', 'Logo sobre el hero', 'assets/Imagen Hero/4 - Logo.png', 4),
  ('img-platos-1', 'platos.slide_1', 'platos', 'Carrusel de platos · imagen 1', 'assets/Imagenes nuevas/Carrusel pizza Daring/4.png', 10),
  ('img-platos-2', 'platos.slide_2', 'platos', 'Carrusel de platos · imagen 2', 'assets/Imagenes nuevas/Carrusel pizza Daring/6.png', 11),
  ('img-platos-3', 'platos.slide_3', 'platos', 'Carrusel de platos · imagen 3', 'assets/Imagenes nuevas/Carrusel pizza Daring/7.png', 12),
  ('img-platos-4', 'platos.slide_4', 'platos', 'Carrusel de platos · imagen 4', 'assets/Imagenes nuevas/Carrusel pizza Daring/8.png', 13),
  ('img-platos-5', 'platos.slide_5', 'platos', 'Carrusel de platos · imagen 5', 'assets/Imagenes nuevas/Carrusel pizza Daring/9.png', 14),
  ('img-diseno', 'diseno.imagen', 'diseno', 'Imagen de la sección Diseño e ingeniería', 'assets/Imagenes nuevas/Diseño e ingenieria.png', 20),
  ('img-oferta', 'oferta.imagen', 'oferta', 'Imagen de la sección Oferta (junto al formulario de compra)', 'assets/Imagenes nuevas/Checkout.png', 30),
  ('img-historia', 'historia.foto', 'historia', 'Foto de Irineo en la sección Nuestra historia', 'assets/Imagenes nuevas/Irineo.jpeg', 40),
  ('img-cierre-logo', 'cierre.logo', 'cierre', 'Logo del cierre de la página', 'assets/Logo Daring (1).png', 50),
  ('img-voces-1', 'voces.video_1', 'voces', 'Testimonio en video 1', 'assets/Testimonios nuevos/web/Testimonio 1.mp4', 60),
  ('img-voces-2', 'voces.video_2', 'voces', 'Testimonio en video 2', 'assets/Testimonios nuevos/web/Testimonio 2.mp4', 61),
  ('img-voces-3', 'voces.video_3', 'voces', 'Testimonio en video 3', 'assets/Testimonios nuevos/web/Testimonio 3.mp4', 62),
  ('img-voces-4', 'voces.video_4', 'voces', 'Testimonio en video 4', 'assets/Testimonios nuevos/web/Testimonio 4.mp4', 63),
  ('img-voces-5', 'voces.video_5', 'voces', 'Testimonio en video 5', 'assets/Testimonios nuevos/web/Testimonio 5.mp4', 64),
  ('img-voces-6', 'voces.video_6', 'voces', 'Testimonio en video 6', 'assets/Testimonios nuevos/web/Testimonio 6.mp4', 65);
