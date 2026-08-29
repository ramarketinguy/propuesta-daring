CREATE TABLE IF NOT EXISTS product_colors (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  color TEXT NOT NULL UNIQUE,
  stock_total INTEGER NOT NULL DEFAULT 0 CHECK (stock_total >= 0),
  stock_reserved INTEGER NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
  stock_sold INTEGER NOT NULL DEFAULT 0 CHECK (stock_sold >= 0)
);

INSERT INTO product_colors (id, product_id, color, stock_total) VALUES
  ('color-rojo', 'sarten-daring-28', 'rojo', 100),
  ('color-negro', 'sarten-daring-28', 'negro', 100);

DELETE FROM page_images WHERE slot IN (
  'hero.animacion',
  'cierre.logo',
  'diseno.imagen',
  'oferta.imagen',
  'platos.slide_1', 'platos.slide_2', 'platos.slide_3', 'platos.slide_4', 'platos.slide_5',
  'voces.video_1', 'voces.video_2', 'voces.video_3', 'voces.video_4', 'voces.video_5', 'voces.video_6'
);
