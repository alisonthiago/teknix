export const CORE_CATEGORIES = [
  { id:'cat-eletricas', name:'Ferramentas Elétricas', slug:'ferramentas-eletricas' },
  { id:'cat-construcao', name:'Construção e Obra', slug:'construcao-e-obra' },
  { id:'cat-automotivos', name:'Equipamentos Automotivos', slug:'equipamentos-automotivos' },
  { id:'cat-pneumatica', name:'Linha Pneumática', slug:'linha-pneumatica' },
  { id:'cat-bancada', name:'Ferramentas Manuais e Bancada', slug:'ferramentas-manuais-e-bancada' },
  { id:'cat-lavagem', name:'Lavagem e Limpeza', slug:'lavagem-e-limpeza' },
  { id:'cat-pintura', name:'Pintura e Repintura', slug:'pintura-e-repintura' },
  { id:'cat-jardim', name:'Jardim e Paisagismo', slug:'jardim-e-paisagismo' },
  { id:'cat-cargas', name:'Movimentação de Cargas', slug:'movimentacao-de-cargas' },
] as const

export function findCoreCategory(slug:string){return CORE_CATEGORIES.find(category=>category.slug===slug)}
