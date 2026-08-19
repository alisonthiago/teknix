const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.storage.updateBucket('product-images', { public: true });
  if (error) console.log("Error making bucket public:", error.message);
  else console.log("Bucket made public:", data);
}
run();
