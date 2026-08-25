-- Criação das tabelas para o Chat Interno Real
CREATE TABLE IF NOT EXISTS public.internal_conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'GROUP', -- 'GROUP' ou 'DIRECT'
    name TEXT NOT NULL,
    description TEXT,
    members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.internal_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL,
    sender_id TEXT,
    sender_name TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'TEXT',
    metadata JSONB DEFAULT '{}'::jsonb,
    reply_to JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_internal_messages_conv ON public.internal_messages(conversation_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated read/write internal_conversations" ON public.internal_conversations;
    DROP POLICY IF EXISTS "Allow authenticated read/write internal_messages" ON public.internal_messages;
    DROP POLICY IF EXISTS "Allow all read/write internal_conversations" ON public.internal_conversations;
    DROP POLICY IF EXISTS "Allow all read/write internal_messages" ON public.internal_messages;

    CREATE POLICY "Allow all read/write internal_conversations" 
    ON public.internal_conversations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    CREATE POLICY "Allow all read/write internal_messages" 
    ON public.internal_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
END $$;

-- Habilitar Realtime para as tabelas de chat
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_conversations;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Canais operacionais padrão
INSERT INTO public.internal_conversations (id, type, name, description)
VALUES 
  ('conv-geral', 'GROUP', 'Geral', 'Canal principal de comunicação da equipe'),
  ('conv-expedicao', 'GROUP', 'Expedição & Logística', 'Separação, embalagem e envio de pedidos'),
  ('conv-financeiro', 'GROUP', 'Financeiro & Notas Fiscais', 'Emissão de notas fiscais, faturamento e custos')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;
