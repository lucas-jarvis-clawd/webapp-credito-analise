"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
// Importação das rotas
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const scoreRoutes_1 = __importDefault(require("./routes/scoreRoutes"));
const limitRoutes_1 = __importDefault(require("./routes/limitRoutes"));
const configRoutes_1 = __importDefault(require("./routes/configRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares globais
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Middleware de logging
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});
// Rotas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/clients', clientRoutes_1.default);
app.use('/api/score', scoreRoutes_1.default);
app.use('/api/limits', limitRoutes_1.default);
app.use('/api/config', configRoutes_1.default);
// Rota de health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// Middleware de tratamento de erros
app.use(errorHandler_1.errorHandler);
// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl
    });
});
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger_1.logger.info(`📊 Sistema de análise de crédito iniciado`);
});
exports.default = app;
