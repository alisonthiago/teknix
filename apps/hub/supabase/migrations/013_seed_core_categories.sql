insert into public.categories (name,slug,active,is_active,show_in_menu,sort_order) values
('Ferramentas Elétricas','ferramentas-eletricas',true,true,true,10),
('Construção e Obra','construcao-e-obra',true,true,true,20),
('Equipamentos Automotivos','equipamentos-automotivos',true,true,true,30),
('Linha Pneumática','linha-pneumatica',true,true,true,40),
('Ferramentas Manuais e Bancada','ferramentas-manuais-e-bancada',true,true,true,50),
('Lavagem e Limpeza','lavagem-e-limpeza',true,true,true,60),
('Pintura e Repintura','pintura-e-repintura',true,true,true,70),
('Jardim e Paisagismo','jardim-e-paisagismo',true,true,true,80),
('Movimentação de Cargas','movimentacao-de-cargas',true,true,true,90)
on conflict (slug) do update set name=excluded.name,is_active=true,show_in_menu=true,sort_order=excluded.sort_order;
