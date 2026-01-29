import express from 'express';
import Joi from 'joi';
import { getDb } from '../database/connection';
import { authMiddleware, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ConfiguracaoSistema } from '../models/types';
import { scoreWeightsSchema } from '../validation/schemas';
import { getConfiguredWeights } from '../utils/scoringConfig';

const router = express.Router();

// Middleware de autenticacao para todas as rotas
router.use(authMiddleware);

// Schema de validacao para configuracoes
const configSchema = Joi.object({
  chave: Joi.string().required(),
  valor: Joi.string().required(),
  descricao: Joi.string().optional(),
  tipo: Joi.string().valid('STRING', 'NUMBER', 'BOOLEAN', 'JSON').default('STRING')
});

// GET /api/config - Listar todas as configuracoes (apenas ADMIN)
router.get('/', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const db = getDb();
    const configs = db.getAll('configuracoes_sistema');
    configs.sort((a, b) => {
      const catCmp = (a.categoria || '').localeCompare(b.categoria || '');
      if (catCmp !== 0) return catCmp;
      return (a.chave || '').localeCompare(b.chave || '');
    });

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /config/scoring:
 *   get:
 *     summary: Obter configuracoes de scoring (pesos, limites, classificacoes)
 *     tags: [Configuracao]
 *     responses:
 *       200:
 *         description: Configuracoes atuais do scoring
 */
router.get('/scoring', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const db = getDb();
    const configs = db.query('configuracoes_sistema',
      (c: ConfiguracaoSistema) => c.categoria === 'SCORING'
    );

    // Read score limits from DB
    let scoreMin = 0;
    let scoreMax = 100;
    for (const config of configs) {
      if (config.chave === 'score_min') scoreMin = parseInt(config.valor);
      if (config.chave === 'score_max') scoreMax = parseInt(config.valor);
    }

    const scoringConfig = {
      pesos: getConfiguredWeights(),
      limites: { score_min: scoreMin, score_max: scoreMax },
      classificacoes: {
        excelente: { min: 80, max: 100, cor: '#4CAF50' },
        bom: { min: 65, max: 79, cor: '#8BC34A' },
        regular: { min: 50, max: 64, cor: '#FFC107' },
        ruim: { min: 30, max: 49, cor: '#FF9800' },
        pessimo: { min: 0, max: 29, cor: '#F44336' }
      }
    };

    res.json({
      success: true,
      data: scoringConfig
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /config/scoring/weights:
 *   put:
 *     summary: Atualizar pesos do scoring (somente ADMIN)
 *     tags: [Configuracao]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Pesos devem somar 1.0
 *             properties:
 *               historico_pagamentos:
 *                 type: number
 *                 example: 0.25
 *               tempo_relacionamento:
 *                 type: number
 *                 example: 0.15
 *               tendencia_volume:
 *                 type: number
 *                 example: 0.10
 *               prazo_medio_pagamento:
 *                 type: number
 *                 example: 0.15
 *               indice_sazonalidade:
 *                 type: number
 *                 example: 0.10
 *               referencia_comercial:
 *                 type: number
 *                 example: 0.15
 *               capacidade_estimada:
 *                 type: number
 *                 example: 0.10
 *     responses:
 *       200:
 *         description: Pesos atualizados
 *       400:
 *         description: Pesos invalidos
 */
router.put('/scoring/weights', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { error } = scoreWeightsSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const weights = req.body;
    const db = getDb();

    const weightKeys: { chave: string; field: string; descricao: string }[] = [
      { chave: 'peso_historico_pagamentos', field: 'historico_pagamentos', descricao: 'Peso do historico de pagamentos no calculo do score' },
      { chave: 'peso_tempo_relacionamento', field: 'tempo_relacionamento', descricao: 'Peso do tempo de relacionamento no calculo do score' },
      { chave: 'peso_tendencia_volume', field: 'tendencia_volume', descricao: 'Peso da tendencia de volume no calculo do score' },
      { chave: 'peso_prazo_medio_pagamento', field: 'prazo_medio_pagamento', descricao: 'Peso do prazo medio de pagamento no calculo do score' },
      { chave: 'peso_indice_sazonalidade', field: 'indice_sazonalidade', descricao: 'Peso do indice de sazonalidade no calculo do score' },
      { chave: 'peso_referencia_comercial', field: 'referencia_comercial', descricao: 'Peso da referencia comercial no calculo do score' },
      { chave: 'peso_capacidade_estimada', field: 'capacidade_estimada', descricao: 'Peso da capacidade estimada no calculo do score' }
    ];

    for (const wk of weightKeys) {
      const existing = db.query('configuracoes_sistema',
        (c: ConfiguracaoSistema) => c.chave === wk.chave && c.categoria === 'SCORING'
      );

      if (existing.length > 0) {
        db.update('configuracoes_sistema', existing[0].id, {
          valor: weights[wk.field].toString(),
          descricao: wk.descricao,
          updated_at: new Date()
        } as Partial<ConfiguracaoSistema>);
      } else {
        db.insert('configuracoes_sistema', {
          categoria: 'SCORING',
          chave: wk.chave,
          valor: weights[wk.field].toString(),
          descricao: wk.descricao,
          tipo: 'NUMBER',
          created_at: new Date(),
          updated_at: new Date()
        } as Omit<ConfiguracaoSistema, 'id'>);
      }
    }

    logger.info(`Pesos de scoring atualizados por: ${req.user?.nome}`, { pesos: weights });

    res.json({
      success: true,
      data: weights,
      message: 'Pesos de scoring atualizados com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/config/:chave - Obter configuracao especifica
router.get('/:chave', async (req, res, next) => {
  try {
    const { chave } = req.params;
    const db = getDb();
    const configs = db.query('configuracoes_sistema',
      (c: ConfiguracaoSistema) => c.chave === chave
    );

    if (configs.length === 0) {
      throw new AppError('Configuracao nao encontrada', 404);
    }

    res.json({
      success: true,
      data: configs[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/config - Criar nova configuracao (apenas ADMIN)
router.post('/', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { error } = configSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { chave, valor, descricao, tipo } = req.body;
    const db = getDb();

    const newConfig = db.insert('configuracoes_sistema', {
      categoria: 'GERAL',
      chave,
      valor,
      descricao: descricao || undefined,
      tipo: tipo || 'STRING',
      created_at: new Date(),
      updated_at: new Date()
    } as Omit<ConfiguracaoSistema, 'id'>);

    logger.info(`Nova configuracao criada por: ${req.user?.nome}`, { chave, valor, tipo });

    res.status(201).json({
      success: true,
      data: newConfig,
      message: 'Configuracao criada com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/config/:chave - Atualizar configuracao (apenas ADMIN)
router.put('/:chave', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { chave } = req.params;
    const { valor, descricao } = req.body;

    if (!valor) {
      throw new AppError('Valor e obrigatorio', 400);
    }

    const db = getDb();
    const configs = db.query('configuracoes_sistema',
      (c: ConfiguracaoSistema) => c.chave === chave
    );

    if (configs.length === 0) {
      throw new AppError('Configuracao nao encontrada', 404);
    }

    const updateData: Partial<ConfiguracaoSistema> = {
      valor,
      updated_at: new Date()
    };
    if (descricao !== undefined) {
      updateData.descricao = descricao;
    }

    db.update('configuracoes_sistema', configs[0].id, updateData);

    logger.info(`Configuracao atualizada por: ${req.user?.nome}`, { chave, valor });

    res.json({
      success: true,
      data: { chave, valor, descricao },
      message: 'Configuracao atualizada com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/config/:chave - Deletar configuracao (apenas ADMIN)
router.delete('/:chave', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { chave } = req.params;
    const db = getDb();

    const configs = db.query('configuracoes_sistema',
      (c: ConfiguracaoSistema) => c.chave === chave
    );

    if (configs.length === 0) {
      throw new AppError('Configuracao nao encontrada', 404);
    }

    db.delete('configuracoes_sistema', configs[0].id);

    logger.info(`Configuracao deletada por: ${req.user?.nome}`, { chave });

    res.json({
      success: true,
      message: 'Configuracao deletada com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
