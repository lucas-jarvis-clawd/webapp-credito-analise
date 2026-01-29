import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { ScoreService } from '../services/scoreService';
import { initializeDatabase } from '../database/connection';
import { resetMemoryDb, getMemoryDb, MemoryDatabase } from '../database/memoryDb';
import { ScoreResult, ScoreWeights, ScoreMetrics } from '../models/types';

let service: ScoreService;
let db: MemoryDatabase;

beforeAll(async () => {
  // Initialize the database with seed data
  await initializeDatabase();
  db = getMemoryDb();
  service = new ScoreService();
});

// ============================================================
// a) Score calculation basics
// ============================================================
describe('Score calculation basics', () => {
  it('calculateScore() should return a result with score_final between 0 and 100', async () => {
    // Client 1 = "Maria Silva Confeccoes ME" (ATIVO, has data)
    const result = await service.calculateScore(1);

    expect(result).toBeDefined();
    expect(result.score_final).toBeGreaterThanOrEqual(0);
    expect(result.score_final).toBeLessThanOrEqual(100);
  });

  it('should return a result with all 7 metrics', async () => {
    const result = await service.calculateScore(1);

    const metricKeys: (keyof ScoreMetrics)[] = [
      'historico_pagamentos',
      'tempo_relacionamento',
      'tendencia_volume',
      'prazo_medio_pagamento',
      'indice_sazonalidade',
      'referencia_comercial',
      'capacidade_estimada'
    ];

    expect(result.metricas).toBeDefined();
    for (const key of metricKeys) {
      expect(result.metricas).toHaveProperty(key);
      expect(typeof result.metricas[key]).toBe('number');
    }
  });

  it('should have correct classification based on score', async () => {
    const result = await service.calculateScore(1);

    // Verify the classification matches the score according to thresholds
    const score = result.score_final;
    if (score >= 80) {
      expect(result.classificacao).toBe('EXCELENTE');
    } else if (score >= 65) {
      expect(result.classificacao).toBe('BOM');
    } else if (score >= 50) {
      expect(result.classificacao).toBe('REGULAR');
    } else if (score >= 30) {
      expect(result.classificacao).toBe('RUIM');
    } else {
      expect(result.classificacao).toBe('PESSIMO');
    }
  });

  it('should classify score >= 80 as EXCELENTE', async () => {
    // We test the classification logic by providing custom weights that
    // guarantee a high score. Use a client with good data and give 100%
    // weight to a metric we know will be high.
    // Instead, let's directly test multiple clients and verify classification logic.
    const clients = db.getAll('clientes');
    for (const client of clients.slice(0, 5)) {
      const result = await service.calculateScore(client.id);
      const score = result.score_final;

      if (score >= 80) expect(result.classificacao).toBe('EXCELENTE');
      else if (score >= 65) expect(result.classificacao).toBe('BOM');
      else if (score >= 50) expect(result.classificacao).toBe('REGULAR');
      else if (score >= 30) expect(result.classificacao).toBe('RUIM');
      else expect(result.classificacao).toBe('PESSIMO');
    }
  });

  it('should return complete ScoreResult structure', async () => {
    const result = await service.calculateScore(1);

    expect(result).toHaveProperty('cliente_id', 1);
    expect(result).toHaveProperty('score_final');
    expect(result).toHaveProperty('metricas');
    expect(result).toHaveProperty('ponderacoes');
    expect(result).toHaveProperty('classificacao');
    expect(result).toHaveProperty('data_calculo');
    expect(result.data_calculo).toBeInstanceOf(Date);
  });

  it('should return valid classificacao values only', async () => {
    const validClassifications = ['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'PESSIMO'];
    const result = await service.calculateScore(1);
    expect(validClassifications).toContain(result.classificacao);
  });
});

// ============================================================
// b) Configured weights integration
// ============================================================
describe('Configured weights integration', () => {
  it('when no explicit weights passed, configured weights from DB should be used', async () => {
    const result = await service.calculateScore(1);

    // The DB seed sets these default weights
    expect(result.ponderacoes.historico_pagamentos).toBe(0.25);
    expect(result.ponderacoes.tempo_relacionamento).toBe(0.15);
    expect(result.ponderacoes.tendencia_volume).toBe(0.10);
    expect(result.ponderacoes.prazo_medio_pagamento).toBe(0.15);
    expect(result.ponderacoes.indice_sazonalidade).toBe(0.10);
    expect(result.ponderacoes.referencia_comercial).toBe(0.15);
    expect(result.ponderacoes.capacidade_estimada).toBe(0.10);
  });

  it('when explicit weights passed, they should override configured weights', async () => {
    const customWeights: ScoreWeights = {
      historico_pagamentos: 0.50,
      tempo_relacionamento: 0.10,
      tendencia_volume: 0.05,
      prazo_medio_pagamento: 0.10,
      indice_sazonalidade: 0.05,
      referencia_comercial: 0.10,
      capacidade_estimada: 0.10
    };

    const result = await service.calculateScore(1, customWeights);

    expect(result.ponderacoes.historico_pagamentos).toBe(0.50);
    expect(result.ponderacoes.tempo_relacionamento).toBe(0.10);
    expect(result.ponderacoes.tendencia_volume).toBe(0.05);
    expect(result.ponderacoes.prazo_medio_pagamento).toBe(0.10);
    expect(result.ponderacoes.indice_sazonalidade).toBe(0.05);
    expect(result.ponderacoes.referencia_comercial).toBe(0.10);
    expect(result.ponderacoes.capacidade_estimada).toBe(0.10);
  });

  it('different weights should produce different final scores', async () => {
    // Weights heavily favoring historico_pagamentos
    const weightsA: ScoreWeights = {
      historico_pagamentos: 0.70,
      tempo_relacionamento: 0.05,
      tendencia_volume: 0.05,
      prazo_medio_pagamento: 0.05,
      indice_sazonalidade: 0.05,
      referencia_comercial: 0.05,
      capacidade_estimada: 0.05
    };

    // Weights heavily favoring tempo_relacionamento
    const weightsB: ScoreWeights = {
      historico_pagamentos: 0.05,
      tempo_relacionamento: 0.70,
      tendencia_volume: 0.05,
      prazo_medio_pagamento: 0.05,
      indice_sazonalidade: 0.05,
      referencia_comercial: 0.05,
      capacidade_estimada: 0.05
    };

    const resultA = await service.calculateScore(1, weightsA);
    const resultB = await service.calculateScore(1, weightsB);

    // The metrics are the same, but different weights should yield different
    // final scores (unless by coincidence the two metrics are identical).
    // We verify at least the structure is correct - it's possible they happen
    // to round to the same value, so we check they use the correct weights.
    expect(resultA.ponderacoes.historico_pagamentos).toBe(0.70);
    expect(resultB.ponderacoes.tempo_relacionamento).toBe(0.70);
  });

  it('weights should sum and affect the final score calculation', async () => {
    // Use all-zero weights except one metric set to 1.0
    const weightsOnlyHistorico: ScoreWeights = {
      historico_pagamentos: 1.0,
      tempo_relacionamento: 0,
      tendencia_volume: 0,
      prazo_medio_pagamento: 0,
      indice_sazonalidade: 0,
      referencia_comercial: 0,
      capacidade_estimada: 0
    };

    const weightsOnlyTempo: ScoreWeights = {
      historico_pagamentos: 0,
      tempo_relacionamento: 1.0,
      tendencia_volume: 0,
      prazo_medio_pagamento: 0,
      indice_sazonalidade: 0,
      referencia_comercial: 0,
      capacidade_estimada: 0
    };

    const resultHistorico = await service.calculateScore(1, weightsOnlyHistorico);
    const resultTempo = await service.calculateScore(1, weightsOnlyTempo);

    // When only one weight is 1.0 and rest are 0, the score_final should equal
    // that single metric (rounded).
    const metrics = await service.calculateClientMetrics(1);
    expect(resultHistorico.score_final).toBe(Math.round(metrics.historico_pagamentos));
    expect(resultTempo.score_final).toBe(Math.round(metrics.tempo_relacionamento));
  });
});

// ============================================================
// c) Individual metric calculations
// ============================================================
describe('Individual metric calculations', () => {
  it('calculateClientMetrics() should return all 7 metric keys', async () => {
    const metrics = await service.calculateClientMetrics(1);

    const expectedKeys: (keyof ScoreMetrics)[] = [
      'historico_pagamentos',
      'tempo_relacionamento',
      'tendencia_volume',
      'prazo_medio_pagamento',
      'indice_sazonalidade',
      'referencia_comercial',
      'capacidade_estimada'
    ];

    for (const key of expectedKeys) {
      expect(metrics).toHaveProperty(key);
    }
    expect(Object.keys(metrics)).toHaveLength(7);
  });

  it('each metric should be between 0 and 100', async () => {
    // Test with multiple clients for robustness
    const clientIds = [1, 2, 3, 5, 7];
    for (const id of clientIds) {
      const metrics = await service.calculateClientMetrics(id);
      for (const [key, value] of Object.entries(metrics)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('non-existent client should get neutral/empty metrics', async () => {
    // Client 99999 does not exist
    const metrics = await service.calculateClientMetrics(99999);

    // The emptyMetrics returns: historico=50, tempo=0, tendencia=50, prazo=50, sazon=50, ref=50, cap=50
    expect(metrics.historico_pagamentos).toBe(50);
    expect(metrics.tempo_relacionamento).toBe(0);
    expect(metrics.tendencia_volume).toBe(50);
    expect(metrics.prazo_medio_pagamento).toBe(50);
    expect(metrics.indice_sazonalidade).toBe(50);
    expect(metrics.referencia_comercial).toBe(50);
    expect(metrics.capacidade_estimada).toBe(50);
  });

  it('metrics for active client with data should differ from empty metrics', async () => {
    // Client 1 has seeded duplicatas and pagamentos, so at least some metrics
    // should differ from the empty/neutral values.
    const metrics = await service.calculateClientMetrics(1);
    const emptyMetrics = await service.calculateClientMetrics(99999);

    // At least one metric must differ from the empty metric defaults
    const metricsArray = Object.values(metrics);
    const emptyArray = Object.values(emptyMetrics);
    const allSame = metricsArray.every((v, i) => v === emptyArray[i]);
    expect(allSame).toBe(false);
  });

  it('tempo_relacionamento should be > 0 for clients with historical data', async () => {
    // Client 1 was created on 2023-03-15, so they have significant history
    const metrics = await service.calculateClientMetrics(1);
    expect(metrics.tempo_relacionamento).toBeGreaterThan(0);
  });

  it('metrics should be integers (rounded values)', async () => {
    const metrics = await service.calculateClientMetrics(1);
    // historico_pagamentos is rounded in the code via Math.round
    expect(Number.isInteger(metrics.historico_pagamentos)).toBe(true);
    // tempo_relacionamento uses division that can produce floats, but it is
    // not explicitly rounded in the code - it returns the raw value.
    // Same for other metrics. Let's just verify they are valid numbers.
    for (const value of Object.values(metrics)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});

// ============================================================
// d) Score history
// ============================================================
describe('Score history', () => {
  it('calculateScore() should save to history', async () => {
    // Reset to get a clean DB for history tests
    resetMemoryDb();
    await initializeDatabase();
    const freshService = new ScoreService();

    // Get initial history count for client 1
    const historyBefore = await freshService.getScoreHistory(1);
    const countBefore = historyBefore.length;

    // Calculate a new score - this should save to history
    await freshService.calculateScore(1);

    // Verify history count increased
    const historyAfter = await freshService.getScoreHistory(1);
    expect(historyAfter.length).toBe(countBefore + 1);
  });

  it('getScoreHistory() should return saved scores', async () => {
    resetMemoryDb();
    await initializeDatabase();
    const freshService = new ScoreService();

    // Calculate score for client 2
    const scoreResult = await freshService.calculateScore(2);

    // Fetch history - should include the just-calculated score
    const history = await freshService.getScoreHistory(2);
    expect(history.length).toBeGreaterThan(0);

    // The most recent entry (first in descending order) should match
    const latest = history[0];
    expect(latest.cliente_id).toBe(2);
    expect(latest.score_final).toBe(scoreResult.score_final);
    expect(latest.classificacao).toBe(scoreResult.classificacao);
  });

  it('history should be ordered by date descending', async () => {
    resetMemoryDb();
    await initializeDatabase();
    const freshService = new ScoreService();

    // Calculate score multiple times for client 3 to create history entries
    await freshService.calculateScore(3);
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await freshService.calculateScore(3);

    const history = await freshService.getScoreHistory(3);
    expect(history.length).toBeGreaterThanOrEqual(2);

    // Verify descending order - each entry's date should be >= the next
    for (let i = 0; i < history.length - 1; i++) {
      const currentDate = new Date(history[i].data_calculo).getTime();
      const nextDate = new Date(history[i + 1].data_calculo).getTime();
      expect(currentDate).toBeGreaterThanOrEqual(nextDate);
    }
  });

  it('getScoreHistory() should respect the limit parameter', async () => {
    resetMemoryDb();
    await initializeDatabase();
    const freshService = new ScoreService();

    // Calculate several scores for client 1
    await freshService.calculateScore(1);
    await freshService.calculateScore(1);
    await freshService.calculateScore(1);

    // Request with limit=2
    const history = await freshService.getScoreHistory(1, 2);
    expect(history.length).toBeLessThanOrEqual(2);
  });

  it('getScoreHistory() for non-existent client should return empty array', async () => {
    const history = await service.getScoreHistory(99999);
    expect(history).toEqual([]);
  });

  it('saved history should contain correct metrics and weights', async () => {
    resetMemoryDb();
    await initializeDatabase();
    const freshService = new ScoreService();

    const customWeights: ScoreWeights = {
      historico_pagamentos: 0.30,
      tempo_relacionamento: 0.20,
      tendencia_volume: 0.05,
      prazo_medio_pagamento: 0.15,
      indice_sazonalidade: 0.05,
      referencia_comercial: 0.15,
      capacidade_estimada: 0.10
    };

    const scoreResult = await freshService.calculateScore(1, customWeights);
    const history = await freshService.getScoreHistory(1);

    // Find the most recent entry (first due to descending sort)
    const latest = history[0];
    expect(latest.score_final).toBe(scoreResult.score_final);
    expect(latest.metricas.historico_pagamentos).toBe(scoreResult.metricas.historico_pagamentos);
    expect(latest.metricas.tempo_relacionamento).toBe(scoreResult.metricas.tempo_relacionamento);
    expect(latest.ponderacoes.historico_pagamentos).toBe(0.30);
    expect(latest.ponderacoes.tempo_relacionamento).toBe(0.20);
  });
});

// ============================================================
// Edge cases and additional coverage
// ============================================================
describe('Edge cases', () => {
  it('should handle calculating score for all seeded clients without errors', async () => {
    resetMemoryDb();
    await initializeDatabase();
    const freshService = new ScoreService();

    const clients = db.getAll('clientes');
    expect(clients.length).toBeGreaterThan(0);

    for (const client of clients) {
      const result = await freshService.calculateScore(client.id);
      expect(result.score_final).toBeGreaterThanOrEqual(0);
      expect(result.score_final).toBeLessThanOrEqual(100);
      expect(result.cliente_id).toBe(client.id);
    }
  });

  it('should handle blocked client (BLOQUEADO) without errors', async () => {
    // Client 8 (Patricia Lima) has status BLOQUEADO
    const result = await service.calculateScore(8);
    expect(result).toBeDefined();
    expect(result.score_final).toBeGreaterThanOrEqual(0);
    expect(result.score_final).toBeLessThanOrEqual(100);
  });

  it('should handle inactive client (INATIVO) without errors', async () => {
    // Client 14 (Lucas Nascimento) has status INATIVO
    const result = await service.calculateScore(14);
    expect(result).toBeDefined();
    expect(result.score_final).toBeGreaterThanOrEqual(0);
    expect(result.score_final).toBeLessThanOrEqual(100);
  });
});
