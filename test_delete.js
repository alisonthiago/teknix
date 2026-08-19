const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.auth.admin.deleteUser('12cd94e0-f3b1-4811-911e-49fb3e015405');
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
