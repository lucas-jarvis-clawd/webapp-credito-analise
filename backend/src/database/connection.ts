import oracledb from 'oracledb';
import { logger } from '../utils/logger';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

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

let pool: oracledb.Pool;

export const initializeDatabase = async () => {
  try {
    pool = await oracledb.createPool(dbConfig);
    logger.info('✅ Pool de conexões Oracle Database criado com sucesso');
    return pool;
  } catch (error) {
    logger.error('❌ Erro ao conectar com Oracle Database:', error);
    throw error;
  }
};

export const getConnection = async () => {
  try {
    if (!pool) {
      await initializeDatabase();
    }
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    logger.error('❌ Erro ao obter conexão:', error);
    throw error;
  }
};

export const closeDatabase = async () => {
  try {
    if (pool) {
      await pool.close(10);
      logger.info('✅ Pool de conexões fechado');
    }
  } catch (error) {
    logger.error('❌ Erro ao fechar pool de conexões:', error);
    throw error;
  }
};

// Graceful shutdown
process.once('SIGTERM', closeDatabase);
process.once('SIGINT', closeDatabase);