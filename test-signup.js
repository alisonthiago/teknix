// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ykgprfzfnffooqmfbeox.supabase.co';
const supabaseKey = 'sb_publishable_Ij04kLgjLDLEvlcQ52ixNQ_ktsEWGtF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'alison@teknix.com',
    password: '123456'
  });
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
