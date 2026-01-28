-- ========================================
-- CÁLCULO DAS 4 MÉTRICAS DE SCORING
-- Sistema de análise de crédito têxtil
-- ========================================

-- ========================================
-- 1. VARIAÇÃO DE PEDIDO VS COLEÇÃO ANTERIOR
-- ========================================

CREATE OR REPLACE VIEW v_variacao_pedido AS
WITH pedidos_por_colecao AS (
    SELECT 
        codigo_cliente,
        nome_cliente,
        codigo_colecao,
        SUM(valor_original) as valor_total_colecao,
        COUNT(*) as qtd_pedidos_colecao,
        AVG(valor_original) as valor_medio_pedido
    FROM f_duplicatas 
    GROUP BY codigo_cliente, nome_cliente, codigo_colecao
),
pedidos_com_sequencia AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY codigo_cliente ORDER BY codigo_colecao) as seq_colecao,
        LAG(valor_total_colecao) OVER (PARTITION BY codigo_cliente ORDER BY codigo_colecao) as valor_colecao_anterior
    FROM pedidos_por_colecao
)
SELECT 
    codigo_cliente,
    nome_cliente,
    codigo_colecao,
    valor_total_colecao,
    valor_colecao_anterior,
    CASE 
        WHEN valor_colecao_anterior IS NULL THEN 0
        WHEN valor_colecao_anterior = 0 THEN 100
        ELSE ROUND(((valor_total_colecao - valor_colecao_anterior) / valor_colecao_anterior) * 100, 2)
    END as percentual_variacao_pedido
FROM pedidos_com_sequencia;

-- ========================================
-- 2. MAIOR ATRASO HISTÓRICO
-- ========================================

CREATE OR REPLACE VIEW v_maior_atraso_historico AS
SELECT 
    p.codigo_cliente,
    d.nome_cliente,
    MAX(p.dias_atraso) as maior_atraso_dias,
    -- Classificação do atraso
    CASE 
        WHEN MAX(p.dias_atraso) <= 7 THEN 'EXCELENTE'
        WHEN MAX(p.dias_atraso) <= 15 THEN 'BOM'
        WHEN MAX(p.dias_atraso) <= 30 THEN 'REGULAR'
        WHEN MAX(p.dias_atraso) <= 60 THEN 'RUIM'
        ELSE 'CRÍTICO'
    END as classificacao_atraso,
    -- Score baseado no maior atraso (0-100)
    CASE 
        WHEN MAX(p.dias_atraso) <= 7 THEN 100
        WHEN MAX(p.dias_atraso) <= 15 THEN 85
        WHEN MAX(p.dias_atraso) <= 30 THEN 70
        WHEN MAX(p.dias_atraso) <= 60 THEN 40
        ELSE 10
    END as score_maior_atraso,
    COUNT(*) as total_pagamentos,
    MIN(p.data_pagamento) as primeiro_pagamento,
    MAX(p.data_pagamento) as ultimo_pagamento
FROM f_pagamentos p
JOIN f_duplicatas d ON p.codigo_cliente = d.codigo_cliente
GROUP BY p.codigo_cliente, d.nome_cliente;

-- ========================================
-- 3. ATRASO MÉDIO
-- ========================================

CREATE OR REPLACE VIEW v_atraso_medio AS
SELECT 
    p.codigo_cliente,
    d.nome_cliente,
    ROUND(AVG(p.dias_atraso), 2) as atraso_medio_dias,
    ROUND(STDDEV(p.dias_atraso), 2) as desvio_padrao_atraso,
    -- Score baseado no atraso médio (0-100)
    CASE 
        WHEN AVG(p.dias_atraso) <= 5 THEN 100
        WHEN AVG(p.dias_atraso) <= 10 THEN 90
        WHEN AVG(p.dias_atraso) <= 20 THEN 75
        WHEN AVG(p.dias_atraso) <= 40 THEN 50
        WHEN AVG(p.dias_atraso) <= 60 THEN 25
        ELSE 5
    END as score_atraso_medio,
    COUNT(*) as total_pagamentos,
    -- Consistência (menor desvio = mais consistente)
    CASE 
        WHEN STDDEV(p.dias_atraso) <= 5 THEN 'MUITO_CONSISTENTE'
        WHEN STDDEV(p.dias_atraso) <= 10 THEN 'CONSISTENTE'
        WHEN STDDEV(p.dias_atraso) <= 20 THEN 'MODERADO'
        ELSE 'INCONSISTENTE'
    END as consistencia_pagamento
FROM f_pagamentos p
JOIN f_duplicatas d ON p.codigo_cliente = d.codigo_cliente
GROUP BY p.codigo_cliente, d.nome_cliente;

-- ========================================
-- 4. VARIAÇÃO DE ATRASO ENTRE COLEÇÕES
-- ========================================

CREATE OR REPLACE VIEW v_variacao_atraso_colecoes AS
WITH atraso_por_colecao AS (
    SELECT 
        p.codigo_cliente,
        d.nome_cliente,
        d.codigo_colecao,
        ROUND(AVG(p.dias_atraso), 2) as atraso_medio_colecao,
        COUNT(*) as pagamentos_colecao
    FROM f_pagamentos p
    JOIN f_duplicatas d ON p.id_duplicata = d.id_duplicata
    GROUP BY p.codigo_cliente, d.nome_cliente, d.codigo_colecao
),
atraso_com_sequencia AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY codigo_cliente ORDER BY codigo_colecao) as seq_colecao,
        LAG(atraso_medio_colecao) OVER (PARTITION BY codigo_cliente ORDER BY codigo_colecao) as atraso_colecao_anterior
    FROM atraso_por_colecao
)
SELECT 
    codigo_cliente,
    nome_cliente,
    codigo_colecao,
    atraso_medio_colecao,
    atraso_colecao_anterior,
    CASE 
        WHEN atraso_colecao_anterior IS NULL THEN 0
        ELSE ROUND(atraso_medio_colecao - atraso_colecao_anterior, 2)
    END as variacao_atraso_dias,
    -- Tendência de melhora ou piora
    CASE 
        WHEN atraso_colecao_anterior IS NULL THEN 'PRIMEIRO_PEDIDO'
        WHEN atraso_medio_colecao < atraso_colecao_anterior THEN 'MELHORANDO'
        WHEN atraso_medio_colecao > atraso_colecao_anterior THEN 'PIORANDO'
        ELSE 'ESTÁVEL'
    END as tendencia_atraso,
    -- Score baseado na tendência
    CASE 
        WHEN atraso_colecao_anterior IS NULL THEN 70  -- Neutro para primeiro pedido
        WHEN atraso_medio_colecao <= atraso_colecao_anterior * 0.8 THEN 100  -- Melhorou 20%+
        WHEN atraso_medio_colecao <= atraso_colecao_anterior THEN 80         -- Melhorou
        WHEN atraso_medio_colecao <= atraso_colecao_anterior * 1.2 THEN 60   -- Piorou até 20%
        WHEN atraso_medio_colecao <= atraso_colecao_anterior * 1.5 THEN 30   -- Piorou 20-50%
        ELSE 10  -- Piorou muito (50%+)
    END as score_tendencia
FROM atraso_com_sequencia;

-- ========================================
-- FUNÇÃO PARA CÁLCULO DE SCORE FINAL
-- ========================================

CREATE OR REPLACE FUNCTION calcular_score_cliente(
    p_codigo_cliente VARCHAR2,
    p_peso_variacao_pedido NUMBER DEFAULT 0.20,
    p_peso_maior_atraso NUMBER DEFAULT 0.30,
    p_peso_atraso_medio NUMBER DEFAULT 0.35,
    p_peso_variacao_atraso NUMBER DEFAULT 0.15
) RETURN NUMBER IS
    v_score_final NUMBER;
    v_score_variacao NUMBER := 0;
    v_score_maior_atraso NUMBER := 0;
    v_score_atraso_medio NUMBER := 0;
    v_score_variacao_atraso NUMBER := 0;
    v_cliente_exists NUMBER := 0;
BEGIN
    -- Verificar se cliente existe
    SELECT COUNT(*) INTO v_cliente_exists 
    FROM f_duplicatas 
    WHERE codigo_cliente = p_codigo_cliente;
    
    IF v_cliente_exists = 0 THEN
        RETURN NULL; -- Cliente não encontrado
    END IF;
    
    -- 1. Score da variação de pedido (valor atual vs último)
    SELECT NVL(
        CASE 
            WHEN percentual_variacao_pedido >= 20 THEN 100
            WHEN percentual_variacao_pedido >= 10 THEN 90
            WHEN percentual_variacao_pedido >= 0 THEN 80
            WHEN percentual_variacao_pedido >= -10 THEN 70
            WHEN percentual_variacao_pedido >= -20 THEN 50
            ELSE 30
        END, 70) INTO v_score_variacao
    FROM (
        SELECT percentual_variacao_pedido 
        FROM v_variacao_pedido 
        WHERE codigo_cliente = p_codigo_cliente 
        ORDER BY codigo_colecao DESC 
        FETCH FIRST 1 ROW ONLY
    );
    
    -- 2. Score do maior atraso
    SELECT NVL(score_maior_atraso, 50) INTO v_score_maior_atraso
    FROM v_maior_atraso_historico
    WHERE codigo_cliente = p_codigo_cliente;
    
    -- 3. Score do atraso médio
    SELECT NVL(score_atraso_medio, 50) INTO v_score_atraso_medio
    FROM v_atraso_medio
    WHERE codigo_cliente = p_codigo_cliente;
    
    -- 4. Score da variação de atraso (tendência mais recente)
    SELECT NVL(score_tendencia, 70) INTO v_score_variacao_atraso
    FROM (
        SELECT score_tendencia 
        FROM v_variacao_atraso_colecoes 
        WHERE codigo_cliente = p_codigo_cliente 
        ORDER BY codigo_colecao DESC 
        FETCH FIRST 1 ROW ONLY
    );
    
    -- Cálculo do score final ponderado
    v_score_final := ROUND(
        (v_score_variacao * p_peso_variacao_pedido) +
        (v_score_maior_atraso * p_peso_maior_atraso) +
        (v_score_atraso_medio * p_peso_atraso_medio) +
        (v_score_variacao_atraso * p_peso_variacao_atraso),
        2
    );
    
    RETURN v_score_final;
END;
/

-- ========================================
-- VIEW CONSOLIDADA DE SCORING
-- ========================================

CREATE OR REPLACE VIEW v_scoring_consolidado AS
SELECT 
    d.codigo_cliente,
    d.nome_cliente,
    
    -- Métricas individuais
    vp.percentual_variacao_pedido,
    mah.maior_atraso_dias,
    mah.classificacao_atraso,
    am.atraso_medio_dias,
    am.consistencia_pagamento,
    vac.tendencia_atraso,
    
    -- Scores individuais
    CASE 
        WHEN vp.percentual_variacao_pedido >= 20 THEN 100
        WHEN vp.percentual_variacao_pedido >= 10 THEN 90
        WHEN vp.percentual_variacao_pedido >= 0 THEN 80
        WHEN vp.percentual_variacao_pedido >= -10 THEN 70
        WHEN vp.percentual_variacao_pedido >= -20 THEN 50
        ELSE 30
    END as score_variacao_pedido,
    
    NVL(mah.score_maior_atraso, 50) as score_maior_atraso,
    NVL(am.score_atraso_medio, 50) as score_atraso_medio,
    NVL(vac.score_tendencia, 70) as score_variacao_atraso,
    
    -- Score final (com pesos padrão)
    calcular_score_cliente(d.codigo_cliente) as score_final,
    
    -- Classificação de risco
    CASE 
        WHEN calcular_score_cliente(d.codigo_cliente) >= 85 THEN 'BAIXO_RISCO'
        WHEN calcular_score_cliente(d.codigo_cliente) >= 70 THEN 'RISCO_MODERADO'
        WHEN calcular_score_cliente(d.codigo_cliente) >= 50 THEN 'RISCO_ALTO'
        ELSE 'RISCO_CRÍTICO'
    END as classificacao_risco,
    
    -- Estatísticas adicionais
    COUNT(DISTINCT d.codigo_colecao) as total_colecoes,
    SUM(d.valor_original) as valor_total_relacionamento,
    COUNT(*) as total_duplicatas,
    NVL(
        (SELECT COUNT(*) FROM f_pagamentos WHERE codigo_cliente = d.codigo_cliente), 
        0
    ) as total_pagamentos

FROM f_duplicatas d
LEFT JOIN (
    SELECT codigo_cliente, percentual_variacao_pedido,
           ROW_NUMBER() OVER (PARTITION BY codigo_cliente ORDER BY codigo_colecao DESC) as rn
    FROM v_variacao_pedido
) vp ON d.codigo_cliente = vp.codigo_cliente AND vp.rn = 1
LEFT JOIN v_maior_atraso_historico mah ON d.codigo_cliente = mah.codigo_cliente
LEFT JOIN v_atraso_medio am ON d.codigo_cliente = am.codigo_cliente
LEFT JOIN (
    SELECT codigo_cliente, tendencia_atraso, score_tendencia,
           ROW_NUMBER() OVER (PARTITION BY codigo_cliente ORDER BY codigo_colecao DESC) as rn
    FROM v_variacao_atraso_colecoes
) vac ON d.codigo_cliente = vac.codigo_cliente AND vac.rn = 1

GROUP BY 
    d.codigo_cliente, d.nome_cliente, vp.percentual_variacao_pedido,
    mah.maior_atraso_dias, mah.classificacao_atraso, mah.score_maior_atraso,
    am.atraso_medio_dias, am.consistencia_pagamento, am.score_atraso_medio,
    vac.tendencia_atraso, vac.score_tendencia;

COMMENT ON VIEW v_scoring_consolidado IS 'View consolidada com todas as métricas e scoring final para análise de crédito';

-- ========================================
-- PROCEDURE PARA RELATÓRIO DE SCORING
-- ========================================

CREATE OR REPLACE PROCEDURE gerar_relatorio_scoring(
    p_codigo_cliente VARCHAR2 DEFAULT NULL,
    p_classificacao_risco VARCHAR2 DEFAULT NULL
) IS
    CURSOR c_scoring IS
        SELECT * FROM v_scoring_consolidado
        WHERE (p_codigo_cliente IS NULL OR codigo_cliente = p_codigo_cliente)
        AND (p_classificacao_risco IS NULL OR classificacao_risco = p_classificacao_risco)
        ORDER BY score_final DESC, codigo_cliente;
BEGIN
    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('RELATÓRIO DE SCORING DE CRÉDITO - ' || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI'));
    DBMS_OUTPUT.PUT_LINE('========================================');
    
    FOR rec IN c_scoring LOOP
        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('CLIENTE: ' || rec.codigo_cliente || ' - ' || rec.nome_cliente);
        DBMS_OUTPUT.PUT_LINE('SCORE FINAL: ' || rec.score_final || ' (' || rec.classificacao_risco || ')');
        DBMS_OUTPUT.PUT_LINE('- Variação Pedido: ' || NVL(TO_CHAR(rec.percentual_variacao_pedido), 'N/A') || '% (Score: ' || rec.score_variacao_pedido || ')');
        DBMS_OUTPUT.PUT_LINE('- Maior Atraso: ' || NVL(TO_CHAR(rec.maior_atraso_dias), 'N/A') || ' dias (Score: ' || rec.score_maior_atraso || ')');
        DBMS_OUTPUT.PUT_LINE('- Atraso Médio: ' || NVL(TO_CHAR(rec.atraso_medio_dias), 'N/A') || ' dias (Score: ' || rec.score_atraso_medio || ')');
        DBMS_OUTPUT.PUT_LINE('- Tendência: ' || NVL(rec.tendencia_atraso, 'N/A') || ' (Score: ' || rec.score_variacao_atraso || ')');
        DBMS_OUTPUT.PUT_LINE('- Relacionamento: R$ ' || TO_CHAR(rec.valor_total_relacionamento, '999G999G999D99') || ' em ' || rec.total_colecoes || ' coleções');
        DBMS_OUTPUT.PUT_LINE('----------------------------------------');
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Relatório gerado com sucesso!');
END;
/

COMMIT;