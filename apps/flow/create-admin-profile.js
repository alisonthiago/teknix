/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ykgprfzfnffooqmfbeox.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: 'cbf38397-00d2-4c13-b8b3-8231ed50a1c9',
    name: 'Administrador Teknix',
    email: 'admin@teknix.com',
    role: 'ADMIN',
    status: 'ACTIVE'
  });
  console.log("Profile setup:", profileError || "Success");
}
run();
