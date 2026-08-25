-- Add new commercial and logistics fields to suppliers
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS distributor_state TEXT,
ADD COLUMN IF NOT EXISTS distributor_city TEXT,
ADD COLUMN IF NOT EXISTS pickup_address TEXT;
