-- ========================================
-- SISTEMA DE SCORING PONDERADO CONFIGURÁVEL
-- Permite ajustar pesos das métricas via interface
-- ========================================

-- ========================================
-- TABELA DE CONFIGURAÇÃO DE PESOS
-- ========================================

CREATE TABLE config_scoring (
    id_config NUMBER PRIMARY KEY,
    nome_configuracao VARCHAR2(50) NOT NULL,
    descricao VARCHAR2(200),
    peso_variacao_pedido NUMBER(4,3) DEFAULT 0.200 CHECK (peso_variacao_pedido BETWEEN 0 AND 1),
    peso_maior_atraso NUMBER(4,3) DEFAULT 0.300 CHECK (peso_maior_atraso BETWEEN 0 AND 1),
    peso_atraso_medio NUMBER(4,3) DEFAULT 0.350 CHECK (peso_atraso_medio BETWEEN 0 AND 1),
    peso_variacao_atraso NUMBER(4,3) DEFAULT 0.150 CHECK (peso_variacao_atraso BETWEEN 0 AND 1),
    ativo VARCHAR2(1) DEFAULT 'S' CHECK (ativo IN ('S', 'N')),
    usuario_criacao VARCHAR2(50) DEFAULT USER,
    data_criacao DATE DEFAULT SYSDATE,
    data_atualizacao DATE DEFAULT SYSDATE,
    CONSTRAINT chk_soma_pesos CHECK (
        peso_variacao_pedido + peso_maior_atraso + peso_atraso_medio + peso_variacao_atraso = 1
    )
);

CREATE SEQUENCE seq_config_scoring START WITH 1 INCREMENT BY 1;

-- ========================================
-- CONFIGURAÇÕES PADRÃO
-- ========================================

-- Configuração Conservadora (foco em atrasos)
INSERT INTO config_scoring VALUES (
    seq_config_scoring.NEXTVAL,
    'CONSERVADOR',
    'Perfil conservador - prioriza histórico de atrasos',
    0.15,  -- Variação pedido
    0.35,  -- Maior atraso  
    0.40,  -- Atraso médio
    0.10,  -- Variação atraso
    'S',
    'SISTEMA',
    SYSDATE,
    SYSDATE
);

-- Configuração Equilibrada (padrão)
INSERT INTO config_scoring VALUES (
    seq_config_scoring.NEXTVAL,
    'EQUILIBRADO',
    'Perfil equilibrado - pesos balanceados entre todas métricas',
    0.20,  -- Variação pedido
    0.30,  -- Maior atraso
    0.35,  -- Atraso médio
    0.15,  -- Variação atraso
    'S',
    'SISTEMA',
    SYSDATE,
    SYSDATE
);

-- Configuração Agressiva (foco em crescimento)
INSERT INTO config_scoring VALUES (
    seq_config_scoring.NEXTVAL,
    'AGRESSIVO',
    'Perfil agressivo - valoriza crescimento e tendência de melhora',
    0.35,  -- Variação pedido
    0.20,  -- Maior atraso
    0.25,  -- Atraso médio
    0.20,  -- Variação atraso
    'S',
    'SISTEMA',
    SYSDATE,
    SYSDATE
);

-- Configuração para Clientes Novos
INSERT INTO config_scoring VALUES (
    seq_config_scoring.NEXTVAL,
    'CLIENTE_NOVO',
    'Perfil para clientes com pouco histórico - menor peso em atrasos históricos',
    0.40,  -- Variação pedido
    0.15,  -- Maior atraso
    0.20,  -- Atraso médio
    0.25,  -- Variação atraso
    'S',
    'SISTEMA',
    SYSDATE,
    SYSDATE
);

-- Configuração para Clientes Premium
INSERT INTO config_scoring VALUES (
    seq_config_scoring.NEXTVAL,
    'PREMIUM',
    'Perfil para grandes clientes - considera volume e relacionamento',
    0.25,  -- Variação pedido
    0.25,  -- Maior atraso
    0.30,  -- Atraso médio
    0.20,  -- Variação atraso
    'S',
    'SISTEMA',
    SYSDATE,
    SYSDATE
);

-- ========================================
-- FUNÇÃO AVANÇADA DE SCORING CONFIGURÁVEL
-- ========================================

CREATE OR REPLACE FUNCTION calcular_score_configuravel(
    p_codigo_cliente VARCHAR2,
    p_id_config NUMBER DEFAULT 2  -- Configuração equilibrada por padrão
) RETURN NUMBER IS
    
    v_score_final NUMBER;
    v_config_rec config_scoring%ROWTYPE;
    v_score_variacao NUMBER := 0;
    v_score_maior_atraso NUMBER := 0;
    v_score_atraso_medio NUMBER := 0;
    v_score_variacao_atraso NUMBER := 0;
    v_cliente_exists NUMBER := 0;
    v_bonus_volume NUMBER := 0;
    v_valor_total NUMBER := 0;
    
BEGIN
    -- Verificar se cliente existe
    SELECT COUNT(*) INTO v_cliente_exists 
    FROM f_duplicatas 
    WHERE codigo_cliente = p_codigo_cliente;
    
    IF v_cliente_exists = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Buscar configuração
    SELECT * INTO v_config_rec
    FROM config_scoring
    WHERE id_config = p_id_config AND ativo = 'S';
    
    -- 1. Score da variação de pedido
    BEGIN
        SELECT 
            CASE 
                WHEN percentual_variacao_pedido >= 50 THEN 100
                WHEN percentual_variacao_pedido >= 30 THEN 95
                WHEN percentual_variacao_pedido >= 20 THEN 90
                WHEN percentual_variacao_pedido >= 10 THEN 85
                WHEN percentual_variacao_pedido >= 0 THEN 80
                WHEN percentual_variacao_pedido >= -5 THEN 75
                WHEN percentual_variacao_pedido >= -10 THEN 70
                WHEN percentual_variacao_pedido >= -20 THEN 50
                WHEN percentual_variacao_pedido >= -30 THEN 30
                ELSE 10
            END INTO v_score_variacao
        FROM (
            SELECT percentual_variacao_pedido 
            FROM v_variacao_pedido 
            WHERE codigo_cliente = p_codigo_cliente 
            ORDER BY codigo_colecao DESC 
            FETCH FIRST 1 ROW ONLY
        );
    EXCEPTION
        WHEN NO_DATA_FOUND THEN v_score_variacao := 70; -- Score neutro
    END;
    
    -- 2. Score do maior atraso
    BEGIN
        SELECT score_maior_atraso INTO v_score_maior_atraso
        FROM v_maior_atraso_historico
        WHERE codigo_cliente = p_codigo_cliente;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN v_score_maior_atraso := 50;
    END;
    
    -- 3. Score do atraso médio
    BEGIN
        SELECT score_atraso_medio INTO v_score_atraso_medio
        FROM v_atraso_medio
        WHERE codigo_cliente = p_codigo_cliente;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN v_score_atraso_medio := 50;
    END;
    
    -- 4. Score da variação de atraso
    BEGIN
        SELECT score_tendencia INTO v_score_variacao_atraso
        FROM (
            SELECT score_tendencia 
            FROM v_variacao_atraso_colecoes 
            WHERE codigo_cliente = p_codigo_cliente 
            ORDER BY codigo_colecao DESC 
            FETCH FIRST 1 ROW ONLY
        );
    EXCEPTION
        WHEN NO_DATA_FOUND THEN v_score_variacao_atraso := 70;
    END;
    
    -- Bônus por volume de relacionamento
    SELECT SUM(valor_original) INTO v_valor_total
    FROM f_duplicatas 
    WHERE codigo_cliente = p_codigo_cliente;
    
    v_bonus_volume := CASE 
        WHEN v_valor_total >= 500000 THEN 10  -- Grandes clientes
        WHEN v_valor_total >= 200000 THEN 5   -- Clientes médios
        WHEN v_valor_total >= 100000 THEN 2   -- Clientes regulares
        ELSE 0
    END;
    
    -- Cálculo final com a configuração escolhida
    v_score_final := 
        (v_score_variacao * v_config_rec.peso_variacao_pedido) +
        (v_score_maior_atraso * v_config_rec.peso_maior_atraso) +
        (v_score_atraso_medio * v_config_rec.peso_atraso_medio) +
        (v_score_variacao_atraso * v_config_rec.peso_variacao_atraso);
    
    -- Aplicar bônus (limitado a 100)
    v_score_final := LEAST(100, v_score_final + v_bonus_volume);
    
    RETURN ROUND(v_score_final, 2);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
/

-- ========================================
-- VIEW COMPARATIVA DE CONFIGURAÇÕES
-- ========================================

CREATE OR REPLACE VIEW v_comparativo_configuracoes AS
SELECT 
    c.codigo_cliente,
    c.nome_cliente,
    
    -- Scores com diferentes configurações
    calcular_score_configuravel(c.codigo_cliente, 1) as score_conservador,
    calcular_score_configuravel(c.codigo_cliente, 2) as score_equilibrado,
    calcular_score_configuravel(c.codigo_cliente, 3) as score_agressivo,
    calcular_score_configuravel(c.codigo_cliente, 4) as score_cliente_novo,
    calcular_score_configuravel(c.codigo_cliente, 5) as score_premium,
    
    -- Diferenças entre configurações
    calcular_score_configuravel(c.codigo_cliente, 3) - 
    calcular_score_configuravel(c.codigo_cliente, 1) as diferenca_agr_con,
    
    -- Recomendação de configuração
    CASE 
        WHEN c.valor_total_relacionamento >= 200000 THEN 'PREMIUM'
        WHEN c.total_colecoes <= 2 THEN 'CLIENTE_NOVO'
        WHEN c.score_final >= 80 THEN 'AGRESSIVO'
        WHEN c.score_final <= 50 THEN 'CONSERVADOR'
        ELSE 'EQUILIBRADO'
    END as config_recomendada

FROM v_scoring_consolidado c;

-- ========================================
-- TABELA DE HISTÓRICO DE SCORING
-- ========================================

CREATE TABLE historico_scoring (
    id_historico NUMBER PRIMARY KEY,
    codigo_cliente VARCHAR2(20) NOT NULL,
    id_config NUMBER NOT NULL,
    score_calculado NUMBER(5,2),
    data_calculo DATE DEFAULT SYSDATE,
    score_variacao_pedido NUMBER(5,2),
    score_maior_atraso NUMBER(5,2),
    score_atraso_medio NUMBER(5,2),
    score_variacao_atraso NUMBER(5,2),
    observacoes VARCHAR2(500),
    usuario VARCHAR2(50) DEFAULT USER
);

CREATE SEQUENCE seq_historico_scoring START WITH 1 INCREMENT BY 1;

-- ========================================
-- PROCEDURE PARA CALCULAR E SALVAR SCORING
-- ========================================

CREATE OR REPLACE PROCEDURE executar_scoring_completo(
    p_id_config NUMBER DEFAULT 2,
    p_salvar_historico VARCHAR2 DEFAULT 'S'
) IS
    v_count NUMBER := 0;
    v_score NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('EXECUÇÃO COMPLETA DE SCORING - ' || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI'));
    DBMS_OUTPUT.PUT_LINE('Configuração: ' || p_id_config);
    DBMS_OUTPUT.PUT_LINE('========================================');
    
    FOR cliente IN (SELECT DISTINCT codigo_cliente FROM f_duplicatas ORDER BY codigo_cliente) LOOP
        v_score := calcular_score_configuravel(cliente.codigo_cliente, p_id_config);
        
        IF p_salvar_historico = 'S' AND v_score IS NOT NULL THEN
            INSERT INTO historico_scoring (
                id_historico, codigo_cliente, id_config, score_calculado, 
                observacoes
            ) VALUES (
                seq_historico_scoring.NEXTVAL, 
                cliente.codigo_cliente, 
                p_id_config, 
                v_score,
                'Cálculo automático completo'
            );
            v_count := v_count + 1;
        END IF;
        
        DBMS_OUTPUT.PUT_LINE('Cliente ' || cliente.codigo_cliente || ': Score = ' || NVL(TO_CHAR(v_score), 'N/A'));
    END LOOP;
    
    IF p_salvar_historico = 'S' THEN
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('Salvos ' || v_count || ' registros no histórico.');
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('Processamento concluído!');
END;
/

-- ========================================
-- PACKAGE PARA API DE SCORING
-- ========================================

CREATE OR REPLACE PACKAGE pkg_scoring_api AS
    
    -- Função para obter score com configuração específica
    FUNCTION get_score_cliente(
        p_codigo_cliente VARCHAR2,
        p_nome_config VARCHAR2 DEFAULT 'EQUILIBRADO'
    ) RETURN NUMBER;
    
    -- Procedure para criar nova configuração
    PROCEDURE criar_configuracao(
        p_nome VARCHAR2,
        p_descricao VARCHAR2,
        p_peso_var_pedido NUMBER,
        p_peso_maior_atraso NUMBER,
        p_peso_atraso_medio NUMBER,
        p_peso_var_atraso NUMBER
    );
    
    -- Função para listar configurações
    FUNCTION get_configuracoes RETURN SYS_REFCURSOR;
    
    -- Função para análise de sensibilidade
    FUNCTION analise_sensibilidade(p_codigo_cliente VARCHAR2) RETURN SYS_REFCURSOR;
    
END pkg_scoring_api;
/

CREATE OR REPLACE PACKAGE BODY pkg_scoring_api AS
    
    FUNCTION get_score_cliente(
        p_codigo_cliente VARCHAR2,
        p_nome_config VARCHAR2 DEFAULT 'EQUILIBRADO'
    ) RETURN NUMBER IS
        v_id_config NUMBER;
        v_score NUMBER;
    BEGIN
        SELECT id_config INTO v_id_config
        FROM config_scoring
        WHERE UPPER(nome_configuracao) = UPPER(p_nome_config)
        AND ativo = 'S';
        
        v_score := calcular_score_configuravel(p_codigo_cliente, v_id_config);
        
        RETURN v_score;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN calcular_score_configuravel(p_codigo_cliente, 2); -- Padrão equilibrado
    END;
    
    PROCEDURE criar_configuracao(
        p_nome VARCHAR2,
        p_descricao VARCHAR2,
        p_peso_var_pedido NUMBER,
        p_peso_maior_atraso NUMBER,
        p_peso_atraso_medio NUMBER,
        p_peso_var_atraso NUMBER
    ) IS
    BEGIN
        INSERT INTO config_scoring (
            id_config, nome_configuracao, descricao,
            peso_variacao_pedido, peso_maior_atraso,
            peso_atraso_medio, peso_variacao_atraso,
            ativo, usuario_criacao
        ) VALUES (
            seq_config_scoring.NEXTVAL, p_nome, p_descricao,
            p_peso_var_pedido, p_peso_maior_atraso,
            p_peso_atraso_medio, p_peso_var_atraso,
            'S', USER
        );
        COMMIT;
    END;
    
    FUNCTION get_configuracoes RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT * FROM config_scoring WHERE ativo = 'S' ORDER BY nome_configuracao;
        RETURN v_cursor;
    END;
    
    FUNCTION analise_sensibilidade(p_codigo_cliente VARCHAR2) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT 
                c.nome_configuracao,
                c.descricao,
                calcular_score_configuravel(p_codigo_cliente, c.id_config) as score,
                c.peso_variacao_pedido,
                c.peso_maior_atraso,
                c.peso_atraso_medio,
                c.peso_variacao_atraso
            FROM config_scoring c
            WHERE c.ativo = 'S'
            ORDER BY calcular_score_configuravel(p_codigo_cliente, c.id_config) DESC;
        
        RETURN v_cursor;
    END;
    
END pkg_scoring_api;
/

-- ========================================
-- DADOS INICIAIS DE TESTE
-- ========================================

-- Executar scoring com configuração equilibrada para todos os clientes
EXEC executar_scoring_completo(2, 'S');

-- Comentários de documentação
COMMENT ON TABLE config_scoring IS 'Configurações de ponderação para cálculo de scoring de crédito';
COMMENT ON TABLE historico_scoring IS 'Histórico de scores calculados para auditoria e análise temporal';
COMMENT ON FUNCTION calcular_score_configuravel IS 'Função principal de cálculo de score com configuração personalizável';

COMMIT;