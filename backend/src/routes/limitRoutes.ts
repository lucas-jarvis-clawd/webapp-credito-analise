import express from 'express';
import Joi from 'joi';
import { LimitService } from '../services/limitService';
import { ClientService } from '../services/clientService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();
const limitService = new LimitService();
const clientService = new ClientService();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Schemas de validação
const createLimitRequestSchema = Joi.object({
  cliente_id: Joi.number().integer().positive().required(),
  limite_solicitado: Joi.number().min(0).required(),
  motivo: Joi.string().min(10).max(500).required()
});

const approveLimitSchema = Joi.object({
  limite_aprovado: Joi.number().min(0).required(),
  observacoes: Joi.string().max(500).optional()
});

const rejectLimitSchema = Joi.object({
  motivo: Joi.string().min(10).max(500).required()
});

/**
 * @swagger
 * /limits/pending:
 *   get:
 *     summary: Listar solicitacoes de limite pendentes (ADMIN/ANALISTA)
 *     tags: [Limites de Credito]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista paginada de limites pendentes
 */
router.get('/pending', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (limit > 50) {
      throw new AppError('Limite máximo de 50 registros por página', 400);
    }

    const result = await limitService.getPendingLimits(page, limit);

    res.json({
      success: true,
      data: result.limits,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/limits/history - Histórico de limites
router.get('/history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const clienteId = req.query.cliente_id ? parseInt(req.query.cliente_id as string) : undefined;

    if (limit > 50) {
      throw new AppError('Limite máximo de 50 registros por página', 400);
    }

    // Se for consultor, só pode ver seus próprios clientes (implementar lógica se necessário)
    const result = await limitService.getLimitHistory(page, limit, clienteId);

    res.json({
      success: true,
      data: result.limits,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/limits/:id - Buscar limite por ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    const limit = await limitService.getLimitById(id);
    if (!limit) {
      throw new AppError('Limite não encontrado', 404);
    }

    res.json({
      success: true,
      data: limit
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/limits/client/:clienteId - Buscar limites do cliente
router.get('/client/:clienteId', async (req, res, next) => {
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

    const limits = await limitService.getLimitesByClient(clienteId);

    res.json({
      success: true,
      data: limits,
      total: limits.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/limits/client/:clienteId/current - Buscar limite atual do cliente
router.get('/client/:clienteId/current', async (req, res, next) => {
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

    const currentLimit = await limitService.getCurrentLimitByClient(clienteId);

    res.json({
      success: true,
      data: {
        cliente_id: clienteId,
        nome_cliente: client.nome,
        limite_atual: client.limite_credito,
        limite_registro: currentLimit,
        tem_limite_ativo: currentLimit !== null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /limits/request:
 *   post:
 *     summary: Criar solicitacao de limite de credito
 *     tags: [Limites de Credito]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cliente_id, limite_solicitado, motivo]
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               limite_solicitado:
 *                 type: number
 *               motivo:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       201:
 *         description: Solicitacao criada
 *       400:
 *         description: Dados invalidos ou solicitacao pendente existente
 */
router.post('/request', async (req, res, next) => {
  try {
    const { error } = createLimitRequestSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { cliente_id, limite_solicitado, motivo } = req.body;

    // Verificar se cliente existe
    const client = await clientService.getClientById(cliente_id);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Verificar se não há solicitação pendente
    const existingLimits = await limitService.getLimitesByClient(cliente_id);
    const hasPending = existingLimits.some(l => l.status === 'PENDENTE');
    
    if (hasPending) {
      throw new AppError('Cliente já possui solicitação de limite pendente', 400);
    }

    const newLimit = await limitService.createLimitRequest(
      cliente_id,
      limite_solicitado,
      motivo,
      req.user?.nome || 'Sistema'
    );

    res.status(201).json({
      success: true,
      data: newLimit,
      message: 'Solicitação de limite criada com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /limits/{id}/approve:
 *   post:
 *     summary: Aprovar solicitacao de limite (ADMIN/ANALISTA)
 *     tags: [Limites de Credito]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [limite_aprovado]
 *             properties:
 *               limite_aprovado:
 *                 type: number
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Limite aprovado
 *       404:
 *         description: Solicitacao nao encontrada
 */
router.post('/:id/approve', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    const { error } = approveLimitSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { limite_aprovado, observacoes } = req.body;

    // Verificar se limite existe e está pendente
    const existingLimit = await limitService.getLimitById(id);
    if (!existingLimit) {
      throw new AppError('Solicitação não encontrada', 404);
    }

    if (existingLimit.status !== 'PENDENTE') {
      throw new AppError('Solicitação não está pendente', 400);
    }

    const approvedLimit = await limitService.approveLimitRequest(
      id,
      limite_aprovado,
      req.user?.nome || 'Sistema',
      observacoes
    );

    res.json({
      success: true,
      data: approvedLimit,
      message: 'Limite aprovado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /limits/{id}/reject:
 *   post:
 *     summary: Rejeitar solicitacao de limite (ADMIN/ANALISTA)
 *     tags: [Limites de Credito]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [motivo]
 *             properties:
 *               motivo:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       200:
 *         description: Limite rejeitado
 *       404:
 *         description: Solicitacao nao encontrada
 */
router.post('/:id/reject', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    const { error } = rejectLimitSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { motivo } = req.body;

    // Verificar se limite existe e está pendente
    const existingLimit = await limitService.getLimitById(id);
    if (!existingLimit) {
      throw new AppError('Solicitação não encontrada', 404);
    }

    if (existingLimit.status !== 'PENDENTE') {
      throw new AppError('Solicitação não está pendente', 400);
    }

    const rejectedLimit = await limitService.rejectLimitRequest(
      id,
      motivo,
      req.user?.nome || 'Sistema'
    );

    res.json({
      success: true,
      data: rejectedLimit,
      message: 'Limite rejeitado'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/limits/stats/dashboard - Estatísticas para dashboard (apenas ADMIN/ANALISTA)
router.get('/stats/dashboard', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    // Buscar estatísticas básicas
    const [pendingResult, historyResult] = await Promise.all([
      limitService.getPendingLimits(1, 1),
      limitService.getLimitHistory(1, 1)
    ]);

    res.json({
      success: true,
      data: {
        solicitacoes_pendentes: pendingResult.total,
        total_historico: historyResult.total,
        resumo_status: {
          pendentes: pendingResult.total,
          processadas: historyResult.total - pendingResult.total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;