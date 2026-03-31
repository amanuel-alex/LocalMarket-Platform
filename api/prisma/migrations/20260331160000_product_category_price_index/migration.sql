-- Composite index for filtered/sorted catalog lists (category + price range / sort).
CREATE INDEX "Product_category_price_idx" ON "Product" ("category", "price");
