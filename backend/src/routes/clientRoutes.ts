import express from 'express';
import Joi from 'joi';
import { ClientService } from '../services/clientService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();
const clientService = new ClientService();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Schema de validação para filtros
const filtersSchema = Joi.object({
  nome: Joi.string().optional(),
  cpf_cnpj: Joi.string().optional(),
  status: Joi.string().valid('ATIVO', 'INATIVO', 'BLOQUEADO').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Listar clientes com filtros e paginacao
 *     tags: [Clientes]
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
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ATIVO, INATIVO, BLOQUEADO]
 *     responses:
 *       200:
 *         description: Lista paginada de clientes
 */
router.get('/', async (req, res, next) => {
  try {
    const { error, value } = filtersSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { page, limit, ...filters } = value;
    const result = await clientService.getClients(page, limit, filters);

    res.json({
      success: true,
      data: result.clients,
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

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Buscar cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Cliente nao encontrado
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    const client = await clientService.getClientById(id);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /clients/{id}/duplicatas:
 *   get:
 *     summary: Buscar duplicatas (faturas) do cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de duplicatas
 *       404:
 *         description: Cliente nao encontrado
 */
router.get('/:id/duplicatas', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(id);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const duplicatas = await clientService.getClientDuplicatas(id);

    res.json({
      success: true,
      data: duplicatas,
      total: duplicatas.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /clients/{id}/pagamentos:
 *   get:
 *     summary: Buscar pagamentos do cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *       404:
 *         description: Cliente nao encontrado
 */
router.get('/:id/pagamentos', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(id);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const pagamentos = await clientService.getClientPagamentos(id);

    res.json({
      success: true,
      data: pagamentos,
      total: pagamentos.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /clients/{id}/statistics:
 *   get:
 *     summary: Estatisticas financeiras do cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estatisticas de duplicatas e pagamentos
 *       404:
 *         description: Cliente nao encontrado
 */
router.get('/:id/statistics', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(id);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const statistics = await clientService.getClientStatistics(id);

    res.json({
      success: true,
      data: statistics || {}
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id/limit - Atualizar limite de crédito (apenas ADMIN e ANALISTA)
router.put('/:id/limit', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    const { limite } = req.body;
    if (!limite || limite < 0) {
      throw new AppError('Limite deve ser um valor positivo', 400);
    }

    // Verificar se cliente existe
    const client = await clientService.getClientById(id);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const success = await clientService.updateClientLimit(id, limite);
    if (!success) {
      throw new AppError('Erro ao atualizar limite', 500);
    }

    res.json({
      success: true,
      message: 'Limite de crédito atualizado com sucesso',
      data: {
        cliente_id: id,
        limite_anterior: client.limite_credito,
        limite_novo: limite,
        atualizado_por: req.user?.nome
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;