require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkColumn() {
  const { data, error } = await supabase.from('profiles').select('photo_url').limit(1)
  console.log('Select result:', data, error)
}
checkColumn()
