import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Apenas POST com authorization
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  
  // Verifica se quem está chamando tem a service key
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { sql } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Executa SQL diretamente via postgres
  const { data, error } = await supabase.rpc('pg_catalog.pg_sleep', { seconds: 0 }).then(() => 
    ({ data: null, error: null })
  ).catch(() => ({ data: null, error: null }))

  // Alternativa: usa fetch direto para o postgres REST
  try {
    const pgUrl = Deno.env.get('SUPABASE_DB_URL') || ''
    // Retorna SQL para ser executado pelo usuário
    return new Response(JSON.stringify({ 
      message: 'Esta função precisa executar via pg direto',
      sql_to_run: sql 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
