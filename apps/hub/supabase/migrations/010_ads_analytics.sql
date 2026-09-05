-- Eventos de anúncios. O IP é capturado no servidor, nunca solicitado ao navegador.
CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression','click')), placement text,
  page_url text, user_agent text, ip_address inet, country text, region text, city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_events_ad_idx ON public.ad_events(ad_id, created_at DESC);
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read ad analytics" ON public.ad_events;
CREATE POLICY "Admins read ad analytics" ON public.ad_events FOR SELECT USING (auth.role()='authenticated');
CREATE OR REPLACE FUNCTION public.record_ad_event(p_ad_id uuid,p_event_type text,p_placement text,p_page_url text,p_user_agent text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO ad_events(ad_id,event_type,placement,page_url,user_agent,ip_address,country,region,city)
 VALUES(p_ad_id,p_event_type,p_placement,p_page_url,p_user_agent,inet_client_addr(),current_setting('request.headers',true)::jsonb->>'cf-ipcountry',current_setting('request.headers',true)::jsonb->>'x-region',current_setting('request.headers',true)::jsonb->>'x-city');
 UPDATE ads SET impressions=impressions+(CASE WHEN p_event_type='impression' THEN 1 ELSE 0 END),clicks=clicks+(CASE WHEN p_event_type='click' THEN 1 ELSE 0 END) WHERE id=p_ad_id;
END;$$;
GRANT EXECUTE ON FUNCTION public.record_ad_event(uuid,text,text,text,text) TO anon, authenticated;
