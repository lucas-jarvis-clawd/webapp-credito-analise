"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class ScoreService {
    getDefaultWeights() {
        return {
            pontuacao: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_PONTUACAO || '0.3'),
            historico: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_HISTORICO || '0.25'),
            valor: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_VALOR || '0.25'),
            prazo: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_PRAZO || '0.2')
        };
    }
    async calculateClientMetrics(clienteId) {
        const connection = await (0, connection_1.getConnection)();
        try {
            // Query complexa para calcular todas as métricas de uma vez
            const result = await connection.execute(`
        WITH cliente_stats AS (
          SELECT 
            d.cliente_id,
            COUNT(d.id) as total_duplicatas,
            SUM(CASE WHEN d.status = 'PAGA' THEN 1 ELSE 0 END) as duplicatas_pagas,
            SUM(CASE WHEN d.status = 'VENCIDA' THEN 1 ELSE 0 END) as duplicatas_vencidas,
            AVG(d.valor) as valor_medio_duplicatas,
            COUNT(p.id) as total_pagamentos,
            AVG(CASE 
              WHEN p.data_pagamento IS NOT NULL AND d.data_vencimento IS NOT NULL 
              THEN p.data_pagamento - d.data_vencimento 
              ELSE NULL 
            END) as prazo_medio_pagamento_dias
          FROM f_duplicatas d
          LEFT JOIN f_pagamentos p ON d.id = p.duplicata_id
          WHERE d.cliente_id = :clienteId
          GROUP BY d.cliente_id
        )
        SELECT 
          cs.*,
          CASE 
            WHEN cs.total_duplicatas = 0 THEN 0
            ELSE (cs.duplicatas_pagas * 100.0) / cs.total_duplicatas 
          END as percentual_pagamentos
        FROM cliente_stats cs
      `, { clienteId });
            const stats = result.rows && result.rows.length > 0 ? result.rows[0] : null;
            if (!stats) {
                // Cliente sem histórico
                return {
                    pontuacao_interna: 0,
                    historico_pagamentos: 0,
                    valor_medio_duplicatas: 0,
                    prazo_medio_pagamento: 0
                };
            }
            // Cálculo das métricas individuais (0 a 100)
            const metrics = {
                // Pontuação interna baseada em regras de negócio
                pontuacao_interna: this.calculatePontuacaoInterna(stats),
                // Histórico de pagamentos (percentual de duplicatas pagas)
                historico_pagamentos: Math.min(100, stats.PERCENTUAL_PAGAMENTOS || 0),
                // Valor médio das duplicatas (normalizado)
                valor_medio_duplicatas: this.normalizeValorMedio(stats.VALOR_MEDIO_DUPLICATAS || 0),
                // Prazo médio de pagamento (normalizado - quanto menor, melhor)
                prazo_medio_pagamento: this.normalizePrazoMedio(stats.PRAZO_MEDIO_PAGAMENTO_DIAS || 0)
            };
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Erro ao calcular métricas do cliente:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
    calculatePontuacaoInterna(stats) {
        // Regras de negócio para pontuação interna
        let pontuacao = 50; // Base neutra
        // Bônus por ter duplicatas pagas
        if (stats.DUPLICATAS_PAGAS > 0) {
            pontuacao += Math.min(25, stats.DUPLICATAS_PAGAS * 2);
        }
        // Penalidade por duplicatas vencidas
        if (stats.DUPLICATAS_VENCIDAS > 0) {
            pontuacao -= Math.min(30, stats.DUPLICATAS_VENCIDAS * 5);
        }
        // Bônus por volume de operações
        if (stats.TOTAL_DUPLICATAS >= 10) {
            pontuacao += 10;
        }
        else if (stats.TOTAL_DUPLICATAS >= 5) {
            pontuacao += 5;
        }
        return Math.max(0, Math.min(100, pontuacao));
    }
    normalizeValorMedio(valorMedio) {
        // Normaliza valor médio para escala 0-100
        // Assumindo que valores até R$ 10.000 são considerados máximos
        const valorMaximo = 10000;
        const score = Math.min(100, (valorMedio / valorMaximo) * 100);
        return Math.round(score);
    }
    normalizePrazoMedio(prazoMedioDias) {
        // Normaliza prazo médio - quanto menor, melhor score
        // Pagamento antecipado (dias negativos) = 100 pontos
        // Pagamento no prazo (0 dias) = 90 pontos
        // Cada dia de atraso reduz pontos
        if (prazoMedioDias <= 0) {
            return 100; // Pagamento antecipado ou no prazo
        }
        if (prazoMedioDias <= 7) {
            return 80; // Até 1 semana de atraso
        }
        if (prazoMedioDias <= 15) {
            return 60; // Até 2 semanas de atraso
        }
        if (prazoMedioDias <= 30) {
            return 40; // Até 1 mês de atraso
        }
        return Math.max(0, 40 - Math.floor(prazoMedioDias / 5)); // Reduz 1 ponto a cada 5 dias
    }
    async calculateScore(clienteId, weights) {
        try {
            const metricas = await this.calculateClientMetrics(clienteId);
            const ponderacoes = weights || this.getDefaultWeights();
            // Calcula o score final ponderado
            const scoreFinal = Math.round((metricas.pontuacao_interna * ponderacoes.pontuacao) +
                (metricas.historico_pagamentos * ponderacoes.historico) +
                (metricas.valor_medio_duplicatas * ponderacoes.valor) +
                (metricas.prazo_medio_pagamento * ponderacoes.prazo));
            // Determina a classificação
            const classificacao = this.getClassificacao(scoreFinal);
            const result = {
                cliente_id: clienteId,
                score_final: scoreFinal,
                metricas,
                ponderacoes,
                classificacao,
                data_calculo: new Date()
            };
            // Salva o resultado no banco (opcional - para histórico)
            await this.saveScoreResult(result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Erro ao calcular score:', error);
            throw error;
        }
    }
    getClassificacao(score) {
        if (score >= 80)
            return 'EXCELENTE';
        if (score >= 65)
            return 'BOM';
        if (score >= 50)
            return 'REGULAR';
        if (score >= 30)
            return 'RUIM';
        return 'PÉSSIMO';
    }
    async saveScoreResult(result) {
        const connection = await (0, connection_1.getConnection)();
        try {
            await connection.execute(`
        INSERT INTO score_historico (
          cliente_id, score_final, pontuacao_interna, historico_pagamentos,
          valor_medio_duplicatas, prazo_medio_pagamento, peso_pontuacao,
          peso_historico, peso_valor, peso_prazo, classificacao, data_calculo
        ) VALUES (
          :cliente_id, :score_final, :pontuacao_interna, :historico_pagamentos,
          :valor_medio_duplicatas, :prazo_medio_pagamento, :peso_pontuacao,
          :peso_historico, :peso_valor, :peso_prazo, :classificacao, CURRENT_TIMESTAMP
        )
      `, {
                cliente_id: result.cliente_id,
                score_final: result.score_final,
                pontuacao_interna: result.metricas.pontuacao_interna,
                historico_pagamentos: result.metricas.historico_pagamentos,
                valor_medio_duplicatas: result.metricas.valor_medio_duplicatas,
                prazo_medio_pagamento: result.metricas.prazo_medio_pagamento,
                peso_pontuacao: result.ponderacoes.pontuacao,
                peso_historico: result.ponderacoes.historico,
                peso_valor: result.ponderacoes.valor,
                peso_prazo: result.ponderacoes.prazo,
                classificacao: result.classificacao
            });
        }
        catch (error) {
            // Log do erro mas não falha o processo principal
            logger_1.logger.error('Erro ao salvar resultado do score (não crítico):', error);
        }
        finally {
            await connection.close();
        }
    }
    async getScoreHistory(clienteId, limit = 10) {
        const connection = await (0, connection_1.getConnection)();
        try {
            const result = await connection.execute(`
        SELECT * FROM score_historico 
        WHERE cliente_id = :clienteId 
        ORDER BY data_calculo DESC 
        ROWNUM <= :limit
      `, { clienteId, limit });
            return result.rows?.map((row) => ({
                cliente_id: row.CLIENTE_ID,
                score_final: row.SCORE_FINAL,
                metricas: {
                    pontuacao_interna: row.PONTUACAO_INTERNA,
                    historico_pagamentos: row.HISTORICO_PAGAMENTOS,
                    valor_medio_duplicatas: row.VALOR_MEDIO_DUPLICATAS,
                    prazo_medio_pagamento: row.PRAZO_MEDIO_PAGAMENTO
                },
                ponderacoes: {
                    pontuacao: row.PESO_PONTUACAO,
                    historico: row.PESO_HISTORICO,
                    valor: row.PESO_VALOR,
                    prazo: row.PESO_PRAZO
                },
                classificacao: row.CLASSIFICACAO,
                data_calculo: new Date(row.DATA_CALCULO)
            })) || [];
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar histórico de scores:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
}
exports.ScoreService = ScoreService;
