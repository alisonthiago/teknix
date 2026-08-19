/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ykgprfzfnffooqmfbeox.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@teknix.com',
    password: 'adminteknix',
    email_confirm: true
  });
  console.log("Data:", data);
  console.log("Error:", error);
  
  if (data?.user) {
    // Insert into profiles if needed
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      role: 'ADMIN',
      status: 'ACTIVE',
      full_name: 'Administrador Teknix'
    });
    console.log("Profile setup:", profileError || "Success");
  }
}
run();
