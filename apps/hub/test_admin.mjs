import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://ykgprfzfnffooqmfbeox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDM3OTEsImV4cCI6MjEwMjUxOTc5MX0.DQ-4lHwbyMW2umWSGmxfB2JUthUTKujGmZ-IACtFCIY')

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'teste@teste.com',
    password: '123456',
    email_confirm: true
  })
  console.log('Admin create result:', JSON.stringify({data, error}, null, 2))
}
run()
