const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('product_images').select('*');
  console.log("Existing images:", data?.length);
  
  // check columns of product_images
  const { data: cols, error: colError } = await supabase.from('product_images').select('product_id, url, is_primary, sort_order').limit(1);
  if (colError) console.log("Column Error:", colError.message);
  else console.log("Columns are valid");

  // check bucket product-images
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('product-images');
  if (bucketError) console.log("Bucket Error:", bucketError.message);
  else console.log("Bucket details:", bucket);
}
run();
