-- Register Melhor Envio separately from its webhook integration.
-- OAuth tokens remain server-side and are never returned by the callback.
INSERT INTO public.marketplaces (
  name, code, status, type, api_available, oauth_available, webhook_available,
  default_percentage_fee, default_fixed_fee, default_tax, default_freight,
  default_ads_fee, logo
)
VALUES (
  'Melhor Envio', 'MELHOR_ENVIO', 'ACTIVE', 'SHIPPING', TRUE, TRUE, TRUE,
  0, 0, 0, 0, 0, '/logos/melhorenvio.svg'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  type = EXCLUDED.type,
  api_available = EXCLUDED.api_available,
  oauth_available = EXCLUDED.oauth_available,
  webhook_available = EXCLUDED.webhook_available,
  logo = EXCLUDED.logo;