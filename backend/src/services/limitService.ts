import { getConnection } from '../database/connection';
import { LimiteCredito } from '../models/types';
import { logger } from '../utils/logger';
import oracledb from 'oracledb';

export class LimitService {

  async getLimitesByClient(clienteId: number): Promise<LimiteCredito[]> {
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT * FROM limites_credito 
        WHERE cliente_id = :clienteId 
        ORDER BY created_at DESC
      `, { clienteId });
      
      return result.rows as LimiteCredito[];
      
    } catch (error) {
      logger.error('Erro ao buscar limites do cliente:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  async createLimitRequest(
    clienteId: number, 
    limiteSolicitado: number, 
    motivo: string, 
    solicitadoPor: string
  ): Promise<LimiteCredito> {
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        INSERT INTO limites_credito (
          cliente_id, limite_solicitado, motivo, status, created_at, updated_at
        ) VALUES (
          :clienteId, :limiteSolicitado, :motivo, 'PENDENTE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id INTO :id
      `, {
        clienteId,
        limiteSolicitado,
        motivo,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      });

      const newId = result.outBinds?.id?.[0];
      
      // Buscar o registro criado
      const newRecord = await connection.execute(`
        SELECT * FROM limites_credito WHERE id = :id
      `, { id: newId });
      
      return newRecord.rows?.[0] as LimiteCredito;
      
    } catch (error) {
      logger.error('Erro ao criar solicitação de limite:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  async approveLimitRequest(
    limitId: number,
    limiteAprovado: number,
    aprovadoPor: string,
    observacoes?: string
  ): Promise<LimiteCredito> {
    const connection = await getConnection();
    try {
      // Atualizar o registro de limite
      const result = await connection.execute(`
        UPDATE limites_credito 
        SET 
          limite_aprovado = :limiteAprovado,
          aprovado_por = :aprovadoPor,
          data_aprovacao = CURRENT_TIMESTAMP,
          status = 'ATIVO',
          motivo = CASE 
            WHEN :observacoes IS NOT NULL 
            THEN motivo || ' - Obs: ' || :observacoes
            ELSE motivo 
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :limitId
      `, {
        limitId,
        limiteAprovado,
        aprovadoPor,
        observacoes: observacoes || null
      });

      if (result.rowsAffected === 0) {
        throw new Error('Solicitação de limite não encontrada');
      }

      // Buscar os dados do limite atualizado
      const limitResult = await connection.execute(`
        SELECT * FROM limites_credito WHERE id = :limitId
      `, { limitId });

      const limite = limitResult.rows?.[0] as LimiteCredito;

      // Atualizar o limite atual do cliente
      await connection.execute(`
        UPDATE clientes 
        SET limite_credito = :limiteAprovado, updated_at = CURRENT_TIMESTAMP
        WHERE id = :clienteId
      `, {
        limiteAprovado,
        clienteId: limite.cliente_id
      });

      return limite;
      
    } catch (error) {
      logger.error('Erro ao aprovar limite:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  async rejectLimitRequest(limitId: number, motivo: string, rejeitadoPor: string): Promise<LimiteCredito> {
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        UPDATE limites_credito 
        SET 
          status = 'REJEITADO',
          motivo = :motivo,
          aprovado_por = :rejeitadoPor,
          data_aprovacao = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :limitId
      `, {
        limitId,
        motivo,
        rejeitadoPor
      });

      if (result.rowsAffected === 0) {
        throw new Error('Solicitação de limite não encontrada');
      }

      // Buscar o limite atualizado
      const limitResult = await connection.execute(`
        SELECT * FROM limites_credito WHERE id = :limitId
      `, { limitId });

      return limitResult.rows?.[0] as LimiteCredito;
      
    } catch (error) {
      logger.error('Erro ao rejeitar limite:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  async getPendingLimits(page: number = 1, limit: number = 10): Promise<{ limits: LimiteCredito[], total: number }> {
    const connection = await getConnection();
    try {
      const offset = (page - 1) * limit;
      
      // Query para buscar limites pendentes com dados do cliente
      const limitsQuery = `
        SELECT * FROM (
          SELECT lc.*, c.nome as cliente_nome, c.cpf_cnpj,
                 ROW_NUMBER() OVER (ORDER BY lc.created_at DESC) as rn
          FROM limites_credito lc
          INNER JOIN clientes c ON lc.cliente_id = c.id
          WHERE lc.status = 'PENDENTE'
        )
        WHERE rn BETWEEN :offset + 1 AND :offset + :limit
      `;
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM limites_credito 
        WHERE status = 'PENDENTE'
      `;
      
      const [limitsResult, countResult] = await Promise.all([
        connection.execute(limitsQuery, { offset, limit }),
        connection.execute(countQuery)
      ]);
      
      const limits = limitsResult.rows as LimiteCredito[];
      const total = (countResult.rows as any[])[0].TOTAL;
      
      return { limits, total };
      
    } catch (error) {
      logger.error('Erro ao buscar limites pendentes:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  async getLimitHistory(page: number = 1, limit: number = 10, clienteId?: number): Promise<{ limits: LimiteCredito[], total: number }> {
    const connection = await getConnection();
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      let binds: any = { offset, limit };
      
      if (clienteId) {
        whereClause += ' AND lc.cliente_id = :clienteId';
        binds.clienteId = clienteId;
      }
      
      // Query para buscar histórico com dados do cliente
      const historyQuery = `
        SELECT * FROM (
          SELECT lc.*, c.nome as cliente_nome, c.cpf_cnpj,
                 ROW_NUMBER() OVER (ORDER BY lc.updated_at DESC) as rn
          FROM limites_credito lc
          INNER JOIN clientes c ON lc.cliente_id = c.id
          ${whereClause}
        )
        WHERE rn BETWEEN :offset + 1 AND :offset + :limit
      `;
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM limites_credito lc
        ${whereClause.replace('lc.', '')}
      `;
      
      const [historyResult, countResult] = await Promise.all([
        connection.execute(historyQuery, binds),
        connection.execute(countQuery, binds)
      ]);
      
      const limits = historyResult.rows as LimiteCredito[];
      const total = (countResult.rows as any[])[0].TOTAL;
      
      return { limits, total };
      
    } catch (error) {
      logger.error('Erro ao buscar histórico de limites:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  async getLimitById(limitId: number): Promise<LimiteCredito | null> {
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT lc.*, c.nome as cliente_nome, c.cpf_cnpj
        FROM limites_credito lc
        INNER JOIN clientes c ON lc.cliente_id = c.id
        WHERE lc.id = :limitId
      `, { limitId });
      
      const limits = result.rows as LimiteCredito[];
      return limits.length > 0 ? limits[0] : null;
      
    } catch (error) {
      logger.error('Erro ao buscar limite por ID:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  async getCurrentLimitByClient(clienteId: number): Promise<LimiteCredito | null> {
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT * FROM limites_credito 
        WHERE cliente_id = :clienteId AND status = 'ATIVO'
        ORDER BY data_aprovacao DESC
        ROWNUM = 1
      `, { clienteId });
      
      const limits = result.rows as LimiteCredito[];
      return limits.length > 0 ? limits[0] : null;
      
    } catch (error) {
      logger.error('Erro ao buscar limite atual do cliente:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }
}