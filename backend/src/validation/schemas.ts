import Joi from 'joi';

export const scoreWeightsSchema = Joi.object({
  historico_pagamentos: Joi.number().min(0).max(1).required(),
  tempo_relacionamento: Joi.number().min(0).max(1).required(),
  tendencia_volume: Joi.number().min(0).max(1).required(),
  prazo_medio_pagamento: Joi.number().min(0).max(1).required(),
  indice_sazonalidade: Joi.number().min(0).max(1).required(),
  referencia_comercial: Joi.number().min(0).max(1).required(),
  capacidade_estimada: Joi.number().min(0).max(1).required()
}).custom((value) => {
  const sum =
    value.historico_pagamentos +
    value.tempo_relacionamento +
    value.tendencia_volume +
    value.prazo_medio_pagamento +
    value.indice_sazonalidade +
    value.referencia_comercial +
    value.capacidade_estimada;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error('A soma dos pesos deve ser igual a 1.0');
  }
  return value;
});
