// Seed data utility
// Data seeding is now handled automatically by the in-memory database (memoryDb.ts).
// This file is kept for backwards compatibility only.

import { getMemoryDb, resetMemoryDb } from '../database/memoryDb';
import { logger } from './logger';

export function seedDatabase(): void {
  logger.info('Resetando e re-populando banco de dados em memoria...');
  resetMemoryDb();
  const db = getMemoryDb();
  logger.info(`Seed completo: ${db.count('clientes')} clientes carregados.`);
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
  logger.info('Processo de seed finalizado.');
}
