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

-- Habilitar RLS e permitir acesso a usuários autenticados
ALTER TABLE public.internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'internal_conversations' AND policyname = 'Allow authenticated read/write internal_conversations'
    ) THEN
        CREATE POLICY "Allow authenticated read/write internal_conversations" 
        ON public.internal_conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'internal_messages' AND policyname = 'Allow authenticated read/write internal_messages'
    ) THEN
        CREATE POLICY "Allow authenticated read/write internal_messages" 
        ON public.internal_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Canais operacionais padrão (SEM EMOJIS)
INSERT INTO public.internal_conversations (id, type, name, description)
VALUES 
  ('conv-geral', 'GROUP', 'Geral', 'Canal principal de comunicação da equipe'),
  ('conv-expedicao', 'GROUP', 'Expedição & Logística', 'Separação, embalagem e envio de pedidos'),
  ('conv-financeiro', 'GROUP', 'Financeiro & Notas Fiscais', 'Emissão de notas fiscais, faturamento e custos')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;
