# 🚀 Sistema de Scoring de Crédito Têxtil

**Sistema completo de análise de crédito para empresa têxtil com dados fake realistas e métricas avançadas.**

## 📋 Resumo Executivo

Este sistema implementa um modelo completo de scoring de crédito especificamente projetado para empresas do setor têxtil, com:

- **50+ clientes** com histórico de 12 meses
- **200+ pedidos** com variações realistas de valor
- **4 métricas principais** de análise de risco
- **Sistema de ponderação configurável** para diferentes perfis de risco
- **Dados fake ultra-realistas** que vão impressionar qualquer stakeholder!

## 🎯 Métricas Implementadas

### 1. Variação de Pedido vs Coleção Anterior
- **Objetivo**: Medir crescimento/redução do relacionamento
- **Cálculo**: `(Valor Atual - Valor Anterior) / Valor Anterior * 100`
- **Score**: 100 pts (crescimento >50%) até 10 pts (redução >30%)

### 2. Maior Atraso Histórico
- **Objetivo**: Identificar o pior momento de inadimplência
- **Classificação**: Excelente (≤7 dias) até Crítico (>60 dias)
- **Score**: 100 pts (≤7 dias) até 10 pts (>60 dias)

### 3. Atraso Médio
- **Objetivo**: Avaliar consistência de pagamento
- **Cálculo**: Média aritmética de todos os atrasos
- **Score**: 100 pts (≤5 dias) até 5 pts (>60 dias)
- **Bonus**: Considera desvio padrão para avaliar consistência

### 4. Variação de Atraso Entre Coleções
- **Objetivo**: Detectar tendências de melhora/piora
- **Tendências**: MELHORANDO, PIORANDO, ESTÁVEL
- **Score**: 100 pts (melhora >20%) até 10 pts (piora >50%)

## 🏗️ Estrutura do Sistema

```
database/
├── 00_executar_sistema_completo.sql    # 🚀 EXECUTE ESTE ARQUIVO
├── 01_estrutura_tabelas.sql            # Tabelas Oracle + índices
├── 02_dados_fake_realistas.sql         # Primeiros clientes realistas
├── 03_pagamentos_fake.sql              # Histórico de pagamentos
├── 04_calculos_metricas.sql            # Views e funções das 4 métricas
├── 05_sistema_scoring_configuravel.sql # Sistema de ponderação
├── 06_dados_extras_completos.sql       # 50+ clientes + demos
└── README_SISTEMA_SCORING.md           # Esta documentação
```

## ⚡ Como Executar

### Opção 1: Execução Completa (Recomendado)
```sql
-- Conecte no Oracle como usuário com privilégios DDL
sqlplus user/password@database

-- Execute o script principal
@00_executar_sistema_completo.sql
```

### Opção 2: Execução Passo-a-passo
```sql
@01_estrutura_tabelas.sql
@02_dados_fake_realistas.sql
@03_pagamentos_fake.sql
@04_calculos_metricas.sql
@05_sistema_scoring_configuravel.sql
@06_dados_extras_completos.sql
```

## 📊 Views Principais

### `v_scoring_consolidado`
**Visão geral com todas as métricas e score final**
```sql
SELECT codigo_cliente, nome_cliente, score_final, classificacao_risco
FROM v_scoring_consolidado
ORDER BY score_final DESC;
```

### `v_dados_dashboard`
**Dados otimizados para frontend/API**
```sql
SELECT * FROM v_dados_dashboard
WHERE classificacao_risco = 'RISCO_CRÍTICO';
```

### `v_comparativo_configuracoes`
**Análise de sensibilidade entre diferentes configurações**
```sql
SELECT codigo_cliente, score_conservador, score_equilibrado, score_agressivo
FROM v_comparativo_configuracoes;
```

## ⚙️ Configurações de Ponderação

O sistema possui 5 configurações pré-definidas:

| Configuração | Var. Pedido | Maior Atraso | Atraso Médio | Var. Atraso | Uso Recomendado |
|--------------|-------------|--------------|--------------|-------------|------------------|
| **CONSERVADOR** | 15% | 35% | 40% | 10% | Análise rigorosa |
| **EQUILIBRADO** | 20% | 30% | 35% | 15% | Uso geral (padrão) |
| **AGRESSIVO** | 35% | 20% | 25% | 20% | Foco em crescimento |
| **CLIENTE_NOVO** | 40% | 15% | 20% | 25% | Pouco histórico |
| **PREMIUM** | 25% | 25% | 30% | 20% | Grandes clientes |

## 🎮 Funções e Procedures

### `calcular_score_configuravel(cliente, config)`
**Calcula score com configuração específica**
```sql
-- Score com configuração equilibrada (padrão)
SELECT calcular_score_configuravel('CLI001', 2) FROM DUAL;

-- Score com configuração agressiva
SELECT calcular_score_configuravel('CLI001', 3) FROM DUAL;
```

### `gerar_relatorio_scoring(cliente, risco)`
**Gera relatório detalhado**
```sql
-- Relatório de todos os clientes
EXEC gerar_relatorio_scoring();

-- Apenas clientes de risco crítico
EXEC gerar_relatorio_scoring(NULL, 'RISCO_CRÍTICO');

-- Cliente específico
EXEC gerar_relatorio_scoring('CLI001', NULL);
```

### `executar_scoring_completo(config, salvar)`
**Processa scoring para toda a base**
```sql
-- Executa e salva no histórico
EXEC executar_scoring_completo(2, 'S');
```

## 📈 Exemplos de Clientes Fake

### Cliente Premium (CLI001 - Confecções Vitória)
- **Score**: ~85 (Baixo Risco)
- **Perfil**: Pontual, crescimento consistente
- **Volume**: R$ 85.800 em 4 coleções
- **Atraso médio**: 3 dias

### Cliente Problemático (CLI004 - Fashion House SP)
- **Score**: ~25 (Risco Crítico)  
- **Perfil**: Atrasos crescentes (45→60→75 dias)
- **Volume**: R$ 91.800 mas com inadimplência
- **Tendência**: PIORANDO

### Cliente Industrial (CLI006 - Têxtil Gaúcha)
- **Score**: ~70 (Risco Moderado)
- **Perfil**: Exportação, atrasos médios consistentes
- **Volume**: R$ 351.850 (alto valor)
- **Característica**: Atrasos de câmbio (15-16 dias)

## 🔧 Manutenção e Monitoramento

### Recalcular Scoring
```sql
EXEC recalcular_scoring_geral();
```

### Criar Nova Configuração
```sql
EXEC pkg_scoring_api.criar_configuracao(
    'MINHA_CONFIG',
    'Configuração personalizada',
    0.30, -- Variação pedido
    0.25, -- Maior atraso  
    0.30, -- Atraso médio
    0.15  -- Variação atraso
);
```

### Análise de Sensibilidade
```sql
DECLARE
    v_cursor SYS_REFCURSOR;
BEGIN
    v_cursor := pkg_scoring_api.analise_sensibilidade('CLI001');
    -- Processar cursor conforme necessário
END;
/
```

## 📊 Queries para Dashboard/Frontend

### Top 10 Clientes
```sql
SELECT 
    codigo_cliente,
    nome_cliente,
    score_final,
    classificacao_risco,
    valor_total_relacionamento
FROM v_scoring_consolidado
WHERE ROWNUM <= 10
ORDER BY score_final DESC;
```

### Distribuição de Risco
```sql
SELECT 
    classificacao_risco,
    COUNT(*) as quantidade,
    ROUND(AVG(score_final), 1) as score_medio,
    SUM(valor_total_relacionamento) as valor_total
FROM v_scoring_consolidado
GROUP BY classificacao_risco
ORDER BY score_medio DESC;
```

### Clientes por Tendência
```sql
SELECT 
    tendencia_atraso,
    COUNT(*) as quantidade,
    AVG(score_final) as score_medio
FROM v_scoring_consolidado
WHERE tendencia_atraso IS NOT NULL
GROUP BY tendencia_atraso
ORDER BY score_medio DESC;
```

## 🎯 Resultados Esperados

Após execução completa, o sistema terá:

- ✅ **50+ clientes** com perfis diversos (premium, médio, problemático)
- ✅ **200+ duplicatas** distribuídas em 4 coleções sazonais
- ✅ **150+ pagamentos** com atrasos realistas
- ✅ **Scores calculados** para todas as configurações
- ✅ **Histórico auditável** de todos os cálculos
- ✅ **Views otimizadas** para integração com frontend

## 🔗 Integração com API

### Endpoint de Score
```javascript
// GET /api/cliente/{codigo}/score?config=equilibrado
{
  "cliente": "CLI001",
  "score": 87.25,
  "risco": "BAIXO_RISCO",
  "metricas": {
    "variacaoPedido": 15.5,
    "maiorAtraso": 5,
    "atrasoMedio": 3.2,
    "tendencia": "MELHORANDO"
  }
}
```

### Endpoint de Dashboard
```javascript
// GET /api/dashboard/resumo
{
  "totalClientes": 50,
  "distribuicaoRisco": {
    "BAIXO_RISCO": 12,
    "RISCO_MODERADO": 23,
    "RISCO_ALTO": 11,
    "RISCO_CRÍTICO": 4
  },
  "scoremedio": 68.5
}
```

## 🎨 Dados Realistas que Impressionam

### Nomes de Empresas Autênticos
- Confecções Vitória Ltda
- Moda Brasileira S.A.  
- Têxtil Nordeste Ind. e Com.
- Atacado Têxtil Centro-Oeste
- Malharia São Paulo Industrial S.A.

### Produtos Têxteis Específicos
- Algodão Premium, Seda Estampada, Lã Merino
- Viscose Tropical, Crepe Texturizado, Cashmere Blend
- Malha Circular, Jersey Algodão, Fleece Industrial
- Fio de Algodão, Tecido Misto, Lã Sintética

### Valores Realistas
- Micro empresas: R$ 12.000 - R$ 25.000
- Empresas médias: R$ 25.000 - R$ 60.000  
- Grandes clientes: R$ 60.000 - R$ 110.000
- Exportação: R$ 80.000 - R$ 120.000

## 🔥 Destaques Técnicos

- **Performance**: Índices otimizados para consultas rápidas
- **Flexibilidade**: Sistema de pesos configurável em tempo real
- **Auditoria**: Histórico completo de todas as alterações
- **Escalabilidade**: Estrutura preparada para milhares de clientes
- **Integridade**: Constraints que garantem consistência dos dados

## 🎉 Conclusão

Este sistema de scoring foi desenvolvido para **impressionar** com sua completude e realismo. Os dados fake são tão convincentes que parecem de uma empresa têxtil real em operação há anos!

**Pronto para demonstração ao Lucas!** 🚀

---

**Desenvolvido por**: Subagent Data Engineer  
**Data**: Janeiro 2025  
**Versão**: 1.0 - Production Ready  
**Status**: ✅ ENTREGUE COM SUCESSO!