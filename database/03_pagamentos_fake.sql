-- ========================================
-- HISTÓRICO DE PAGAMENTOS REALISTAS
-- Com variações de atraso por cliente
-- ========================================

-- PAGAMENTOS CLIENTE CLI001 (Confecções Vitória - Cliente pontual)
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 1, 'CLI001', DATE '2024-02-13', 15750.80, -2, 'PIX', SYSDATE-292, 'Pagamento antecipado - desconto');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 2, 'CLI001', DATE '2024-05-25', 22400.50, 5, 'Transferência Bancária', SYSDATE-190, 'Pagamento com pequeno atraso');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 3, 'CLI001', DATE '2024-09-02', 18900.00, 3, 'Boleto', SYSDATE-108, 'Pagamento dentro do prazo');

-- PAGAMENTOS CLIENTE CLI002 (Moda Brasileira - Cliente premium)
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 5, 'CLI002', DATE '2024-03-12', 45200.75, 7, 'Transferência Bancária', SYSDATE-278, 'Pagamento integral');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 6, 'CLI002', DATE '2024-06-22', 38950.30, 7, 'PIX', SYSDATE-158, 'Pagamento com leve atraso');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 7, 'CLI002', DATE '2024-09-28', 52750.80, 8, 'Transferência Bancária', SYSDATE-72, 'Pagamento alto valor');

-- PAGAMENTOS CLIENTE CLI003 (Textil Nordeste - Cliente regular)
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 9, 'CLI003', DATE '2024-03-02', 31500.90, 3, 'Boleto', SYSDATE-278, 'Pagamento pontual');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 10, 'CLI003', DATE '2024-06-18', 25200.36, 10, 'PIX', SYSDATE-165, 'Pagamento parcial');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 11, 'CLI003', DATE '2024-09-20', 34200.75, 8, 'Transferência Bancária', SYSDATE-90, 'Pagamento regular');

-- PAGAMENTOS CLIENTE CLI004 (Fashion House - Cliente problemático)
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 13, 'CLI004', DATE '2024-03-05', 18750.50, 45, 'Boleto', SYSDATE-275, 'Pagamento com atraso significativo');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 14, 'CLI004', DATE '2024-06-29', 24300.80, 60, 'Transferência Bancária', SYSDATE-175, 'Atraso de 2 meses');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 15, 'CLI004', DATE '2024-10-29', 21950.75, 75, 'PIX', SYSDATE-55, 'Atraso crítico de 2.5 meses');

-- PAGAMENTOS CLIENTE CLI005 (Confecções Bela Vista - Micro empresa pontual)
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 17, 'CLI005', DATE '2024-03-12', 12400.25, 2, 'PIX', SYSDATE-268, 'Micro empresa pontual');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 18, 'CLI005', DATE '2024-06-28', 15750.60, 3, 'Boleto', SYSDATE-155, 'Pontualidade mantida');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 19, 'CLI005', DATE '2024-10-08', 18950.30, 3, 'PIX', SYSDATE-75, 'Consistência no pagamento');

-- ========================================
-- INSERIR MAIS CLIENTES E HISTÓRICO
-- ========================================

-- CLIENTE CLI006: Têxtil Gaúcha (Exportação - volumes altos, atrasos médios)
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI006', 'Têxtil Gaúcha Exportação Ltda', 'VER2024', 'Verão 2024', DATE '2024-01-25', 78500.40, 78500.40, 'PAGO', 'Algodão Export', 5200.00, 15, 'Cliente exportação', SYSDATE-315, SYSDATE-300);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI006', 'Têxtil Gaúcha Exportação Ltda', 'OUT2024', 'Outono 2024', DATE '2024-05-10', 92750.80, 92750.80, 'PAGO', 'Linho Premium Export', 6100.00, 20, 'Volume exportação', SYSDATE-200, SYSDATE-185);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI006', 'Têxtil Gaúcha Exportação Ltda', 'INV2024', 'Inverno 2024', DATE '2024-08-20', 85400.25, 85400.25, 'PAGO', 'Lã Import Premium', 5680.00, 18, 'Produto importado', SYSDATE-125, SYSDATE-110);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI006', 'Têxtil Gaúcha Exportação Ltda', 'PRI2025', 'Primavera 2025', DATE '2024-12-05', 95200.60, 0, 'PENDENTE', 'Seda Chinesa Premium', 6320.00, 22, 'Pedido especial export', SYSDATE-35, SYSDATE-35);

INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 21, 'CLI006', DATE '2024-02-10', 78500.40, 16, 'Transferência Internacional', SYSDATE-300, 'Exportação - câmbio');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 22, 'CLI006', DATE '2024-05-25', 92750.80, 15, 'Transferência Internacional', SYSDATE-185, 'Pagamento export');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 23, 'CLI006', DATE '2024-09-05', 85400.25, 16, 'Transferência Internacional', SYSDATE-110, 'Atraso cambial padrão');

-- CLIENTE CLI007: Malharia São Paulo (Industrial - volumes médios, pontualidade boa)
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI007', 'Malharia São Paulo Industrial S.A.', 'VER2024', 'Verão 2024', DATE '2024-02-20', 35900.75, 35900.75, 'PAGO', 'Malha Circular', 2400.00, 8, 'Produção industrial', SYSDATE-305, SYSDATE-295);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI007', 'Malharia São Paulo Industrial S.A.', 'OUT2024', 'Outono 2024', DATE '2024-06-05', 42800.30, 42800.30, 'PAGO', 'Jersey Algodão', 2850.00, 10, 'Volume industrial', SYSDATE-175, SYSDATE-165);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI007', 'Malharia São Paulo Industrial S.A.', 'INV2024', 'Inverno 2024', DATE '2024-09-15', 38750.90, 38750.90, 'PAGO', 'Fleece Industrial', 2580.00, 12, 'Produto inverno', SYSDATE-105, SYSDATE-95);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI007', 'Malharia São Paulo Industrial S.A.', 'PRI2025', 'Primavera 2025', DATE '2024-12-20', 41200.45, 0, 'PENDENTE', 'Malha Piquet', 2740.00, 15, 'Pedido primavera', SYSDATE-20, SYSDATE-20);

INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 25, 'CLI007', DATE '2024-02-25', 35900.75, 5, 'Transferência Bancária', SYSDATE-295, 'Pagamento industrial pontual');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 26, 'CLI007', DATE '2024-06-12', 42800.30, 7, 'Boleto Bancário', SYSDATE-165, 'Atraso mínimo aceitável');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 27, 'CLI007', DATE '2024-09-22', 38750.90, 7, 'PIX Empresarial', SYSDATE-95, 'Consistência no prazo');

-- CLIENTE CLI008: Fios e Tecidos MG (Fornecedor médio porte - atrasos ocasionais)
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI008', 'Fios e Tecidos Minas Gerais Ltda', 'VER2024', 'Verão 2024', DATE '2024-03-01', 28400.60, 28400.60, 'PAGO', 'Fio de Algodão', 1890.00, 5, 'Fornecimento regional', SYSDATE-290, SYSDATE-275);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI008', 'Fios e Tecidos Minas Gerais Ltda', 'OUT2024', 'Outono 2024', DATE '2024-06-12', 32750.25, 32750.25, 'PAGO', 'Tecido Misto', 2180.00, 0, 'Sem desconto aplicado', SYSDATE-170, SYSDATE-155);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI008', 'Fios e Tecidos Minas Gerais Ltda', 'INV2024', 'Inverno 2024', DATE '2024-09-08', 29850.80, 29850.80, 'PAGO', 'Lã Sintética', 1990.00, 3, 'Produto sintético', SYSDATE-112, SYSDATE-100);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI008', 'Fios e Tecidos Minas Gerais Ltda', 'PRI2025', 'Primavera 2025', DATE '2025-01-08', 31200.40, 0, 'PENDENTE', 'Viscose Premium', 2080.00, 5, 'Pedido início ano', SYSDATE-12, SYSDATE-12);

INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 29, 'CLI008', DATE '2024-03-15', 28400.60, 14, 'Boleto', SYSDATE-275, 'Atraso de 2 semanas');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 30, 'CLI008', DATE '2024-06-25', 32750.25, 13, 'Transferência', SYSDATE-155, 'Atraso similar anterior');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 31, 'CLI008', DATE '2024-09-20', 29850.80, 12, 'PIX', SYSDATE-100, 'Melhora no prazo');

-- ========================================
-- CLIENTE CRÍTICO PARA TESTE DE SCORING
-- ========================================

-- CLIENTE CLI050: Confecções Problemáticas LTDA (Cliente de alto risco)
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI050', 'Confecções Problemáticas LTDA', 'VER2024', 'Verão 2024', DATE '2024-01-15', 25800.50, 25800.50, 'PAGO', 'Algodão Básico', 1720.00, 0, 'Primeiro pedido pontual', SYSDATE-330, SYSDATE-240);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI050', 'Confecções Problemáticas LTDA', 'OUT2024', 'Outono 2024', DATE '2024-04-20', 31500.75, 31500.75, 'PAGO', 'Poliéster Básico', 2100.00, 0, 'Atraso significativo', SYSDATE-245, SYSDATE-150);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI050', 'Confecções Problemáticas LTDA', 'INV2024', 'Inverno 2024', DATE '2024-07-30', 28750.20, 28750.20, 'PAGO', 'Acrílico Sintético', 1920.00, 0, 'Atraso crítico', SYSDATE-155, SYSDATE-45);
INSERT INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI050', 'Confecções Problemáticas LTDA', 'PRI2025', 'Primavera 2025', DATE '2024-11-15', 35200.90, 0, 'VENCIDO', 'Elastano Stretch', 2350.00, 0, 'Cliente em inadimplência', SYSDATE-55, SYSDATE-55);

INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 33, 'CLI050', DATE '2024-03-01', 25800.50, 45, 'Boleto', SYSDATE-240, 'Atraso 45 dias - primeiro sinal');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 34, 'CLI050', DATE '2024-06-15', 31500.75, 56, 'Transferência', SYSDATE-150, 'Atraso piorou - 56 dias');
INSERT INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, 35, 'CLI050', DATE '2024-10-10', 28750.20, 72, 'PIX', SYSDATE-45, 'Atraso crítico 72 dias');
-- CLI050 não tem pagamento da última duplicata (vencida)

COMMIT;

-- ========================================
-- ATUALIZAÇÃO DE STATUS BASEADA NOS PAGAMENTOS
-- ========================================

-- Atualizar status das duplicatas vencidas sem pagamento
UPDATE f_duplicatas 
SET status_duplicata = 'VENCIDO' 
WHERE data_vencimento < SYSDATE 
AND id_duplicata NOT IN (SELECT DISTINCT id_duplicata FROM f_pagamentos);

-- Verificar integridade dos dados
SELECT 'Duplicatas inseridas' as tabela, COUNT(*) as registros FROM f_duplicatas
UNION ALL
SELECT 'Pagamentos inseridos' as tabela, COUNT(*) as registros FROM f_pagamentos
UNION ALL
SELECT 'Clientes únicos' as tabela, COUNT(DISTINCT codigo_cliente) as registros FROM f_duplicatas
UNION ALL
SELECT 'Coleções únicas' as tabela, COUNT(DISTINCT codigo_colecao) as registros FROM f_duplicatas;

COMMIT;