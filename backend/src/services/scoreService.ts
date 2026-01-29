import { getDb } from '../database/connection';
import { Cliente, ScoreMetrics, ScoreWeights, ScoreResult, ScoreHistorico, FDuplicata, FPagamento, ReferenciaComercial } from '../models/types';
import { logger } from '../utils/logger';
import { getConfiguredWeights } from '../utils/scoringConfig';

// Expected quarterly purchase distribution by textile segment [Q1, Q2, Q3, Q4]
// Each array sums to 1.0 and represents the expected proportion of annual purchases per quarter
const SEGMENT_SEASONAL_PATTERNS: Record<NonNullable<Cliente['segmento_textil']>, [number, number, number, number]> = {
  MODA_FEMININA:   [0.30, 0.20, 0.15, 0.35], // peaks Q1 (summer/carnaval) + Q4 (christmas)
  MODA_MASCULINA:  [0.20, 0.30, 0.15, 0.35], // peaks Q2 (dia dos pais) + Q4 (christmas)
  INFANTIL:        [0.25, 0.15, 0.20, 0.40], // peaks Q4 (christmas/dia das criancas) + Q1 (back to school)
  CAMA_MESA_BANHO: [0.20, 0.30, 0.15, 0.35], // peaks Q2 (winter) + Q4 (christmas/weddings)
  TECIDOS:         [0.23, 0.25, 0.22, 0.30], // relatively even, slight Q4 peak
  AVIAMENTOS:      [0.25, 0.25, 0.25, 0.25]  // even distribution, follows general textile cycle
};

export class ScoreService {

  // Uses shared utility from utils/scoringConfig.ts

  /**
   * Calculate all 7 metrics for a client
   */
  async calculateClientMetrics(clienteId: number): Promise<ScoreMetrics> {
    try {
      const db = getDb();
      const cliente = db.getById('clientes', clienteId);
      if (!cliente) {
        return this.emptyMetrics();
      }

      const duplicatas = db.query('f_duplicatas', (d: FDuplicata) => d.cliente_id === clienteId);
      if (duplicatas.length === 0) {
        return this.emptyMetrics();
      }

      // Get all payments for this client's duplicatas
      const dupIds = new Set(duplicatas.map(d => d.id));
      const pagamentos = db.query('f_pagamentos', (p: FPagamento) => dupIds.has(p.duplicata_id));

      // Get commercial references
      const referencias = db.query('referencias_comerciais', (r: ReferenciaComercial) => r.cliente_id === clienteId);

      const metrics: ScoreMetrics = {
        historico_pagamentos: this.calcHistoricoPagamentos(duplicatas, pagamentos),
        tempo_relacionamento: this.calcTempoRelacionamento(duplicatas),
        tendencia_volume: this.calcTendenciaVolume(duplicatas),
        prazo_medio_pagamento: this.calcPrazoMedioPagamento(duplicatas, pagamentos),
        indice_sazonalidade: this.calcIndiceSazonalidade(duplicatas, cliente.segmento_textil),
        referencia_comercial: this.calcReferenciaComercial(referencias),
        capacidade_estimada: this.calcCapacidadeEstimada(duplicatas, cliente.limite_credito)
      };

      return metrics;
    } catch (error) {
      logger.error('Erro ao calcular metricas do cliente:', error);
      throw error;
    }
  }

  private emptyMetrics(): ScoreMetrics {
    return {
      historico_pagamentos: 50,
      tempo_relacionamento: 0,
      tendencia_volume: 50,
      prazo_medio_pagamento: 50,
      indice_sazonalidade: 50,
      referencia_comercial: 50,
      capacidade_estimada: 50
    };
  }

  /**
   * 1. historico_pagamentos (25%): % of non-cancelled invoices that are paid on time
   */
  private calcHistoricoPagamentos(duplicatas: FDuplicata[], pagamentos: FPagamento[]): number {
    const relevantes = duplicatas.filter(d => d.status !== 'CANCELADA' && d.status !== 'ABERTA');
    if (relevantes.length === 0) return 50;

    const pagaMap = new Map<number, FPagamento>();
    for (const p of pagamentos) {
      pagaMap.set(p.duplicata_id, p);
    }

    const now = Date.now();
    const sixMonthsAgo = now - 180 * 86400000;
    const twelveMonthsAgo = now - 365 * 86400000;

    let weightedOnTime = 0;
    let totalWeight = 0;

    for (const d of relevantes) {
      // Recency weight: recent invoices matter more
      const invoiceDate = new Date(d.data_vencimento).getTime();
      let recencyWeight = 0.5; // older than 12 months
      if (invoiceDate >= sixMonthsAgo) {
        recencyWeight = 1.5; // last 6 months
      } else if (invoiceDate >= twelveMonthsAgo) {
        recencyWeight = 1.0; // 6-12 months
      }

      totalWeight += recencyWeight;

      if (d.status === 'PAGA') {
        const pag = pagaMap.get(d.id);
        if (pag) {
          const diffDays = (new Date(pag.data_pagamento).getTime() - new Date(d.data_vencimento).getTime()) / 86400000;
          if (diffDays <= 3) {
            weightedOnTime += recencyWeight; // On time
          } else {
            weightedOnTime += recencyWeight * 0.5; // Late but paid
          }
        } else {
          weightedOnTime += recencyWeight * 0.5;
        }
      }
      // VENCIDA = 0 points
    }

    if (totalWeight === 0) return 50;
    const score = (weightedOnTime / totalWeight) * 100;
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * 2. tempo_relacionamento (15%): months since first invoice
   * 0 months = 0, 6 months = 50, 12+ months = 100
   */
  private calcTempoRelacionamento(duplicatas: FDuplicata[]): number {
    if (duplicatas.length === 0) return 0;

    const earliest = duplicatas.reduce((min, d) => {
      const t = new Date(d.data_emissao).getTime();
      return t < min ? t : min;
    }, Infinity);

    const now = Date.now();
    const meses = (now - earliest) / (30 * 86400000);

    if (meses >= 12) return 100;
    if (meses >= 6) return 50 + ((meses - 6) / 6) * 50;
    return (meses / 6) * 50;
  }

  /**
   * 3. tendencia_volume (10%): compare recent 6mo vs prior 6mo purchase volume
   */
  private calcTendenciaVolume(duplicatas: FDuplicata[]): number {
    const now = Date.now();
    const sixMonthsAgo = now - 180 * 86400000;
    const twelveMonthsAgo = now - 360 * 86400000;

    const recent = duplicatas.filter(d => {
      const t = new Date(d.data_emissao).getTime();
      return t >= sixMonthsAgo && t <= now;
    });
    const prior = duplicatas.filter(d => {
      const t = new Date(d.data_emissao).getTime();
      return t >= twelveMonthsAgo && t < sixMonthsAgo;
    });

    const recentTotal = recent.reduce((sum, d) => sum + d.valor, 0);
    const priorTotal = prior.reduce((sum, d) => sum + d.valor, 0);

    if (priorTotal === 0 && recentTotal === 0) return 50; // neutral
    if (priorTotal === 0) return 80; // new client with purchases is good

    const growth = (recentTotal - priorTotal) / priorTotal;

    // Map growth to score: -50% or worse = 10, 0% = 50, +50% or more = 90, +100% = 100
    if (growth >= 1.0) return 100;
    if (growth >= 0.5) return 90;
    if (growth >= 0) return 50 + growth * 80;
    if (growth >= -0.5) return 50 + growth * 60;
    return Math.max(0, 10 + (growth + 0.5) * 20);
  }

  /**
   * 4. prazo_medio_pagamento (15%): average days to pay
   * Early = 100, on time = 90, late reduces score
   */
  private calcPrazoMedioPagamento(duplicatas: FDuplicata[], pagamentos: FPagamento[]): number {
    if (pagamentos.length === 0) return 50; // neutral

    const pagaMap = new Map<number, FPagamento>();
    for (const p of pagamentos) {
      pagaMap.set(p.duplicata_id, p);
    }

    let totalDias = 0;
    let count = 0;
    for (const d of duplicatas) {
      const pag = pagaMap.get(d.id);
      if (pag) {
        const diffDays = (new Date(pag.data_pagamento).getTime() - new Date(d.data_vencimento).getTime()) / 86400000;
        totalDias += diffDays;
        count++;
      }
    }

    if (count === 0) return 50;

    const prazoMedio = totalDias / count;

    // Score mapping
    if (prazoMedio <= -3) return 100; // Pays 3+ days early
    if (prazoMedio <= 0) return 95;  // Pays early or on time
    if (prazoMedio <= 3) return 90;  // Pays within 3-day grace
    if (prazoMedio <= 7) return 75;  // Up to 1 week late
    if (prazoMedio <= 15) return 55; // Up to 2 weeks late
    if (prazoMedio <= 30) return 35; // Up to 1 month late
    return Math.max(0, 35 - Math.floor((prazoMedio - 30) / 5) * 5);
  }

  /**
   * 5. indice_sazonalidade (10%): regularity of purchases across quarters,
   * enhanced with textile segment-aware seasonal pattern alignment.
   *
   * Blends two sub-scores:
   *  - Regularity score (existing): lower coefficient of variation = higher score
   *  - Pattern alignment score (new): correlation between the client's actual
   *    quarterly purchase VALUE distribution and the expected seasonal pattern
   *    for their textile segment
   *
   * If no segment is provided, only the regularity score is used.
   */
  private calcIndiceSazonalidade(duplicatas: FDuplicata[], segmentoTextil?: string): number {
    if (duplicatas.length < 4) return 40; // not enough data

    // Count invoices per quarter (last 12 months)
    const now = Date.now();
    const oneYearAgo = now - 365 * 86400000;
    const recentDups = duplicatas.filter(d => new Date(d.data_emissao).getTime() >= oneYearAgo);

    if (recentDups.length < 4) return 40;

    // Divide into 4 quarters by count (for regularity) and value (for pattern alignment)
    const quarterCounts = [0, 0, 0, 0];
    const quarterValues = [0, 0, 0, 0];
    for (const d of recentDups) {
      const monthsAgo = (now - new Date(d.data_emissao).getTime()) / (30 * 86400000);
      const q = Math.min(3, Math.floor(monthsAgo / 3));
      quarterCounts[q]++;
      quarterValues[q] += d.valor;
    }

    const totalCount = quarterCounts.reduce((a, b) => a + b, 0);
    if (totalCount === 0) return 40;

    // --- Regularity score (existing logic) ---
    const mean = totalCount / 4;
    const variance = quarterCounts.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / 4;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    let regularityScore: number;
    if (cv <= 0.2) regularityScore = 100;
    else if (cv <= 0.5) regularityScore = 80;
    else if (cv <= 0.8) regularityScore = 60;
    else if (cv <= 1.2) regularityScore = 40;
    else regularityScore = Math.max(10, 30 - Math.floor((cv - 1.2) * 20));

    // --- Segment pattern alignment score (new logic) ---
    const segmentKey = segmentoTextil as keyof typeof SEGMENT_SEASONAL_PATTERNS | undefined;
    if (!segmentKey || !(segmentKey in SEGMENT_SEASONAL_PATTERNS)) {
      // No segment info available; return regularity score only
      return regularityScore;
    }

    const expectedPattern = SEGMENT_SEASONAL_PATTERNS[segmentKey];
    const totalValue = quarterValues.reduce((a, b) => a + b, 0);

    if (totalValue <= 0) {
      return regularityScore;
    }

    // Actual quarterly distribution of purchase value
    const actualDistribution = quarterValues.map(v => v / totalValue);

    // Calculate Pearson correlation between actual and expected distributions
    const n = 4;
    const meanActual = actualDistribution.reduce((a, b) => a + b, 0) / n;
    const meanExpected = expectedPattern.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumSqActual = 0;
    let sumSqExpected = 0;
    for (let i = 0; i < n; i++) {
      const diffA = actualDistribution[i] - meanActual;
      const diffE = expectedPattern[i] - meanExpected;
      numerator += diffA * diffE;
      sumSqActual += diffA * diffA;
      sumSqExpected += diffE * diffE;
    }

    const denominator = Math.sqrt(sumSqActual * sumSqExpected);
    // correlation ranges from -1 to 1; map to 0-100 score
    // correlation = 1 -> perfect match -> 100
    // correlation = 0 -> no correlation -> 50
    // correlation = -1 -> inverse pattern -> 0
    const correlation = denominator > 0 ? numerator / denominator : 0;
    const patternAlignmentScore = Math.round(Math.min(100, Math.max(0, (correlation + 1) * 50)));

    // Blend: 60% regularity + 40% pattern alignment
    const blendedScore = Math.round(regularityScore * 0.6 + patternAlignmentScore * 0.4);
    return Math.min(100, Math.max(0, blendedScore));
  }

  /**
   * 6. referencia_comercial (15%): average commercial reference score
   * If no references, return 50 (neutral)
   */
  private calcReferenciaComercial(referencias: ReferenciaComercial[]): number {
    if (referencias.length === 0) return 50;
    const avg = referencias.reduce((sum, r) => sum + r.score_referencia, 0) / referencias.length;
    return Math.round(Math.min(100, Math.max(0, avg)));
  }

  /**
   * 7. capacidade_estimada (10%): ratio of credit limit to largest single purchase
   * Reasonable ratio (limit > largest purchase) = high score
   */
  private calcCapacidadeEstimada(duplicatas: FDuplicata[], limiteCredito: number): number {
    if (duplicatas.length === 0 || limiteCredito <= 0) return 50;

    const maxValor = Math.max(...duplicatas.map(d => d.valor));
    if (maxValor <= 0) return 50;

    const ratio = limiteCredito / maxValor;

    // ratio >= 5 -> 100 (very safe), ratio >= 3 -> 85, ratio >= 2 -> 70, ratio >= 1 -> 50, ratio < 1 -> danger
    if (ratio >= 5) return 100;
    if (ratio >= 3) return 85;
    if (ratio >= 2) return 70;
    if (ratio >= 1.5) return 60;
    if (ratio >= 1) return 50;
    if (ratio >= 0.5) return 30;
    return 10;
  }

  /**
   * Evaluate how much data we have for this client and return a confidence level.
   * Clients with more duplicatas, pagamentos, referencias and longer history
   * produce higher confidence scores.
   */
  private calculateDataSufficiency(duplicatas: FDuplicata[], pagamentos: FPagamento[], referencias: ReferenciaComercial[]): {
    nivel: 'ALTO' | 'MEDIO' | 'BAIXO' | 'INSUFICIENTE';
    score: number;
    fatores: {
      qtd_duplicatas: number;
      qtd_pagamentos: number;
      qtd_referencias: number;
      meses_historico: number;
    };
  } {
    const qtd_duplicatas = duplicatas.length;
    const qtd_pagamentos = pagamentos.length;
    const qtd_referencias = referencias.length;

    // Calculate months of history
    let meses_historico = 0;
    if (duplicatas.length > 0) {
      const earliest = duplicatas.reduce((min, d) => {
        const t = new Date(d.data_emissao).getTime();
        return t < min ? t : min;
      }, Infinity);
      meses_historico = Math.round((Date.now() - earliest) / (30 * 86400000));
    }

    // Score each factor (0-25 each, total 0-100)
    let score = 0;
    // Duplicatas: 0=0, 5=10, 10=15, 20+=25
    score += Math.min(25, Math.round(qtd_duplicatas * 1.25));
    // Pagamentos: 0=0, 5=10, 10=15, 20+=25
    score += Math.min(25, Math.round(qtd_pagamentos * 1.25));
    // Referencias: 0=0, 1=8, 2=15, 3+=25
    score += Math.min(25, Math.round(qtd_referencias * 8.33));
    // Historico: 0mo=0, 3mo=8, 6mo=15, 12mo+=25
    score += Math.min(25, Math.round(meses_historico * 2.08));

    score = Math.min(100, score);

    let nivel: 'ALTO' | 'MEDIO' | 'BAIXO' | 'INSUFICIENTE';
    if (score >= 75) nivel = 'ALTO';
    else if (score >= 50) nivel = 'MEDIO';
    else if (score >= 25) nivel = 'BAIXO';
    else nivel = 'INSUFICIENTE';

    return { nivel, score, fatores: { qtd_duplicatas, qtd_pagamentos, qtd_referencias, meses_historico } };
  }

  /**
   * Calculate the full score for a client
   */
  async calculateScore(clienteId: number, weights?: ScoreWeights): Promise<ScoreResult> {
    try {
      const metricas = await this.calculateClientMetrics(clienteId);
      const ponderacoes = weights || getConfiguredWeights();

      // Calculate weighted score
      const scoreFinal = Math.round(
        (metricas.historico_pagamentos * ponderacoes.historico_pagamentos) +
        (metricas.tempo_relacionamento * ponderacoes.tempo_relacionamento) +
        (metricas.tendencia_volume * ponderacoes.tendencia_volume) +
        (metricas.prazo_medio_pagamento * ponderacoes.prazo_medio_pagamento) +
        (metricas.indice_sazonalidade * ponderacoes.indice_sazonalidade) +
        (metricas.referencia_comercial * ponderacoes.referencia_comercial) +
        (metricas.capacidade_estimada * ponderacoes.capacidade_estimada)
      );

      const classificacao = this.getClassificacao(scoreFinal);

      // Fetch data for data sufficiency calculation
      const db = getDb();
      const duplicatas = db.query('f_duplicatas', (d: FDuplicata) => d.cliente_id === clienteId);
      const dupIds = new Set(duplicatas.map(d => d.id));
      const pagamentos = db.query('f_pagamentos', (p: FPagamento) => dupIds.has(p.duplicata_id));
      const referencias = db.query('referencias_comerciais', (r: ReferenciaComercial) => r.cliente_id === clienteId);

      const confiabilidade = this.calculateDataSufficiency(duplicatas, pagamentos, referencias);

      const result: ScoreResult = {
        cliente_id: clienteId,
        score_final: scoreFinal,
        metricas,
        ponderacoes,
        classificacao,
        data_calculo: new Date(),
        confiabilidade
      };

      // Save to history
      await this.saveScoreResult(result);

      return result;
    } catch (error) {
      logger.error('Erro ao calcular score:', error);
      throw error;
    }
  }

  private getClassificacao(score: number): 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' | 'PESSIMO' {
    if (score >= 80) return 'EXCELENTE';
    if (score >= 65) return 'BOM';
    if (score >= 50) return 'REGULAR';
    if (score >= 30) return 'RUIM';
    return 'PESSIMO';
  }

  private async saveScoreResult(result: ScoreResult): Promise<void> {
    try {
      const db = getDb();
      db.insert('score_historico', {
        cliente_id: result.cliente_id,
        score_final: result.score_final,
        historico_pagamentos: result.metricas.historico_pagamentos,
        tempo_relacionamento: result.metricas.tempo_relacionamento,
        tendencia_volume: result.metricas.tendencia_volume,
        prazo_medio_pagamento: result.metricas.prazo_medio_pagamento,
        indice_sazonalidade: result.metricas.indice_sazonalidade,
        referencia_comercial: result.metricas.referencia_comercial,
        capacidade_estimada: result.metricas.capacidade_estimada,
        peso_historico_pagamentos: result.ponderacoes.historico_pagamentos,
        peso_tempo_relacionamento: result.ponderacoes.tempo_relacionamento,
        peso_tendencia_volume: result.ponderacoes.tendencia_volume,
        peso_prazo_medio_pagamento: result.ponderacoes.prazo_medio_pagamento,
        peso_indice_sazonalidade: result.ponderacoes.indice_sazonalidade,
        peso_referencia_comercial: result.ponderacoes.referencia_comercial,
        peso_capacidade_estimada: result.ponderacoes.capacidade_estimada,
        classificacao: result.classificacao,
        data_calculo: result.data_calculo
      } as Omit<ScoreHistorico, 'id'>);
    } catch (error) {
      logger.error('Erro ao salvar resultado do score (nao critico):', error);
    }
  }

  async getScoreHistory(clienteId: number, limit: number = 10): Promise<ScoreResult[]> {
    try {
      const db = getDb();
      const records = db.query('score_historico', (r: ScoreHistorico) => r.cliente_id === clienteId);

      // Sort by date descending
      records.sort((a, b) => new Date(b.data_calculo).getTime() - new Date(a.data_calculo).getTime());

      // Limit results
      const limited = records.slice(0, limit);

      return limited.map((row) => ({
        cliente_id: row.cliente_id,
        score_final: row.score_final,
        metricas: {
          historico_pagamentos: row.historico_pagamentos,
          tempo_relacionamento: row.tempo_relacionamento,
          tendencia_volume: row.tendencia_volume,
          prazo_medio_pagamento: row.prazo_medio_pagamento,
          indice_sazonalidade: row.indice_sazonalidade,
          referencia_comercial: row.referencia_comercial,
          capacidade_estimada: row.capacidade_estimada
        },
        ponderacoes: {
          historico_pagamentos: row.peso_historico_pagamentos,
          tempo_relacionamento: row.peso_tempo_relacionamento,
          tendencia_volume: row.peso_tendencia_volume,
          prazo_medio_pagamento: row.peso_prazo_medio_pagamento,
          indice_sazonalidade: row.peso_indice_sazonalidade,
          referencia_comercial: row.peso_referencia_comercial,
          capacidade_estimada: row.peso_capacidade_estimada
        },
        classificacao: row.classificacao as ScoreResult['classificacao'],
        data_calculo: new Date(row.data_calculo)
      }));
    } catch (error) {
      logger.error('Erro ao buscar historico de scores:', error);
      throw error;
    }
  }
}
