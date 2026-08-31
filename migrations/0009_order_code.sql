ALTER TABLE orders ADD COLUMN order_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
UPDATE orders SET order_code = 'DR-000001' WHERE id = '5558f744-fb26-4934-948d-873790f1986f' AND order_code IS NULL;
