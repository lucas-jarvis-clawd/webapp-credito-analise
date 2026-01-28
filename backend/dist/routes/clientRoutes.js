"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const clientService_1 = require("../services/clientService");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
const clientService = new clientService_1.ClientService();
// Middleware de autenticação para todas as rotas
router.use(auth_1.authMiddleware);
// Schema de validação para filtros
const filtersSchema = joi_1.default.object({
    nome: joi_1.default.string().optional(),
    cpf_cnpj: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('ATIVO', 'INATIVO', 'BLOQUEADO').optional(),
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10)
});
// GET /api/clients - Buscar clientes com filtros e paginação
router.get('/', async (req, res, next) => {
    try {
        const { error, value } = filtersSchema.validate(req.query);
        if (error) {
            throw new errorHandler_1.AppError(error.details[0].message, 400);
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/clients/:id - Buscar cliente por ID
router.get('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        const client = await clientService.getClientById(id);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
        }
        res.json({
            success: true,
            data: client
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/clients/:id/duplicatas - Buscar duplicatas do cliente
router.get('/:id/duplicatas', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        // Verificar se cliente existe
        const client = await clientService.getClientById(id);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
        }
        const duplicatas = await clientService.getClientDuplicatas(id);
        res.json({
            success: true,
            data: duplicatas,
            total: duplicatas.length
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/clients/:id/pagamentos - Buscar pagamentos do cliente
router.get('/:id/pagamentos', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        // Verificar se cliente existe
        const client = await clientService.getClientById(id);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
        }
        const pagamentos = await clientService.getClientPagamentos(id);
        res.json({
            success: true,
            data: pagamentos,
            total: pagamentos.length
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/clients/:id/statistics - Estatísticas do cliente
router.get('/:id/statistics', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        // Verificar se cliente existe
        const client = await clientService.getClientById(id);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
        }
        const statistics = await clientService.getClientStatistics(id);
        res.json({
            success: true,
            data: statistics || {}
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/clients/:id/limit - Atualizar limite de crédito (apenas ADMIN e ANALISTA)
router.put('/:id/limit', (0, auth_1.requireRole)(['ADMIN', 'ANALISTA']), async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        const { limite } = req.body;
        if (!limite || limite < 0) {
            throw new errorHandler_1.AppError('Limite deve ser um valor positivo', 400);
        }
        // Verificar se cliente existe
        const client = await clientService.getClientById(id);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
        }
        const success = await clientService.updateClientLimit(id, limite);
        if (!success) {
            throw new errorHandler_1.AppError('Erro ao atualizar limite', 500);
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
