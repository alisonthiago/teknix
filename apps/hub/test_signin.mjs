import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://ykgprfzfnffooqmfbeox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDM3OTEsImV4cCI6MjEwMjUxOTc5MX0.DQ-4lHwbyMW2umWSGmxfB2JUthUTKujGmZ-IACtFCIY')

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: 'password123456'
  })
  console.log('Signin password123456:', error ? error.message : 'SUCCESS')
  
  const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: '123456'
  })
  console.log('Signin 123456:', e2 ? e2.message : 'SUCCESS')
}
run()
