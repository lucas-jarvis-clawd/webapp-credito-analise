-- ========================================
-- ESTRUTURA TABELAS ORACLE - ANÁLISE DE CRÉDITO
-- Sistema para empresa têxtil
-- ========================================

-- Tabela de duplicatas (pedidos)
CREATE TABLE f_duplicatas (
    id_duplicata NUMBER PRIMARY KEY,
    codigo_cliente VARCHAR2(20) NOT NULL,
    nome_cliente VARCHAR2(100) NOT NULL,
    codigo_colecao VARCHAR2(20) NOT NULL,
    nome_colecao VARCHAR2(50) NOT NULL,
    data_vencimento DATE NOT NULL,
    valor_original NUMBER(12,2) NOT NULL,
    valor_pago NUMBER(12,2) DEFAULT 0,
    status_duplicata VARCHAR2(20) DEFAULT 'PENDENTE', -- PENDENTE, PAGO, VENCIDO
    tipo_produto VARCHAR2(30), -- Algodão, Seda, Linho, Poliéster, etc.
    quantidade_pecas NUMBER(8,2),
    desconto_aplicado NUMBER(5,2) DEFAULT 0,
    observacoes VARCHAR2(500),
    data_criacao DATE DEFAULT SYSDATE,
    data_atualizacao DATE DEFAULT SYSDATE
);

-- Tabela de pagamentos
CREATE TABLE f_pagamentos (
    id_pagamento NUMBER PRIMARY KEY,
    id_duplicata NUMBER NOT NULL,
    codigo_cliente VARCHAR2(20) NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_pagamento NUMBER(12,2) NOT NULL,
    dias_atraso NUMBER(5) DEFAULT 0,
    forma_pagamento VARCHAR2(30), -- PIX, Boleto, Transferência, Cartão
    data_processamento DATE DEFAULT SYSDATE,
    observacoes VARCHAR2(300),
    FOREIGN KEY (id_duplicata) REFERENCES f_duplicatas(id_duplicata)
);

-- Índices para performance
CREATE INDEX idx_duplicatas_cliente ON f_duplicatas(codigo_cliente);
CREATE INDEX idx_duplicatas_colecao ON f_duplicatas(codigo_colecao);
CREATE INDEX idx_duplicatas_vencimento ON f_duplicatas(data_vencimento);
CREATE INDEX idx_pagamentos_cliente ON f_pagamentos(codigo_cliente);
CREATE INDEX idx_pagamentos_data ON f_pagamentos(data_pagamento);
CREATE INDEX idx_pagamentos_duplicata ON f_pagamentos(id_duplicata);

-- Sequências para PKs
CREATE SEQUENCE seq_duplicatas START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_pagamentos START WITH 1 INCREMENT BY 1;

-- Comentários nas tabelas
COMMENT ON TABLE f_duplicatas IS 'Registro de pedidos/duplicatas da empresa têxtil';
COMMENT ON TABLE f_pagamentos IS 'Histórico de pagamentos dos clientes';

-- Views úteis
CREATE OR REPLACE VIEW v_clientes_resumo AS
SELECT 
    codigo_cliente,
    nome_cliente,
    COUNT(*) as total_pedidos,
    SUM(valor_original) as valor_total_pedidos,
    SUM(valor_pago) as valor_total_pago,
    AVG(CASE WHEN status_duplicata = 'PAGO' THEN 
        (SELECT dias_atraso FROM f_pagamentos p WHERE p.id_duplicata = d.id_duplicata)
        ELSE NULL END) as atraso_medio
FROM f_duplicatas d
GROUP BY codigo_cliente, nome_cliente;

COMMENT ON VIEW v_clientes_resumo IS 'Resumo consolidado por cliente para análise de crédito';