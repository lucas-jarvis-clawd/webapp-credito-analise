"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const limitService_1 = require("../services/limitService");
const clientService_1 = require("../services/clientService");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
const limitService = new limitService_1.LimitService();
const clientService = new clientService_1.ClientService();
// Middleware de autenticação para todas as rotas
router.use(auth_1.authMiddleware);
// Schemas de validação
const createLimitRequestSchema = joi_1.default.object({
    cliente_id: joi_1.default.number().integer().positive().required(),
    limite_solicitado: joi_1.default.number().min(0).required(),
    motivo: joi_1.default.string().min(10).max(500).required()
});
const approveLimitSchema = joi_1.default.object({
    limite_aprovado: joi_1.default.number().min(0).required(),
    observacoes: joi_1.default.string().max(500).optional()
});
const rejectLimitSchema = joi_1.default.object({
    motivo: joi_1.default.string().min(10).max(500).required()
});
// GET /api/limits/pending - Buscar solicitações pendentes (apenas ADMIN/ANALISTA)
router.get('/pending', (0, auth_1.requireRole)(['ADMIN', 'ANALISTA']), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (limit > 50) {
            throw new errorHandler_1.AppError('Limite máximo de 50 registros por página', 400);
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/limits/history - Histórico de limites
router.get('/history', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const clienteId = req.query.cliente_id ? parseInt(req.query.cliente_id) : undefined;
        if (limit > 50) {
            throw new errorHandler_1.AppError('Limite máximo de 50 registros por página', 400);
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/limits/:id - Buscar limite por ID
router.get('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        const limit = await limitService.getLimitById(id);
        if (!limit) {
            throw new errorHandler_1.AppError('Limite não encontrado', 404);
        }
        res.json({
            success: true,
            data: limit
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/limits/client/:clienteId - Buscar limites do cliente
router.get('/client/:clienteId', async (req, res, next) => {
    try {
        const clienteId = parseInt(req.params.clienteId);
        if (isNaN(clienteId)) {
            throw new errorHandler_1.AppError('ID do cliente inválido', 400);
        }
        // Verificar se cliente existe
        const client = await clientService.getClientById(clienteId);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
        }
        const limits = await limitService.getLimitesByClient(clienteId);
        res.json({
            success: true,
            data: limits,
            total: limits.length
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/limits/client/:clienteId/current - Buscar limite atual do cliente
router.get('/client/:clienteId/current', async (req, res, next) => {
    try {
        const clienteId = parseInt(req.params.clienteId);
        if (isNaN(clienteId)) {
            throw new errorHandler_1.AppError('ID do cliente inválido', 400);
        }
        // Verificar se cliente existe
        const client = await clientService.getClientById(clienteId);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/limits/request - Criar solicitação de limite
router.post('/request', async (req, res, next) => {
    try {
        const { error } = createLimitRequestSchema.validate(req.body);
        if (error) {
            throw new errorHandler_1.AppError(error.details[0].message, 400);
        }
        const { cliente_id, limite_solicitado, motivo } = req.body;
        // Verificar se cliente existe
        const client = await clientService.getClientById(cliente_id);
        if (!client) {
            throw new errorHandler_1.AppError('Cliente não encontrado', 404);
        }
        // Verificar se não há solicitação pendente
        const existingLimits = await limitService.getLimitesByClient(cliente_id);
        const hasPending = existingLimits.some(l => l.status === 'PENDENTE');
        if (hasPending) {
            throw new errorHandler_1.AppError('Cliente já possui solicitação de limite pendente', 400);
        }
        const newLimit = await limitService.createLimitRequest(cliente_id, limite_solicitado, motivo, req.user?.nome || 'Sistema');
        res.status(201).json({
            success: true,
            data: newLimit,
            message: 'Solicitação de limite criada com sucesso'
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/limits/:id/approve - Aprovar solicitação (apenas ADMIN/ANALISTA)
router.post('/:id/approve', (0, auth_1.requireRole)(['ADMIN', 'ANALISTA']), async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        const { error } = approveLimitSchema.validate(req.body);
        if (error) {
            throw new errorHandler_1.AppError(error.details[0].message, 400);
        }
        const { limite_aprovado, observacoes } = req.body;
        // Verificar se limite existe e está pendente
        const existingLimit = await limitService.getLimitById(id);
        if (!existingLimit) {
            throw new errorHandler_1.AppError('Solicitação não encontrada', 404);
        }
        if (existingLimit.status !== 'PENDENTE') {
            throw new errorHandler_1.AppError('Solicitação não está pendente', 400);
        }
        const approvedLimit = await limitService.approveLimitRequest(id, limite_aprovado, req.user?.nome || 'Sistema', observacoes);
        res.json({
            success: true,
            data: approvedLimit,
            message: 'Limite aprovado com sucesso'
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/limits/:id/reject - Rejeitar solicitação (apenas ADMIN/ANALISTA)
router.post('/:id/reject', (0, auth_1.requireRole)(['ADMIN', 'ANALISTA']), async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorHandler_1.AppError('ID inválido', 400);
        }
        const { error } = rejectLimitSchema.validate(req.body);
        if (error) {
            throw new errorHandler_1.AppError(error.details[0].message, 400);
        }
        const { motivo } = req.body;
        // Verificar se limite existe e está pendente
        const existingLimit = await limitService.getLimitById(id);
        if (!existingLimit) {
            throw new errorHandler_1.AppError('Solicitação não encontrada', 404);
        }
        if (existingLimit.status !== 'PENDENTE') {
            throw new errorHandler_1.AppError('Solicitação não está pendente', 400);
        }
        const rejectedLimit = await limitService.rejectLimitRequest(id, motivo, req.user?.nome || 'Sistema');
        res.json({
            success: true,
            data: rejectedLimit,
            message: 'Limite rejeitado'
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/limits/stats/dashboard - Estatísticas para dashboard (apenas ADMIN/ANALISTA)
router.get('/stats/dashboard', (0, auth_1.requireRole)(['ADMIN', 'ANALISTA']), async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
