import { logger } from '../utils/logger';
import { MemoryDatabase, getMemoryDb } from './memoryDb';

let db: MemoryDatabase | null = null;

export const initializeDatabase = async (): Promise<MemoryDatabase> => {
  try {
    db = getMemoryDb();
    logger.info('Banco de dados em memoria inicializado com sucesso');
    return db;
  } catch (error) {
    logger.error('Erro ao inicializar banco de dados em memoria:', error);
    throw error;
  }
};

export const getDb = (): MemoryDatabase => {
  if (!db) {
    db = getMemoryDb();
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  logger.info('Banco de dados em memoria encerrado');
  db = null;
};
