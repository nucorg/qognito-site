-- Preserve existing sandbox orders; historical subtotals were not recorded.
ALTER TABLE commerce_orders ADD COLUMN amount_subtotal INTEGER CHECK (amount_subtotal >= 0);
ALTER TABLE commerce_orders ADD COLUMN amount_tax INTEGER NOT NULL DEFAULT 0 CHECK (amount_tax >= 0);
ALTER TABLE commerce_orders ADD COLUMN automatic_tax_enabled INTEGER NOT NULL DEFAULT 0 CHECK (automatic_tax_enabled IN (0, 1));
ALTER TABLE commerce_orders ADD COLUMN automatic_tax_status TEXT;
ALTER TABLE commerce_orders ADD COLUMN tax_behavior TEXT CHECK (tax_behavior IN ('inclusive', 'exclusive'));
ALTER TABLE commerce_orders ADD COLUMN tax_code TEXT;
