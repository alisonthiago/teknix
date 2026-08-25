const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('product_images').select('*').limit(1);
  if (error) { console.error("Error product_images:", error); }
  else { console.log("product_images exist", data.length); }
}
run();
