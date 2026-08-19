const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { error } = await supabase.from('profiles').update({
    name: 'Alison Thiago',
    email: 'alison@tektou.com',
    role: 'ADMIN'
  }).eq('id', '6f58029b-c770-4f25-a9f9-86dec6fb6137');
  
  if (error) {
    console.error(error);
  } else {
    console.log("Profile reverted to Alison.");
  }
}

run();
