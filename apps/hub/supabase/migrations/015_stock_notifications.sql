-- TEKNIX — Tabela de Avisos de Disponibilidade de Estoque (Leads quando produto está esgotado)
CREATE TABLE IF NOT EXISTS public.stock_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

-- RLS
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- Visitantes do SITE podem inserir novos pedidos de aviso (leads)
DROP POLICY IF EXISTS "Permitir insercao de avisos" ON public.stock_notifications;
CREATE POLICY "Permitir insercao de avisos"
    ON public.stock_notifications
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Leitura de avisos (HUB e serviços)
DROP POLICY IF EXISTS "Permitir leitura de avisos" ON public.stock_notifications;
CREATE POLICY "Permitir leitura de avisos"
    ON public.stock_notifications
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Atualização de status (marcar como notificado)
DROP POLICY IF EXISTS "Permitir atualizacao de avisos" ON public.stock_notifications;
CREATE POLICY "Permitir atualizacao de avisos"
    ON public.stock_notifications
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Exclusão de avisos
DROP POLICY IF EXISTS "Permitir exclusao de avisos" ON public.stock_notifications;
CREATE POLICY "Permitir exclusao de avisos"
    ON public.stock_notifications
    FOR DELETE
    TO anon, authenticated
    USING (true);
