# Espaçamentos do SITE

Fonte de verdade: `src/styles/spacing.css`, importado depois dos estilos globais.

- Escala: 4, 8, 12, 16, 24, 32, 48 e 64px (`--tkn-space-*`).
- Ícone e texto: 8px; elementos próximos: 12–16px.
- Cards: `--tkn-card-padding` (24px; 16px no celular).
- Colunas de compra: `--tkn-layout-gap` (32px; 24px em telas menores).
- Seções de produto: `--tkn-section-gap` (64px desktop, 48px tablet, 32px celular).
- Margens internas das páginas de conta/compra: `--tkn-content-gutter`
  (32px desktop, 24px tablet, 16px celular).

Os estilos estáticos usam a escala para margens, padding e gap. Valores de
posicionamento negativo, dimensões de imagens, alinhamentos ópticos menores que
4px e respiros editoriais maiores que 64px são preservados. Layouts publicados
pelo HUB e configurações inline editoriais não são sobrescritos.

Ao criar componentes, escolher valores pelo papel do elemento, não por página.
Verificar desktop e celular, especialmente títulos longos e formulários.
