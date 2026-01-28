"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new errorHandler_1.AppError('Token não fornecido', 401);
        }
        const [, token] = authHeader.split(' ');
        if (!token) {
            throw new errorHandler_1.AppError('Token mal formatado', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        // Mock do usuário baseado no token
        req.user = decoded.user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.AppError('Token inválido', 401);
        }
        throw error;
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Usuário não autenticado', 401);
        }
        if (!roles.includes(req.user.perfil)) {
            throw new errorHandler_1.AppError('Acesso negado - Perfil insuficiente', 403);
        }
        next();
    };
};
exports.requireRole = requireRole;
