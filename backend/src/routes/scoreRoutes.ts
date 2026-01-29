import express from 'express';
import { ScoreService } from '../services/scoreService';
import { ClientService } from '../services/clientService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { scoreWeightsSchema } from '../validation/schemas';

const router = express.Router();
const scoreService = new ScoreService();
const clientService = new ClientService();

// Middleware de autenticacao para todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /score/defaults:
 *   get:
 *     summary: Obter pesos padrao e descricoes das metricas
 *     tags: [Score]
 *     responses:
 *       200:
 *         description: Configuracao padrao do sistema de scoring
 */
router.get('/defaults', async (req, res, next) => {
  try {
    const defaults = {
      weights: {
        historico_pagamentos: 0.25,
        tempo_relacionamento: 0.15,
        tendencia_volume: 0.10,
        prazo_medio_pagamento: 0.15,
        indice_sazonalidade: 0.10,
        referencia_comercial: 0.15,
        capacidade_estimada: 0.10
      },
      score_range: {
        min: 0,
        max: 100
      },
      classificacoes: {
        'EXCELENTE': '80-100 pontos',
        'BOM': '65-79 pontos',
        'REGULAR': '50-64 pontos',
        'RUIM': '30-49 pontos',
        'PESSIMO': '0-29 pontos'
      },
      metricas_descricoes: {
        historico_pagamentos: 'Percentual de duplicatas pagas no prazo (peso 25%)',
        tempo_relacionamento: 'Meses desde a primeira duplicata, normalizado (peso 15%)',
        tendencia_volume: 'Comparacao volume ultimos 6 meses vs anteriores (peso 10%)',
        prazo_medio_pagamento: 'Media de dias para pagamento (peso 15%)',
        indice_sazonalidade: 'Regularidade de compras ao longo dos trimestres (peso 10%)',
        referencia_comercial: 'Media de score das referencias comerciais (peso 15%)',
        capacidade_estimada: 'Relacao limite de credito vs maior compra (peso 10%)'
      }
    };

    res.json({
      success: true,
      data: defaults
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /score/batch:
 *   post:
 *     summary: Calcular score em lote (ADMIN/ANALISTA)
 *     tags: [Score]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cliente_ids]
 *             properties:
 *               cliente_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 maxItems: 100
 *               weights:
 *                 $ref: '#/components/schemas/ScoreResult/properties/ponderacoes'
 *     responses:
 *       200:
 *         description: Resultado do processamento em lote
 */
router.post('/batch', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const { cliente_ids, weights } = req.body;

    if (!Array.isArray(cliente_ids) || cliente_ids.length === 0) {
      throw new AppError('Lista de IDs de clientes e obrigatoria', 400);
    }

    if (cliente_ids.length > 100) {
      throw new AppError('Maximo de 100 clientes por lote', 400);
    }

    let validatedWeights;
    if (weights) {
      const { error } = scoreWeightsSchema.validate(weights);
      if (error) {
        throw new AppError(`Pesos invalidos: ${error.details[0].message}`, 400);
      }
      validatedWeights = weights;
    }

    const results = [];
    const errors = [];

    for (const clienteId of cliente_ids) {
      try {
        const scoreResult = await scoreService.calculateScore(clienteId, validatedWeights);
        results.push(scoreResult);
      } catch (error) {
        errors.push({ cliente_id: clienteId, error: (error as Error).message });
      }
    }

    res.json({
      success: true,
      data: {
        processados: results.length,
        sucessos: results,
        erros: errors,
        total_solicitados: cliente_ids.length
      },
      message: `Processamento em lote concluido: ${results.length}/${cliente_ids.length} sucessos`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /score/calculate/{clienteId}:
 *   post:
 *     summary: Calcular score de credito do cliente
 *     tags: [Score]
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weights:
 *                 description: Pesos customizados (opcional)
 *     responses:
 *       200:
 *         description: Score calculado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ScoreResult'
 *       404:
 *         description: Cliente nao encontrado
 */
router.post('/calculate/:clienteId', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente invalido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente nao encontrado', 404);
    }

    let weights;
    if (req.body.weights) {
      const { error } = scoreWeightsSchema.validate(req.body.weights);
      if (error) {
        throw new AppError(`Pesos invalidos: ${error.details[0].message}`, 400);
      }
      weights = req.body.weights;
    }

    const scoreResult = await scoreService.calculateScore(clienteId, weights);

    res.json({
      success: true,
      data: scoreResult,
      message: 'Score calculado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /score/{clienteId}/history:
 *   get:
 *     summary: Historico de scores do cliente
 *     tags: [Score]
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Lista de scores historicos
 *       404:
 *         description: Cliente nao encontrado
 */
router.get('/:clienteId/history', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente invalido', 400);
    }

    const limit = parseInt(req.query.limit as string) || 10;
    if (limit > 50) {
      throw new AppError('Limite maximo de 50 registros', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente nao encontrado', 404);
    }

    const history = await scoreService.getScoreHistory(clienteId, limit);

    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/score/:clienteId/metrics - Metricas detalhadas do cliente
router.get('/:clienteId/metrics', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente invalido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente nao encontrado', 404);
    }

    const metrics = await scoreService.calculateClientMetrics(clienteId);

    res.json({
      success: true,
      data: {
        cliente_id: clienteId,
        nome_cliente: client.nome,
        metricas: metrics,
        descricoes: {
          historico_pagamentos: 'Percentual de duplicatas pagas no prazo',
          tempo_relacionamento: 'Tempo de relacionamento normalizado (0=novo, 100=12+ meses)',
          tendencia_volume: 'Tendencia de volume de compras (crescimento = score alto)',
          prazo_medio_pagamento: 'Prazo medio de pagamento (antecipado/no prazo = score alto)',
          indice_sazonalidade: 'Regularidade de compras nos trimestres',
          referencia_comercial: 'Media das referencias comerciais',
          capacidade_estimada: 'Relacao entre limite e maior compra'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /score/{clienteId}:
 *   get:
 *     summary: Obter ultimo score do cliente (sem recalcular)
 *     tags: [Score]
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ultimo score do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ScoreResult'
 *       404:
 *         description: Cliente nao encontrado
 */
router.get('/:clienteId', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente invalido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente nao encontrado', 404);
    }

    // Buscar ultimo score do historico
    const history = await scoreService.getScoreHistory(clienteId, 1);
    if (history.length === 0) {
      // Se nao tem historico, calcula pela primeira vez
      const scoreResult = await scoreService.calculateScore(clienteId);
      return res.json({
        success: true,
        data: scoreResult
      });
    }

    res.json({
      success: true,
      data: history[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
