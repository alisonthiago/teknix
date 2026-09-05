# Editor de páginas — HUB / SITE

O editor usa novamente o CSS original do PageEditor e os componentes originais Inspector e Navigator recuperados do backup. O canvas incorpora a página real do SITE (5173), dentro do editor do HUB (5174). FLOW não foi modificado.

## Interface

Painel de 300 px, widgets, Conteúdo / Estilo / Avançado, histórico, dispositivos, estrutura, biblioteca de mídia e editor de imagem. Modelos de página, layout, seção, cabeçalho, rodapé e temas não voltaram à interface. O SITE continua usando seu cabeçalho e rodapé atuais, uma única vez. Páginas nativas permitem editar os widgets existentes; páginas personalizadas também permitem acrescentar widgets básicos. Campos ligados a dados privados ou transacionais continuam dinâmicos.

## Rotas

- `/hub/paginas`: páginas, produtos reais, busca, filtros, criação e ações de páginas personalizadas.
- `/hub/editor/native?path=/...`: widgets de uma rota nativa.
- `/hub/editor/product/:id`: apresentação exclusiva do produto real, sem gravar em products.
- `/hub/editor/page/:id`: página personalizada.
- `/editor/page/:id` e `/hub/paginas/editar/:id`: aliases de edição.
- SITE `/__widget-preview/:id` e `/preview/:id`: prévia fornecida pelo HUB autenticado através de mensagens com validação de origem, janela, página e escopo. Não consultam rascunhos pelo SITE. Abrir `/preview/:id` diretamente mostra somente a publicação pública.

## Persistência e isolamento

`pages.page_styles.published_snapshot_v2` contém a cópia pública completa: page, sections, containers e widgets. Os overrides ficam em `snapshot.page.page_styles.widget_editor_v1`. O renderizador público não lê mais as tabelas de seções, contêineres ou widgets para compor a página.

Rascunhos ficam em outra linha de `pages`, com `type=editor_draft`, `status=draft`, slug reservado por escopo e dados em `page_styles.editor_draft_v2`. Salvar rascunho não muda a linha publicada. O editor lê esse rascunho ao reabrir.

Publicar primeiro salva o rascunho, grava o snapshot no histórico `page_publications`, verifica o resultado e só então troca o snapshot público e o status da página em uma única atualização condicionada à versão lida (`updated_at`). Falha no histórico não publica. Concorrência causa erro explícito. Histórico órfão de uma tentativa conflitante nunca é consumido pelo SITE.

A abertura do gerenciador/editor congela uma vez o conteúdo legado que já estava público, preservando sua apresentação. Uma cópia existente nunca é substituída por essa inicialização. Não foram alteradas tabelas, políticas RLS, produtos ou dados do FLOW. A separação pública usa as políticas existentes para páginas publicadas; as permissões amplas preexistentes para usuários autenticados não foram redesenhadas nesta alteração.

A Home lê a configuração publicada, preservando StorefrontHome como fonte nativa atual; seus widgets leem os overrides da linha raiz (`/` ou slug vazio). A fonte legada alternativa só é renderizada se houver configuração explícita `render_source=builder`. Isso evita substituir a Home atual por um layout antigo encontrado no banco.

Duplicação de páginas personalizadas recria IDs de seções, contêineres e widgets e remapeia seus overrides. A Home nativa é editada diretamente; não é oferecida como modelo duplicável. Endereços de rotas nativas são reservados na criação. Páginas publicadas com dois níveis têm precedência sobre a resolução de categorias; endereços sem página ou categoria válida resultam em 404. `/institucional/*` não redireciona para a Home.

## Validação

`node --test apps/hub/tests/widgetEditor.test.cjs` cobre separação de rascunhos, escopo por produto, ordem da publicação, falha do histórico, conflitos de escrita, preservação de snapshots e normalização de endereços.

Verificação no navegador: rascunho persistido e reaberto sem mudar a Home pública; restauração do texto original e publicação; criação de página, widget, publicação em URL com dois níveis, cabeçalho/rodapé únicos, duplicação independente em rascunho, prévia e exclusão das páginas temporárias; carregamento dos widgets de produto real. Builds HUB e SITE aprovados. Lint do SITE e dos arquivos do editor aprovados com avisos. O comando global de lint do HUB encontra quatro arquivos de terceiros malformados em public/assets/font-awesome, fora do editor.
