const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    // If rpc doesn't exist, try querying pg_policies through rest api if enabled, but pg_policies is system table and REST API might not expose it.
    console.log("No RPC get_policies");
  }
}
run();
