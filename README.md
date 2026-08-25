# TEKNIX — Monorepo

```
/Downloads/teknix/
│
├── apps/
│   ├── flow/     ← TEKNIX FLOW (sistema existente em /Downloads/tektou)
│   ├── hub/      ← TEKNIX HUB (administração da loja própria)
│   └── site/     ← TEKNIX SITE (site público)
│
├── packages/
│   ├── ui/       ← Componentes compartilhados
│   ├── types/    ← Tipos TypeScript compartilhados
│   ├── supabase/ ← Cliente Supabase compartilhado
│   └── config/   ← Configurações compartilhadas
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Aplicações

| App | Comando | Descrição |
|-----|---------|-----------|
| **FLOW** | `pnpm dev:flow` | Operação dos marketplaces |
| **HUB** | `pnpm dev:hub` | Administração da loja própria |
| **SITE** | `pnpm dev:site` | Site público |

## Iniciar

```bash
pnpm install
pnpm dev:site
pnpm dev:hub
```

## Notas

- **FLOW**: Código fonte em `/Downloads/tektou`. Este monorepo apenas referencia o sistema existente.
- **HUB**: Sistema administrativo para gerenciar produtos, pedidos, clientes, etc.
- **SITE**: Site público com catálogo de produtos.
