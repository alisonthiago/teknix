ALTER TABLE purchases
ADD COLUMN buyer_id UUID REFERENCES profiles(id);
