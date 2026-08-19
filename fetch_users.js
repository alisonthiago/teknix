const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  users.forEach(u => {
    console.log(`ID: ${u.id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Metadata: ${JSON.stringify(u.user_metadata)}`);
    console.log('---');
  });
}

run();
