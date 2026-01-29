import { getDb } from '../database/connection';
import { ScoreWeights, ConfiguracaoSistema } from '../models/types';

const DEFAULT_WEIGHTS: ScoreWeights = {
  historico_pagamentos: 0.25,
  tempo_relacionamento: 0.15,
  tendencia_volume: 0.10,
  prazo_medio_pagamento: 0.15,
  indice_sazonalidade: 0.10,
  referencia_comercial: 0.15,
  capacidade_estimada: 0.10
};

const WEIGHT_KEY_MAP: Record<string, keyof ScoreWeights> = {
  'peso_historico_pagamentos': 'historico_pagamentos',
  'peso_tempo_relacionamento': 'tempo_relacionamento',
  'peso_tendencia_volume': 'tendencia_volume',
  'peso_prazo_medio_pagamento': 'prazo_medio_pagamento',
  'peso_indice_sazonalidade': 'indice_sazonalidade',
  'peso_referencia_comercial': 'referencia_comercial',
  'peso_capacidade_estimada': 'capacidade_estimada'
};

/**
 * Reads configured scoring weights from the database.
 * Falls back to default weights if DB is unavailable.
 * Used by both ScoreService and configRoutes.
 */
export function getConfiguredWeights(): ScoreWeights {
  try {
    const db = getDb();
    const configs = db.query('configuracoes_sistema',
      (c: ConfiguracaoSistema) => c.categoria === 'SCORING'
    );

    const weights = { ...DEFAULT_WEIGHTS };

    for (const config of configs) {
      const field = WEIGHT_KEY_MAP[config.chave];
      if (field) {
        weights[field] = parseFloat(config.valor);
      }
    }

    return weights;
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

export { DEFAULT_WEIGHTS };
