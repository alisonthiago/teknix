# Documentação de Integração TEKNIX <> Mercado Livre

Este documento explica como funciona a integração oficial entre o sistema TEKNIX e a API do Mercado Livre.

## 1. Criação do Aplicativo no Mercado Livre
Para que a integração funcione, é necessário criar um Aplicativo no portal de Developers do Mercado Livre:
1. Acesse [Mercado Livre Developers](https://developers.mercadolivre.com.br/)
2. Crie uma nova Aplicação.
3. Obtenha o **App ID (Client ID)** e o **Secret Key (Client Secret)**.
4. Cadastre a **Redirect URI** exatamente como: `https://SEU-DOMINIO/api/auth/mercadolivre/callback` (em dev: `http://localhost:3000/api/auth/mercadolivre/callback`).

## 2. Configuração de Webhooks
No portal do Mercado Livre, configure a URL de Notificações (Webhooks) para:
- `https://SEU-DOMINIO/api/webhooks/mercadolivre`
- Selecione os Tópicos (Topics):
  - `orders_v2` (Recomendado para vendas)
  - `payments`
  - `shipments`
  - `items`
  - `questions` / `messages`

## 3. Variáveis de Ambiente (.env)
Você deve configurar as seguintes variáveis no painel da Vercel (ou no `.env.local`):
```
MERCADOLIVRE_CLIENT_ID=seu_client_id
MERCADOLIVRE_CLIENT_SECRET=seu_client_secret
MERCADOLIVRE_REDIRECT_URI=url_de_callback
MERCADOLIVRE_WEBHOOK_SECRET=opcional
SUPABASE_SERVICE_ROLE_KEY=chave_service_do_supabase
```

## 4. Arquitetura de Dados (Supabase)
O banco de dados foi expandido para suportar uma operação Multicanal:
- `marketplace_connections`: Guarda o `access_token` e `refresh_token` de forma segura com RLS. O navegador nunca vê essas chaves.
- `marketplace_webhook_events`: Recebe os pings do Mercado Livre. Uma chave única (`topic` + `resource` + `event_id`) garante a **Idempotência** (não duplica vendas se o ML mandar o ping 2 vezes).
- `marketplace_orders` e `marketplace_order_items`: Espelho cru dos dados do Mercado Livre.

## 5. Fluxo de Processamento Vercel (Serverless)
O Mercado Livre exige que webhooks retornem `HTTP 200 OK` muito rápido.
Para evitar falhas na Vercel:
1. O endpoint `/api/webhooks/mercadolivre` recebe o POST.
2. Salva no banco com status `RECEIVED`.
3. Usa a função `waitUntil()` do Next.js.
4. Retorna `200 OK` para o Mercado Livre imediatamente.
5. O `waitUntil()` mantém a thread viva rodando a função `processWebhook()` em segundo plano para calcular o lucro, atualizar estoque e disparar a notificação.

## 6. Renovações de Token (Refresh Token)
O Access Token expira a cada 6 horas. O módulo interno `src/services/mercadolivre/client.ts` detecta se o token está a menos de 5 minutos de expirar e dispara uma renovação automática na API (`grant_type=refresh_token`).

## 7. Troubleshooting
- **Gráficos e Feed não atualizam:** Verifique se as variáveis `SUPABASE_SERVICE_ROLE_KEY` estão corretas, pois os webhooks rodam com essa chave para ignorar RLS.
- **Webhook falha na Vercel:** Cheque os Logs na aba "Functions" da Vercel se algum erro ocorrer no `waitUntil`.
- **Produto Não Vinculado:** Se um SKU for vendido no ML e não existir no TEKNIX, a venda fica parada no estágio `marketplace_orders` e gera um Alerta de Produto não vinculado no Dashboard.
