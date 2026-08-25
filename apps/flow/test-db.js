const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('suppliers').select('*').limit(1);
  if (error) { console.error("Error:", error); return; }
  console.log("Has logo_url?", data[0] && 'logo_url' in data[0]);
  
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) { console.error("Bucket Error:", bucketError); return; }
  console.log("Buckets:", buckets.map(b => b.name));
}
run();
