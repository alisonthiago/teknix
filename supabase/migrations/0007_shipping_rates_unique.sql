-- 0007_shipping_rates_unique.sql

ALTER TABLE marketplace_shipping_rates 
ADD CONSTRAINT unique_shipping_rate 
UNIQUE (marketplace_id, logistic_type, weight_min_g, weight_max_g);
