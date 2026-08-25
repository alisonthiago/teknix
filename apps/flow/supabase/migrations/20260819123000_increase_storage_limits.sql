-- Update bucket file size limit to 500MB (524288000 bytes)
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'supplier-catalogs';
