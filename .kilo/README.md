# TEKTOU Project

Este é o workspace oficial do Kilo para o projeto TEKTOU (TEKnix).

## Estrutura do Projeto

- **Framework**: Next.js 16.3.1 (App Router)
- **Linguagem**: TypeScript + React 19
- **Estilo**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Integrações**: Mercado Livre API, Vercel Deploy

## Diretórios Principais

- `src/app/` - Páginas e rotas (App Router)
- `src/app/(admin)/` - Painel administrativo
- `src/app/api/` - API Routes
- `src/components/` - Componentes React reutilizáveis
- `src/lib/` - Utilitários e bibliotecas internas
- `src/services/` - Serviços externos (Mercado Livre, etc.)
- `src/hooks/` - Custom hooks
- `src/types/` - Tipos TypeScript
- `src/utils/` - Funções utilitárias
- `public/` - Assets estáticos
- `supabase/` - Migrations e configurações do Supabase

## Comandos Úteis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run lint` - Executa linter
- `npm run start` - Inicia servidor de produção

## Convenções

- Use TypeScript rigoroso
- Siga o padrão de componentes do shadcn/ui
- Rotas de API em `src/app/api/`
- Componentes de cliente devem ter `'use client'` quando necessário
- Nomes de arquivos em PascalCase para componentes, camelCase para utilitários
