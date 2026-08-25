const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('products').select('*').eq('id', 'fbe48df4-2049-4525-907a-961472788a4b');
  console.log("Product:", data?.length > 0 ? "Exists" : "Does NOT exist", error || '');
}
run();
