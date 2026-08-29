CREATE TABLE IF NOT EXISTS page_content (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'textarea', 'number')),
  value TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_content_section ON page_content(section, sort_order);

CREATE TABLE IF NOT EXISTS page_faq (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_faq_order ON page_faq(sort_order, published);

INSERT INTO page_content (id, key, section, label, type, value, sort_order) VALUES
  ('hero-title-1', 'hero.title_line_1', 'hero', 'Título del hero · primera línea (aparece arriba de todo en la página)', 'text', 'UN SOLO SARTÉN', 1),
  ('hero-title-2', 'hero.title_line_2', 'hero', 'Título del hero · segunda línea', 'text', 'PARA COCINARLO', 2),
  ('hero-title-3', 'hero.title_line_3', 'hero', 'Título del hero · tercera línea', 'text', 'TODO.', 3),
  ('hero-sub', 'hero.subtitle', 'hero', 'Subtítulo del hero (texto debajo del título principal)', 'textarea', 'Daring reemplaza sartenes, planchas y pizzeras: verduras salteadas, carnes selladas y pizzas de borde crocante, SIN PRENDER EL HORNO.', 4),
  ('hero-cta-primary', 'hero.cta_primary', 'hero', 'Texto del botón principal del hero (ej: "Quiero mi Daring")', 'text', 'Quiero mi Daring', 5),
  ('hero-cta-secondary', 'hero.cta_secondary', 'hero', 'Texto del botón secundario del hero (ej: "Verlo en acción")', 'text', 'Verlo en acción', 6),
  ('hero-badge-1', 'hero.badge_1', 'hero', 'Insignia 1 (chip sobre los botones)', 'text', '28 centímetros de base', 7),
  ('hero-badge-2', 'hero.badge_2', 'hero', 'Insignia 2', 'text', 'Antiadherente premium', 8),
  ('hero-badge-3', 'hero.badge_3', 'hero', 'Insignia 3', 'text', 'Tapa de vidrio templado', 9),
  ('hero-badge-4', 'hero.badge_4', 'hero', 'Insignia 4', 'text', 'Doble agarre', 10),
  ('platos-eyebrow', 'platos.eyebrow', 'platos', 'Etiqueta superior de la sección "Platos"', 'text', 'Versatilidad total', 20),
  ('platos-title', 'platos.title', 'platos', 'Título de la sección "Platos"', 'text', 'Un sartén. Infinitos platos.', 21),
  ('platos-lead', 'platos.lead', 'platos', 'Texto debajo del título de la sección "Platos"', 'textarea', 'Desde el desayuno hasta la cena del domingo: todo sale del mismo lugar.', 22),
  ('diseno-eyebrow', 'diseno.eyebrow', 'diseno', 'Etiqueta superior de "Diseño e ingeniería"', 'text', 'Diseño e ingeniería', 30),
  ('diseno-title', 'diseno.title', 'diseno', 'Título de "Diseño e ingeniería"', 'text', 'Pensado para ser el único.', 31),
  ('diseno-lead', 'diseno.lead', 'diseno', 'Texto debajo del título de "Diseño e ingeniería"', 'textarea', 'Cada detalle responde a una pregunta: ¿cómo logramos que una sartén haga todo?', 32),
  ('oferta-eyebrow', 'oferta.eyebrow', 'oferta', 'Etiqueta superior de la sección "Oferta"', 'text', 'Edición Fundador', 40),
  ('oferta-title', 'oferta.title', 'oferta', 'Título de la sección "Oferta"', 'text', 'Llevá tu Daring hoy mismo.', 41),
  ('oferta-include-1', 'oferta.include_1', 'oferta', 'Bullet 1 de lo que incluye la oferta', 'text', 'Sartén Daring con 28 centímetros de base', 42),
  ('oferta-include-2', 'oferta.include_2', 'oferta', 'Bullet 2', 'text', 'Tapa de vidrio templado', 43),
  ('oferta-include-3', 'oferta.include_3', 'oferta', 'Bullet 3', 'text', 'Menos tiempo en la cocina', 44),
  ('oferta-include-4', 'oferta.include_4', 'oferta', 'Bullet 4', 'text', 'Más tiempo para vos', 45),
  ('oferta-cta', 'oferta.cta', 'oferta', 'Texto del botón de compra de la sección "Oferta"', 'text', 'Comprar con Mercado Pago', 46),
  ('oferta-launch', 'oferta.launch_copy', 'oferta', 'Texto debajo del contador de unidades', 'textarea', 'El precio de lanzamiento estará disponible hasta que se vendan las 200 unidades.', 47),
  ('cierre-title', 'cierre.title', 'cierre', 'Título del cierre', 'text', 'COCINÁ DISTINTO DESDE HOY.', 50),
  ('cierre-copy', 'cierre.copy', 'cierre', 'Texto debajo del título del cierre', 'textarea', 'Un solo sartén, toda tu cocina: tu próximo plato favorito empieza acá.', 51);

INSERT INTO page_faq (id, question, answer, sort_order, published) VALUES
  ('faq-1', '¿Es apta para inducción?', 'No. Es apta para cocinas a gas, eléctricas, anafe y garrafa. No debe usarse sobre brasas, leña o fuego abierto.', 1, 1),
  ('faq-2', '¿Cuánto tarda el envío?', 'El despacho se hace dentro de las 24 horas y la entrega llega entre 24 y 72 horas según la zona, a través de Mercado Envíos. El envío está incluido en el precio.', 2, 1),
  ('faq-3', '¿Tiene garantía?', 'Sí, 7 días de devolución a través de Mercado Pago.', 3, 1),
  ('faq-4', '¿Cuánto pesa?', '1,45 kg en total: 800 g la sartén y 652 g la tapa.', 4, 1);
