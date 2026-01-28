"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getConnection = exports.initializeDatabase = void 0;
const oracledb_1 = __importDefault(require("oracledb"));
const logger_1 = require("../utils/logger");
oracledb_1.default.outFormat = oracledb_1.default.OUT_FORMAT_OBJECT;
oracledb_1.default.autoCommit = true;
const dbConfig = {
    user: process.env.DB_USER || 'credito_user',
    password: process.env.DB_PASSWORD || 'credito_pass',
    connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 1521}/${process.env.DB_SERVICE_NAME || 'xe'}`,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 2,
    poolTimeout: 60,
    enableStatistics: true
};
let pool;
const initializeDatabase = async () => {
    try {
        pool = await oracledb_1.default.createPool(dbConfig);
        logger_1.logger.info('✅ Pool de conexões Oracle Database criado com sucesso');
        return pool;
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao conectar com Oracle Database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const getConnection = async () => {
    try {
        if (!pool) {
            await (0, exports.initializeDatabase)();
        }
        const connection = await pool.getConnection();
        return connection;
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao obter conexão:', error);
        throw error;
    }
};
exports.getConnection = getConnection;
const closeDatabase = async () => {
    try {
        if (pool) {
            await pool.close(10);
            logger_1.logger.info('✅ Pool de conexões fechado');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao fechar pool de conexões:', error);
        throw error;
    }
};
exports.closeDatabase = closeDatabase;
// Graceful shutdown
process.once('SIGTERM', exports.closeDatabase);
process.once('SIGINT', exports.closeDatabase);
