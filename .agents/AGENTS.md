# ==============================================================
# TEKNIX — REGRAS OFICIAIS DE ARQUITETURA DO MONOREPO
# ==============================================================
#
# ESTE DOCUMENTO É REGRA PERMANENTE DO PROJETO.
#
# TODA IA, DESENVOLVEDOR OU AGENTE DE CÓDIGO DEVE RESPEITAR
# ESTAS REGRAS ANTES DE ALTERAR QUALQUER PARTE DO SISTEMA.
# ==============================================================


# 1. ESTRUTURA OFICIAL

O monorepo TEKNIX possui três aplicações principais:

apps/
├── flow/
├── hub/
└── site/

Cada aplicação possui uma responsabilidade própria.

NÃO misturar responsabilidades entre elas.


# 2. FLOW

apps/flow/

O FLOW é o sistema interno de operação dos marketplaces.

Responsabilidades principais:

- Mercado Livre;
- Shopee;
- outros marketplaces;
- sincronização de catálogo;
- sincronização de vendas;
- operações de marketplace;
- estoque operacional relacionado aos marketplaces;
- pedidos de marketplace;
- integrações de marketplace;
- monitoramento de marketplace;
- processos internos do marketplace.

REGRA ABSOLUTA:

apps/flow/ NÃO deve ser alterado sem autorização explícita.

Não redesenhar.

Não migrar.

Não reestruturar.

Não substituir funcionalidades existentes.

Não criar dependências novas desnecessárias.

Não alterar dados do FLOW para solucionar problemas do HUB ou SITE.

O FLOW é considerado um sistema existente e funcional.


# 3. HUB

apps/hub/

O HUB é o centro administrativo da loja própria TEKNIX.

O HUB NÃO é o FLOW.

O HUB NÃO é o SITE público.

Responsabilidades:

- produtos da loja;
- catálogo da loja;
- segmentos;
- categorias;
- subcategorias;
- clientes;
- pedidos da loja;
- vendas da loja;
- checkout;
- pagamentos;
- frete;
- Correios;
- transportadoras;
- marketing;
- promoções;
- campanhas;
- mídia;
- páginas;
- temas;
- templates;
- headers;
- menus;
- footers;
- SEO;
- configurações da loja;
- usuários;
- colaboradores;
- permissões;
- integrações;
- relatórios;
- Page Builder;
- gerenciamento das publicações do SITE.


# 4. SITE

apps/site/

O SITE é a experiência pública da TEKNIX.

Ele é destinado ao cliente final.

Responsabilidades:

- Home;
- segmentos;
- categorias;
- produtos;
- páginas institucionais;
- páginas promocionais;
- páginas de campanha;
- checkout público;
- conta do cliente;
- conteúdo publicado pelo HUB.

O SITE deve consumir conteúdo publicado.

O SITE NÃO deve funcionar como painel administrativo.

O SITE NÃO deve possuir ferramentas administrativas internas.

O SITE NÃO deve alterar diretamente dados administrativos.

O SITE deve renderizar o estado publicado.


# 5. RELAÇÃO ENTRE OS SISTEMAS

A arquitetura conceitual oficial é:

FLOW
↓
operação de marketplaces

HUB
↓
administração da loja própria
↓
Page Builder
↓
publicação

SITE
↓
experiência pública


# 6. REGRA FUNDAMENTAL

HUB ADMINISTRA.

SITE APRESENTA.

FLOW OPERA MARKETPLACES.

Nunca inverter essas responsabilidades.


# 7. PAGE BUILDER

O Page Builder pertence ao HUB.

O editor é uma ferramenta administrativa.

O conteúdo produzido pelo editor é publicado no SITE.

Fluxo:

HUB
→ Páginas
→ Editar
→ Page Builder
→ Salvar
→ Publicar
→ SITE


# 8. EDITOR E RENDERER

O editor e o renderer público devem compartilhar o mesmo modelo de dados/schema.

Arquitetura:

Page Builder
↓
Page Schema
↓
Supabase
↓
Published Version
↓
SITE Renderer

Não criar um editor que gere um formato e um SITE que utilize outro formato.

O schema da página é a fonte de verdade da apresentação.


# 9. PÁGINAS

Toda página possui:

- ID;
- nome;
- slug;
- URL;
- tipo;
- status;
- template;
- tema;
- schema;
- SEO;
- publicação;
- timestamps.

Uma página pode ser:

- Home;
- Segmento;
- Categoria;
- Produto;
- Landing Page;
- Campanha;
- Institucional;
- Contato;
- Página personalizada;
- outros tipos futuros.


# 10. URL PÚBLICA

Cada página possui uma URL pública própria.

Exemplo:

/ferramentas
/ferramentas/furadeiras
/produto/parafusadeira-x
/black-friday

A URL pública NÃO é a URL do editor.

Editor:

/editor/page/[id]

Público:

/[futuro-slug]

Editar uma página não deve criar uma nova URL.

Publicar não deve mudar automaticamente o slug.

A URL original deve permanecer estável.


# 11. GERENCIADOR DE PÁGINAS

O HUB deve possuir:

HUB
→ Páginas

A listagem deve mostrar todas as páginas.

Cada página deve possuir:

- Editar;
- Visualizar;
- Pré-visualizar;
- Duplicar;
- Publicar;
- Despublicar;
- Copiar URL;
- Excluir.

Clicar em EDITAR deve abrir o editor da página correta.


# 12. ISOLAMENTO DE PÁGINAS

Cada página possui schema independente.

Editar:

Página A

não pode modificar:

Página B.

Componentes locais são independentes.

Somente componentes globais podem compartilhar alterações.


# 13. GLOBAL COMPONENTS

Componentes podem ser:

LOCAL

ou

GLOBAL.

Global:

alteração em uma instância atualiza todas as instâncias vinculadas.

Local:

alteração somente naquela página.

Também deve existir:

CONVERTER GLOBAL → LOCAL


# 14. THEMES

Temas são globais.

Um tema pode controlar:

- fontes;
- cores;
- espaçamento;
- tipografia;
- botões;
- radius;
- sombras;
- design tokens;
- comportamento visual.

Páginas podem usar:

- tema global;
- tema específico;
- overrides locais.

Override local tem prioridade sobre configuração global.


# 15. TEMPLATES

Templates são estruturas reutilizáveis.

Podem existir templates para:

- Home;
- Produto;
- Categoria;
- Segmento;
- Landing;
- Campanha;
- Institucional;
- Checkout;
- outros.

Template não é página.

Template é um modelo para criação/reutilização.


# 16. DESIGN SYSTEM

O projeto deve possuir um Design System centralizado.

Separar:

DESIGN SYSTEM INTERNO
e
DESIGN SYSTEM PÚBLICO.

## HUB

O HUB utiliza o design interno administrativo:

- clean;
- branco;
- objetivo;
- leve;
- profissional;
- mesma tipografia;
- mesmos botões;
- mesmos inputs;
- mesmos cards;
- mesmos espaçamentos.

## SITE

O SITE utiliza a identidade visual padrão oficial TEKNIX (1:1 padrão Apple):

- Top Announcement Ribbon no topo;
- Global Header translúcido com navegação e flyout da sacola;
- Hero Tiles de grande impacto com botões "Saber mais" e "Comprar/Pedido antecipado";
- Mosaico de Promos 2x2 com cards de produto e acabamento limpo;
- Galeria de Entretenimento dinâmica com carrossel e controles;
- Páginas de Produto com Local Nav fixo, Marquee Hero com gradiente, Highlights interativos, seletor visual de cores, capítulos de storytelling (Performance, Display, IA, Conectividade) e vantagens de compra;
- Rodapé Oficial com Diretório de 5 colunas, notas de rodapé legais e copyright;
- Páginas Nativas e Protegidas do Sistema (1:1 Apple Store Oficial):
  * Conta do Cliente (`/conta`);
  * Histórico de Pedidos (`/pedidos`);
  * Itens Salvos (`/itens-salvos`);
  * Sacola de Compras (`/sacola`);
  * Localizador / Busca de Pedidos (`/buscar-pedido`);
  * Iniciar Sessão IDMS em 2 etapas (`/login`);
  * Checkout (`/checkout`).
- editorial, premium, fundo branco/f5f5f7, grandes imagens, produto protagonista.

REGRA PERMANENTE: ESTA IDENTIDADE VISUAL E AS PÁGINAS DO SISTEMA SÃO O PADRÃO OFICIAL DEFINITIVO E NÃO DEVEM SER ALTERADAS OU MODIFICADAS SEM ORDEM EXPLÍCITA.

Não misturar os dois sistemas.


# 17. BIBLIOTECA DO PAGE BUILDER

A biblioteca deve ser baseada em:

- elementos;
- presets;
- blocos;
- seções;
- templates;
- globais;
- efeitos.

Ao arrastar um preset:

ele já deve possuir:

- layout;
- tipografia;
- espaçamento;
- responsividade;
- estilo;
- comportamento.

Preset NÃO significa bloqueado.

Tudo deve continuar editável.


# 18. RESPONSIVIDADE

Todo elemento criado no Page Builder deve possuir suporte a:

- Desktop;
- Tablet;
- Mobile.

Os componentes devem nascer responsivos.

O editor deve permitir selecionar o viewport.

Exemplo:

Desktop
Tablet
Mobile

Mudanças específicas por viewport devem ser possíveis.

Não exigir reconstrução do elemento para cada dispositivo.


# 19. DADOS

Quando possível, utilizar dados reais do banco.

Não criar conteúdo fictício para substituir dados reais do sistema.

Conteúdo DEMO só pode existir quando explicitamente configurado como DEMO.


# 20. DADOS DINÂMICOS

O Page Builder deve suportar dados dinâmicos.

Exemplo:

{{product.name}}
{{product.price}}
{{product.image}}
{{product.description}}
{{product.specifications}}

Isso permite reutilizar os mesmos componentes em diferentes produtos.


# 21. LOOP / COLLECTION

Componentes repetitivos devem suportar dados dinâmicos.

Exemplo:

Product Card

pode renderizar:

Produto A
Produto B
Produto C
Produto D

com filtros, ordenação e limite.


# 22. BANCO DE DADOS

Não alterar tabelas do FLOW para solucionar problemas do HUB ou SITE.

Sempre preferir:

- novas tabelas;
- novas relações;
- novas views;
- novas estruturas isoladas;

quando apropriado.

Antes de ALTER TABLE em qualquer estrutura existente:

AUDITAR DEPENDÊNCIAS.

Verificar:

- FLOW;
- HUB;
- SITE;
- queries;
- RLS;
- serviços;
- triggers;
- integrações.


# 23. MIGRATIONS

Não criar migrations desnecessariamente.

Antes de criar uma migration:

1. verificar se a estrutura já existe;
2. verificar migrations anteriores;
3. verificar dependências;
4. verificar RLS;
5. verificar impacto no FLOW.

Nunca apagar ou sobrescrever migration existente.

Novas migrations devem ser incrementais.


# 24. RLS E SEGURANÇA

A segurança do Supabase deve permanecer ativa.

Nunca resolver problema removendo RLS permanentemente.

Usuários administrativos:

HUB

Usuários públicos:

SITE

Visitantes não devem acessar:

- drafts;
- dados administrativos;
- clientes;
- pedidos privados;
- configurações.


# 25. DEMO MODE

O projeto pode possuir um modo:

DEMO_MODE=true

Durante desenvolvimento:

acesso pode ser mais permissivo.

Porém:

DEMO_MODE NÃO deve destruir a arquitetura de segurança.

Quando o sistema entrar em produção:

DEMO_MODE deve ser desativado.

O usuário demo deve ser removível.


# 26. AUTENTICAÇÃO

Não criar sistemas de autenticação duplicados.

Utilizar a arquitetura oficial de autenticação do projeto.

FLOW, HUB e SITE devem compartilhar identidade quando necessário, mas manter seus próprios escopos de autorização.


# 27. PERMISSÕES

Permissões devem ser separadas por responsabilidade.

Exemplo:

MASTER
ADMIN
EDITOR
CATALOG
MARKETING
FINANCE
SUPPORT

A permissão deve controlar o que o usuário pode acessar no HUB.

Não duplicar sistemas de permissões existentes sem necessidade.


# 28. PRODUTOS

O produto pode ter:

- dados operacionais;
- dados de custo;
- dados da loja;
- dados de apresentação.

Não misturar automaticamente:

CUSTO

com

PREÇO DE VENDA.

Dados de marketplace e dados da loja própria devem possuir separação adequada.


# 29. FLOW → HUB

Futuramente pode existir sincronização.

Exemplo conceitual:

FLOW
↓
catálogo compartilhado
↓
HUB
↓
SITE

Mas essa integração deve ser explícita.

Não fazer alterações mágicas ou silenciosas.

Antes de sincronizar qualquer campo:

documentar origem e destino.


# 30. HUB → SITE

O HUB publica.

O SITE consome.

Fluxo:

HUB
→ Draft
→ Preview
→ Published
→ SITE

O SITE deve mostrar somente estado publicado para visitantes.


# 31. CACHE E PUBLICAÇÃO

Publicação deve atualizar o estado público.

Quando necessário:

- invalidar cache;
- atualizar snapshot;
- atualizar versão;
- garantir consistência do renderer.


# 32. CÓDIGO COMPARTILHADO

Conforme o projeto crescer, utilizar packages compartilhados.

Estrutura recomendada:

packages/
├── ui/
├── types/
├── auth/
├── database/
├── design-system/
└── page-builder/

Não copiar o mesmo código entre:

FLOW
HUB
SITE

quando ele puder ser compartilhado de maneira segura.


# 33. PAGE BUILDER PACKAGE

O motor do Page Builder deve ser reutilizável.

Idealmente conter:

- schema;
- tipos;
- renderer;
- presets;
- components;
- responsive engine;
- utilities.

HUB utiliza o editor.

SITE utiliza o renderer.


# 34. NÃO CRIAR DUPLICAÇÃO

Antes de criar um novo:

- componente;
- serviço;
- hook;
- tipo;
- utilitário;

verificar se já existe.

Evitar:

ProductCard1
ProductCard2
ProductCard3

quando existe um sistema de variantes.


# 35. UI

Toda interface administrativa nova deve reutilizar o Design System do HUB.

Não criar uma tela com aparência completamente diferente.

Mesmo:

Produtos
Clientes
Vendas
Marketing
Checkout
Configurações

devem parecer parte da mesma aplicação.


# 36. SITE

Toda página pública deve reutilizar o Design System público.

Não criar páginas públicas com estilos desconectados entre si.


# 37. TESTES

Antes de considerar uma alteração concluída:

- lint;
- build;
- testes funcionais;
- verificar rotas;
- verificar responsive;
- verificar persistência;
- verificar RLS quando aplicável.

Alterações no HUB devem ser testadas sem quebrar:

SITE
FLOW.


# 38. REGRA DE IMPACTO

Antes de alterar qualquer arquivo:

identificar:

1. aplicação;
2. dependências;
3. consumidores;
4. banco;
5. rotas;
6. APIs.

Nunca modificar por tentativa e erro.


# 39. REGRA PARA IA

Toda IA que trabalhar neste projeto deve seguir este procedimento:

1. INSPECIONAR
2. ENTENDER
3. IDENTIFICAR IMPACTO
4. IMPLEMENTAR
5. TESTAR
6. VERIFICAR BUILD
7. INFORMAR ALTERAÇÕES

Não começar alterando arquivos sem entender a arquitetura.


# 40. REGRA DE NÃO DESTRUIÇÃO

Nunca:

- apagar funcionalidades existentes sem autorização;
- substituir arquivos inteiros desnecessariamente;
- resetar banco;
- apagar dados;
- remover RLS;
- alterar FLOW para corrigir HUB;
- alterar SITE para corrigir FLOW;
- criar duplicação de sistemas.


# 41. REGRA DE DOMÍNIO

Cada sistema possui domínio conceitual próprio.

FLOW:
Marketplace.

HUB:
Loja própria + administração.

SITE:
Cliente final.

Essa separação deve ser mantida permanentemente.


# 42. OBJETIVO FINAL

A arquitetura TEKNIX deve evoluir para:

FLOW
=
sistema de operação de marketplaces

HUB
=
sistema administrativo completo da loja própria

SITE
=
loja pública

PAGE BUILDER
=
motor visual de criação e publicação

DESIGN SYSTEM
=
linguagem visual compartilhada de cada contexto

DATABASE
=
fonte de dados com responsabilidades bem definidas


# 43. REGRA MÁXIMA

ANTES DE FAZER UMA ALTERAÇÃO, SEMPRE PERGUNTAR:

"Esta funcionalidade pertence ao FLOW, HUB ou SITE?"

Se pertence ao FLOW:
não implementar no HUB.

Se pertence ao HUB:
não colocar a lógica administrativa no SITE.

Se pertence ao SITE:
não colocar lógica administrativa no SITE.

Se for compartilhado:
considerar package compartilhado.


# ==============================================================
# REGRA PERMANENTE 44 — PORTAS DE DESENVOLVIMENTO (OFICIAL)
# ==============================================================

ESTA É UMA REGRA ABSOLUTA E IMUTÁVEL.

NENHUMA IA, AGENTE, DESENVOLVEDOR OU FERRAMENTA PODE ALTERAR
AS PORTAS ABAIXO SEM ORDEM EXPLÍCITA E DIRETA DO PROPRIETÁRIO.

## Mapeamento oficial de portas:

SITE   = http://localhost:5173  (porta PRINCIPAL do usuário final)
HUB    = http://localhost:5174  (painel administrativo)
FLOW   = http://localhost:5176  (sistema de marketplaces)

## Regras das portas:

1. O SITE SEMPRE roda na porta 5173.
   - vite.config.ts do SITE deve conter: port: 5173, strictPort: true
   - NUNCA remover strictPort do SITE.

2. O HUB SEMPRE roda na porta 5174.
   - vite.config.ts do HUB deve conter: port: 5174, strictPort: true
   - NUNCA remover strictPort do HUB.

3. Todas as URLs públicas do projeto são baseadas em:
   http://localhost:5173/[rota]

4. Exemplos de rotas oficiais:
   http://localhost:5173/                     → Home
   http://localhost:5173/checkout             → Checkout
   http://localhost:5173/sacola               → Sacola
   http://localhost:5173/conta                → Conta do Cliente
   http://localhost:5173/pedidos              → Histórico de Pedidos
   http://localhost:5173/login                → Login
   http://localhost:5173/produto/:sku         → Produto (por SKU/ID)
   http://localhost:5173/produto/:cat/:slug   → Produto (por categoria/slug)
   http://localhost:5173/ferramentas          → Segmento Ferramentas
   http://localhost:5173/mac                  → Segmento Mac

5. O HUB (administração) fica em:
   http://localhost:5174/

## NUNCA faça:
- Mudar port: 5173 para qualquer outro valor no site/vite.config.ts
- Remover strictPort: true do site/vite.config.ts
- Redirecionar rotas do SITE para outra porta
- Criar um segundo servidor do SITE em porta diferente

# ==============================================================
# FIM DAS REGRAS OFICIAIS
# ==============================================================
