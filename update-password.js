/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ykgprfzfnffooqmfbeox.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  
  const adminUser = users.users.find(u => u.email === 'admin@teknix.com');
  
  if (adminUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: 'Ngo5656#cotia' }
    );
    console.log("Password updated:", error || "Success");
  } else {
    console.log("Admin user not found");
  }
}
run();
