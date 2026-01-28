-- ========================================
-- DADOS EXTRAS PARA COMPLETAR 50+ CLIENTES
-- Sistema realista para impressionar o Lucas!
-- ========================================

-- Inserir mais clientes para completar a base de 50+
-- CLIENTES 009-025: Empresas médias e pequenas

-- CLI009: Indústria de Confecções Rio Verde
INSERT ALL
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI009', 'Indústria de Confecções Rio Verde Ltda', 'VER2024', 'Verão 2024', DATE '2024-02-10', 42300.85, 42300.85, 'PAGO', 'Algodão Colorido', 2820.00, 8, 'Cliente industrial médio', SYSDATE-310, SYSDATE-285)
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI009', 'Indústria de Confecções Rio Verde Ltda', 'OUT2024', 'Outono 2024', DATE '2024-05-25', 38950.40, 38950.40, 'PAGO', 'Denim Premium', 2600.00, 10, 'Desconto fidelidade', SYSDATE-195, SYSDATE-180)
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI009', 'Indústria de Confecções Rio Verde Ltda', 'INV2024', 'Inverno 2024', DATE '2024-08-18', 45200.75, 45200.75, 'PAGO', 'Lã Processada', 3015.00, 12, 'Volume alto inverno', SYSDATE-128, SYSDATE-115)
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI009', 'Indústria de Confecções Rio Verde Ltda', 'PRI2025', 'Primavera 2025', DATE '2024-12-15', 47800.90, 0, 'PENDENTE', 'Viscose Estampada', 3185.00, 15, 'Pedido primavera premium', SYSDATE-25, SYSDATE-25)

INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, CURRVAL('seq_duplicatas')-3, 'CLI009', DATE '2024-02-22', 42300.85, 12, 'Transferência Bancária', SYSDATE-285, 'Pagamento dentro prazo esperado')
INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, CURRVAL('seq_duplicatas')-2, 'CLI009', DATE '2024-06-08', 38950.40, 14, 'Boleto', SYSDATE-180, 'Atraso de 2 semanas')
INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, CURRVAL('seq_duplicatas')-1, 'CLI009', DATE '2024-09-02', 45200.75, 15, 'PIX Empresarial', SYSDATE-115, 'Pagamento com atraso médio')
SELECT 1 FROM DUAL;

-- CLI010: Atacado Têxtil Centro-Oeste
INSERT ALL
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI010', 'Atacado Têxtil Centro-Oeste S.A.', 'VER2024', 'Verão 2024', DATE '2024-01-30', 89750.60, 89750.60, 'PAGO', 'Mix Verão Atacado', 5980.00, 20, 'Volume atacadista', SYSDATE-325, SYSDATE-310)
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI010', 'Atacado Têxtil Centro-Oeste S.A.', 'OUT2024', 'Outono 2024', DATE '2024-04-25', 95200.40, 95200.40, 'PAGO', 'Mix Outono Atacado', 6350.00, 25, 'Desconto volume', SYSDATE-240, SYSDATE-220)
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI010', 'Atacado Têxtil Centro-Oeste S.A.', 'INV2024', 'Inverno 2024', DATE '2024-07-20', 102750.80, 102750.80, 'PAGO', 'Mix Inverno Atacado', 6850.00, 30, 'Super desconto volume', SYSDATE-145, SYSDATE-125)
INTO f_duplicatas VALUES (seq_duplicatas.NEXTVAL, 'CLI010', 'Atacado Têxtil Centro-Oeste S.A.', 'PRI2025', 'Primavera 2025', DATE '2024-11-10', 110200.50, 0, 'PENDENTE', 'Mix Primavera Atacado', 7350.00, 35, 'Maior pedido do ano', SYSDATE-60, SYSDATE-60)

INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, CURRVAL('seq_duplicatas')-3, 'CLI010', DATE '2024-02-15', 89750.60, 16, 'Transferência', SYSDATE-310, 'Atacadista - prazo estendido')
INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, CURRVAL('seq_duplicatas')-2, 'CLI010', DATE '2024-05-12', 95200.40, 17, 'Boleto', SYSDATE-220, 'Prazo atacado normal')
INTO f_pagamentos VALUES (seq_pagamentos.NEXTVAL, CURRVAL('seq_duplicatas')-1, 'CLI010', DATE '2024-08-08', 102750.80, 19, 'Transferência', SYSDATE-125, 'Pagamento alto volume')
SELECT 1 FROM DUAL;

-- INSERIR RAPIDAMENTE MAIS CLIENTES (CLI011-CLI050)
-- Usando padrões para acelerar o processo

-- Clientes de diversos portes e perfis
DECLARE
    v_base_date DATE := DATE '2024-01-01';
    v_codigo_cliente VARCHAR2(6);
    v_nome_cliente VARCHAR2(100);
    v_valor_base NUMBER;
    v_atraso_base NUMBER;
    
    -- Arrays de nomes realistas
    TYPE t_nomes IS TABLE OF VARCHAR2(100);
    nomes t_nomes := t_nomes(
        'Confecções Elegance Premium Ltda',
        'Malharia Três Irmãos S.A.',
        'Textil Inovação Brasileira EIRELI',
        'Indústria Roupas Modernas ME',
        'Atacado Fashion Sul Ltda',
        'Confecções Família Oliveira',
        'Têxtil Nordeste Premium S.A.',
        'Moda Jovem Brasil Ltda',
        'Indústria Criativa Têxtil ME',
        'Confecções Alta Costura S.A.',
        'Malharia Tecnologia Avançada',
        'Textil Sustentável Brasil',
        'Confecções Tradicionais Ltda',
        'Moda Infantil Especial S.A.',
        'Têxtil Exportação Nacional',
        'Confecções Delicadas ME',
        'Indústria Roupas Esportivas',
        'Malharia Conforto Total',
        'Textil Luxo Brasileiro S.A.',
        'Confecções Econômicas Ltda',
        'Moda Praia Tropical S.A.',
        'Têxtil Orgânico Natural ME',
        'Confecções Sob Medida Ltda',
        'Indústria Jeans Premium',
        'Malharia Soft Touch S.A.',
        'Textil Cores Vivas Ltda',
        'Confecções Mineiras ME',
        'Moda Festa Elegance S.A.',
        'Têxtil Fibras Especiais',
        'Confecções Rápida Entrega',
        'Indústria Tecidos Nobres',
        'Malharia Flexível Ltda',
        'Textil Inovação Química',
        'Confecções Artesanais ME',
        'Moda Executiva Brasil S.A.',
        'Têxtil Reciclagem Verde',
        'Confecções Plus Size Ltda',
        'Indústria Uniformes Pro',
        'Malharia Performance S.A.',
        'Textil Digital Print ME'
    );
    
    TYPE t_produtos IS TABLE OF VARCHAR2(50);
    produtos t_produtos := t_produtos(
        'Algodão Penteado',
        'Poliéster Microfibra',
        'Viscose Bambu',
        'Elastano Sport',
        'Linho Europeu',
        'Seda Natural',
        'Lã Merino',
        'Modal Premium',
        'Tencel Sustentável',
        'Crepe Textura',
        'Jersey Flame',
        'Malha Canelada',
        'Tricoline Lisa',
        'Oxford Fio Tinto',
        'Gabardine Stretch',
        'Moletom Flanelado',
        'Fleece Antibolling',
        'Plush Macio',
        'Cetim Duchesse',
        'Tafetá Impermeável'
    );

BEGIN
    -- Gerar clientes CLI011 a CLI050
    FOR i IN 11..50 LOOP
        v_codigo_cliente := 'CLI' || LPAD(i, 3, '0');
        v_nome_cliente := nomes(MOD(i-11, nomes.COUNT) + 1);
        
        -- Diferentes perfis de cliente
        CASE MOD(i, 4)
            WHEN 0 THEN  -- Cliente premium
                v_valor_base := 50000 + (i * 1000);
                v_atraso_base := 5;
            WHEN 1 THEN  -- Cliente médio
                v_valor_base := 25000 + (i * 500);
                v_atraso_base := 12;
            WHEN 2 THEN  -- Cliente pequeno
                v_valor_base := 15000 + (i * 300);
                v_atraso_base := 8;
            WHEN 3 THEN  -- Cliente problemático
                v_valor_base := 20000 + (i * 400);
                v_atraso_base := 25;
        END CASE;
        
        -- Inserir 4 coleções por cliente
        FOR j IN 1..4 LOOP
            DECLARE
                v_colecao VARCHAR2(20);
                v_nome_colecao VARCHAR2(50);
                v_data_venc DATE;
                v_valor NUMBER;
                v_produto VARCHAR2(50);
                v_quantidade NUMBER;
                v_desconto NUMBER;
                v_status VARCHAR2(20);
                v_dias_atraso NUMBER;
                v_data_pagto DATE;
            BEGIN
                CASE j
                    WHEN 1 THEN v_colecao := 'VER2024'; v_nome_colecao := 'Verão 2024'; v_data_venc := v_base_date + (i*5) + 30;
                    WHEN 2 THEN v_colecao := 'OUT2024'; v_nome_colecao := 'Outono 2024'; v_data_venc := v_base_date + (i*5) + 120;
                    WHEN 3 THEN v_colecao := 'INV2024'; v_nome_colecao := 'Inverno 2024'; v_data_venc := v_base_date + (i*5) + 210;
                    WHEN 4 THEN v_colecao := 'PRI2025'; v_nome_colecao := 'Primavera 2025'; v_data_venc := v_base_date + (i*5) + 300;
                END CASE;
                
                v_valor := v_valor_base + (j * 2000) + DBMS_RANDOM.VALUE(-5000, 5000);
                v_produto := produtos(MOD((i*j), produtos.COUNT) + 1);
                v_quantidade := ROUND(v_valor / 18.5, 2); -- Preço médio por peça
                v_desconto := CASE WHEN MOD(i, 5) = 0 THEN DBMS_RANDOM.VALUE(5, 20) ELSE 0 END;
                
                -- Status baseado na data
                IF j <= 3 THEN
                    v_status := 'PAGO';
                    v_dias_atraso := v_atraso_base + DBMS_RANDOM.VALUE(-5, 10);
                    v_data_pagto := v_data_venc + v_dias_atraso;
                ELSE
                    -- Últimas coleções: algumas pendentes
                    IF MOD(i, 6) = 0 THEN
                        v_status := 'VENCIDO';
                        v_dias_atraso := 0;
                        v_data_pagto := NULL;
                    ELSE
                        v_status := 'PENDENTE';
                        v_dias_atraso := 0;
                        v_data_pagto := NULL;
                    END IF;
                END IF;
                
                -- Inserir duplicata
                INSERT INTO f_duplicatas VALUES (
                    seq_duplicatas.NEXTVAL,
                    v_codigo_cliente,
                    v_nome_cliente,
                    v_colecao,
                    v_nome_colecao,
                    v_data_venc,
                    v_valor,
                    CASE WHEN v_status = 'PAGO' THEN v_valor ELSE 0 END,
                    v_status,
                    v_produto,
                    v_quantidade,
                    v_desconto,
                    CASE WHEN MOD(i, 7) = 0 THEN 'Cliente estratégico' ELSE NULL END,
                    SYSDATE - (400 - (j*90)),
                    SYSDATE - (400 - (j*90))
                );
                
                -- Inserir pagamento se pago
                IF v_status = 'PAGO' THEN
                    INSERT INTO f_pagamentos VALUES (
                        seq_pagamentos.NEXTVAL,
                        seq_duplicatas.CURRVAL,
                        v_codigo_cliente,
                        v_data_pagto,
                        v_valor,
                        v_dias_atraso,
                        CASE MOD(j, 3) 
                            WHEN 0 THEN 'PIX'
                            WHEN 1 THEN 'Transferência'
                            ELSE 'Boleto'
                        END,
                        v_data_pagto,
                        CASE WHEN v_dias_atraso > 20 THEN 'Atraso significativo' ELSE NULL END
                    );
                END IF;
            END;
        END LOOP;
    END LOOP;
END;
/

-- ========================================
-- QUERIES DE DEMONSTRAÇÃO PARA LUCAS
-- ========================================

PROMPT ========================================
PROMPT RELATÓRIO EXECUTIVO DE SCORING
PROMPT Sistema de Análise de Crédito Têxtil
PROMPT ========================================

-- 1. Resumo geral da base
SELECT 
    'Total de Clientes' as Metrica,
    COUNT(DISTINCT codigo_cliente) as Valor,
    '' as Observacao
FROM f_duplicatas
UNION ALL
SELECT 
    'Total de Pedidos',
    COUNT(*),
    'Últimos 12 meses'
FROM f_duplicatas
UNION ALL
SELECT 
    'Valor Total Relacionamento',
    ROUND(SUM(valor_original)/1000, 0),
    'Em milhares (R$)'
FROM f_duplicatas
UNION ALL
SELECT 
    'Total de Pagamentos',
    COUNT(*),
    'Histórico completo'
FROM f_pagamentos;

-- 2. Top 10 Clientes por Score
PROMPT 
PROMPT Top 10 Clientes - Melhores Scores:

SELECT 
    ROWNUM as Ranking,
    codigo_cliente,
    SUBSTR(nome_cliente, 1, 40) as Nome_Cliente,
    score_final as Score,
    classificacao_risco as Risco,
    ROUND(valor_total_relacionamento/1000, 0) as Valor_Total_k
FROM (
    SELECT * FROM v_scoring_consolidado 
    ORDER BY score_final DESC, valor_total_relacionamento DESC
)
WHERE ROWNUM <= 10;

-- 3. Clientes de Alto Risco
PROMPT 
PROMPT Clientes de Alto Risco (Atenção Especial):

SELECT 
    codigo_cliente,
    SUBSTR(nome_cliente, 1, 35) as Nome_Cliente,
    score_final as Score,
    maior_atraso_dias as Maior_Atraso,
    ROUND(atraso_medio_dias, 1) as Atraso_Medio,
    tendencia_atraso as Tendencia
FROM v_scoring_consolidado 
WHERE classificacao_risco IN ('RISCO_CRÍTICO', 'RISCO_ALTO')
ORDER BY score_final ASC;

-- 4. Análise de Tendências
PROMPT 
PROMPT Análise de Tendências de Pagamento:

SELECT 
    tendencia_atraso as Tendencia,
    COUNT(*) as Qtd_Clientes,
    ROUND(AVG(score_final), 1) as Score_Medio,
    ROUND(AVG(valor_total_relacionamento)/1000, 0) as Valor_Medio_k
FROM v_scoring_consolidado 
WHERE tendencia_atraso IS NOT NULL
GROUP BY tendencia_atraso
ORDER BY Score_Medio DESC;

-- 5. Impacto das Configurações
PROMPT 
PROMPT Comparativo de Configurações de Scoring:

SELECT 
    'Conservador' as Configuracao,
    ROUND(AVG(score_conservador), 1) as Score_Medio,
    COUNT(CASE WHEN score_conservador >= 70 THEN 1 END) as Clientes_Aprovados
FROM v_comparativo_configuracoes
UNION ALL
SELECT 
    'Equilibrado',
    ROUND(AVG(score_equilibrado), 1),
    COUNT(CASE WHEN score_equilibrado >= 70 THEN 1 END)
FROM v_comparativo_configuracoes
UNION ALL
SELECT 
    'Agressivo',
    ROUND(AVG(score_agressivo), 1),
    COUNT(CASE WHEN score_agressivo >= 70 THEN 1 END)
FROM v_comparativo_configuracoes;

-- ========================================
-- SCRIPT PARA EXPORTAÇÃO DOS DADOS
-- ========================================

PROMPT 
PROMPT Gerando dados para exportação...

-- Criar view final para API/Frontend
CREATE OR REPLACE VIEW v_dados_dashboard AS
SELECT 
    -- Dados do cliente
    s.codigo_cliente,
    s.nome_cliente,
    s.score_final,
    s.classificacao_risco,
    
    -- Métricas detalhadas
    s.percentual_variacao_pedido,
    s.maior_atraso_dias,
    s.atraso_medio_dias,
    s.tendencia_atraso,
    
    -- Valores financeiros
    s.valor_total_relacionamento,
    s.total_colecoes,
    s.total_duplicatas,
    
    -- Scores por configuração
    c.score_conservador,
    c.score_equilibrado,
    c.score_agressivo,
    c.config_recomendada,
    
    -- Dados temporais
    (SELECT MIN(data_vencimento) FROM f_duplicatas WHERE codigo_cliente = s.codigo_cliente) as primeiro_pedido,
    (SELECT MAX(data_vencimento) FROM f_duplicatas WHERE codigo_cliente = s.codigo_cliente) as ultimo_pedido,
    
    -- Indicadores de qualidade
    CASE 
        WHEN s.total_pagamentos >= 3 THEN 'HISTORICO_SUFICIENTE'
        WHEN s.total_pagamentos >= 1 THEN 'HISTORICO_LIMITADO'
        ELSE 'SEM_HISTORICO'
    END as qualidade_dados

FROM v_scoring_consolidado s
LEFT JOIN v_comparativo_configuracoes c ON s.codigo_cliente = c.codigo_cliente
ORDER BY s.score_final DESC;

-- Estatísticas finais
PROMPT 
PROMPT ========================================
PROMPT ESTATÍSTICAS FINAIS DO SISTEMA
PROMPT ========================================

SELECT 
    'Duplicatas criadas' as Item,
    TO_CHAR(COUNT(*), '999,999') as Quantidade
FROM f_duplicatas
UNION ALL
SELECT 
    'Pagamentos registrados',
    TO_CHAR(COUNT(*), '999,999')
FROM f_pagamentos
UNION ALL
SELECT 
    'Clientes únicos',
    TO_CHAR(COUNT(DISTINCT codigo_cliente), '999,999')
FROM f_duplicatas
UNION ALL
SELECT 
    'Período de dados',
    TO_CHAR(MIN(data_vencimento), 'DD/MM/YYYY') || ' a ' || TO_CHAR(MAX(data_vencimento), 'DD/MM/YYYY')
FROM f_duplicatas
UNION ALL
SELECT 
    'Valor total (R$)',
    TO_CHAR(SUM(valor_original), '999,999,999.99')
FROM f_duplicatas;

COMMIT;

PROMPT 
PROMPT ========================================
PROMPT 🎉 SISTEMA DE SCORING CRIADO COM SUCESSO!
PROMPT 
PROMPT ✅ 50+ clientes com histórico realista
PROMPT ✅ 4 métricas de scoring implementadas  
PROMPT ✅ Sistema de ponderação configurável
PROMPT ✅ Dados fake que vão impressionar!
PROMPT ========================================