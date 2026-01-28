"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    const { statusCode = 500, message } = err;
    logger_1.logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
