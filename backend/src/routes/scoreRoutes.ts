import express from 'express';
import Joi from 'joi';
import { ScoreService } from '../services/scoreService';
import { ClientService } from '../services/clientService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();
const scoreService = new ScoreService();
const clientService = new ClientService();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Schema de validação para pesos customizados
const weightsSchema = Joi.object({
  pontuacao: Joi.number().min(0).max(1).required(),
  historico: Joi.number().min(0).max(1).required(),
  valor: Joi.number().min(0).max(1).required(),
  prazo: Joi.number().min(0).max(1).required()
}).custom((value) => {
  const sum = value.pontuacao + value.historico + value.valor + value.prazo;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error('A soma dos pesos deve ser igual a 1.0');
  }
  return value;
});

// POST /api/score/calculate/:clienteId - Calcular score do cliente
router.post('/calculate/:clienteId', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente inválido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    let weights;
    if (req.body.weights) {
      const { error } = weightsSchema.validate(req.body.weights);
      if (error) {
        throw new AppError(`Pesos inválidos: ${error.details[0].message}`, 400);
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

// GET /api/score/:clienteId - Obter último score do cliente
router.get('/:clienteId', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente inválido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Calcula score com pesos padrão
    const scoreResult = await scoreService.calculateScore(clienteId);

    res.json({
      success: true,
      data: scoreResult
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/score/:clienteId/history - Histórico de scores do cliente
router.get('/:clienteId/history', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente inválido', 400);
    }

    const limit = parseInt(req.query.limit as string) || 10;
    if (limit > 50) {
      throw new AppError('Limite máximo de 50 registros', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
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

// GET /api/score/:clienteId/metrics - Métricas detalhadas do cliente
router.get('/:clienteId/metrics', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);
    if (isNaN(clienteId)) {
      throw new AppError('ID do cliente inválido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(clienteId);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const metrics = await scoreService.calculateClientMetrics(clienteId);

    res.json({
      success: true,
      data: {
        cliente_id: clienteId,
        nome_cliente: client.nome,
        metricas: metrics,
        descricoes: {
          pontuacao_interna: 'Pontuação baseada em regras de negócio internas',
          historico_pagamentos: 'Percentual de duplicatas pagas em relação ao total',
          valor_medio_duplicatas: 'Valor médio das duplicatas (normalizado)',
          prazo_medio_pagamento: 'Prazo médio de pagamento (quanto menor, melhor)'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/score/batch - Calcular score em lote para múltiplos clientes (apenas ADMIN/ANALISTA)
router.post('/batch', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const { cliente_ids, weights } = req.body;

    if (!Array.isArray(cliente_ids) || cliente_ids.length === 0) {
      throw new AppError('Lista de IDs de clientes é obrigatória', 400);
    }

    if (cliente_ids.length > 100) {
      throw new AppError('Máximo de 100 clientes por lote', 400);
    }

    let validatedWeights;
    if (weights) {
      const { error } = weightsSchema.validate(weights);
      if (error) {
        throw new AppError(`Pesos inválidos: ${error.details[0].message}`, 400);
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
      message: `Processamento em lote concluído: ${results.length}/${cliente_ids.length} sucessos`
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/score/defaults - Obter pesos padrão do sistema
router.get('/defaults', async (req, res, next) => {
  try {
    const defaults = {
      weights: {
        pontuacao: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_PONTUACAO || '0.3'),
        historico: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_HISTORICO || '0.25'),
        valor: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_VALOR || '0.25'),
        prazo: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_PRAZO || '0.2')
      },
      score_range: {
        min: parseInt(process.env.SCORE_MIN || '0'),
        max: parseInt(process.env.SCORE_MAX || '1000')
      },
      classificacoes: {
        'EXCELENTE': '80-100 pontos',
        'BOM': '65-79 pontos',
        'REGULAR': '50-64 pontos',
        'RUIM': '30-49 pontos',
        'PÉSSIMO': '0-29 pontos'
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

export default router;