import { getDb } from '../database/connection';
import { LimiteCredito, Cliente } from '../models/types';
import { logger } from '../utils/logger';

export class LimitService {

  async getLimitesByClient(clienteId: number): Promise<LimiteCredito[]> {
    try {
      const db = getDb();
      const limites = db.query('limites_credito', (l: LimiteCredito) => l.cliente_id === clienteId);
      limites.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return limites;
    } catch (error) {
      logger.error('Erro ao buscar limites do cliente:', error);
      throw error;
    }
  }

  async createLimitRequest(
    clienteId: number,
    limiteSolicitado: number,
    motivo: string,
    _solicitadoPor: string
  ): Promise<LimiteCredito> {
    try {
      const db = getDb();
      const cliente = db.getById('clientes', clienteId);
      const limiteAtual = cliente ? cliente.limite_credito : 0;

      const newLimit = db.insert('limites_credito', {
        cliente_id: clienteId,
        limite_atual: limiteAtual,
        limite_solicitado: limiteSolicitado,
        motivo,
        status: 'PENDENTE',
        created_at: new Date(),
        updated_at: new Date()
      } as Omit<LimiteCredito, 'id'>);

      return newLimit;
    } catch (error) {
      logger.error('Erro ao criar solicitacao de limite:', error);
      throw error;
    }
  }

  async approveLimitRequest(
    limitId: number,
    limiteAprovado: number,
    aprovadoPor: string,
    observacoes?: string
  ): Promise<LimiteCredito> {
    try {
      const db = getDb();
      const existing = db.getById('limites_credito', limitId);
      if (!existing) {
        throw new Error('Solicitacao de limite nao encontrada');
      }

      const updatedMotivo = observacoes
        ? (existing.motivo || '') + ' - Obs: ' + observacoes
        : existing.motivo;

      const updated = db.update('limites_credito', limitId, {
        limite_aprovado: limiteAprovado,
        aprovado_por: aprovadoPor,
        data_aprovacao: new Date(),
        status: 'ATIVO',
        motivo: updatedMotivo,
        updated_at: new Date()
      } as Partial<LimiteCredito>);

      if (!updated) {
        throw new Error('Falha ao atualizar solicitacao de limite');
      }

      // Update the client's credit limit
      db.update('clientes', existing.cliente_id, {
        limite_credito: limiteAprovado,
        updated_at: new Date()
      } as Partial<Cliente>);

      return updated;
    } catch (error) {
      logger.error('Erro ao aprovar limite:', error);
      throw error;
    }
  }

  async rejectLimitRequest(
    limitId: number,
    motivo: string,
    rejeitadoPor: string
  ): Promise<LimiteCredito> {
    try {
      const db = getDb();
      const existing = db.getById('limites_credito', limitId);
      if (!existing) {
        throw new Error('Solicitacao de limite nao encontrada');
      }

      const updated = db.update('limites_credito', limitId, {
        status: 'REJEITADO',
        motivo,
        aprovado_por: rejeitadoPor,
        data_aprovacao: new Date(),
        updated_at: new Date()
      } as Partial<LimiteCredito>);

      if (!updated) {
        throw new Error('Falha ao rejeitar solicitacao de limite');
      }

      return updated;
    } catch (error) {
      logger.error('Erro ao rejeitar limite:', error);
      throw error;
    }
  }

  async getPendingLimits(
    page: number = 1,
    limit: number = 10
  ): Promise<{ limits: (LimiteCredito & { cliente_nome?: string; cpf_cnpj?: string })[]; total: number }> {
    try {
      const db = getDb();
      const pendingLimits = db.query('limites_credito', (l: LimiteCredito) => l.status === 'PENDENTE');

      // Sort by created_at descending
      pendingLimits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const total = pendingLimits.length;

      // Paginate
      const offset = (page - 1) * limit;
      const paginated = pendingLimits.slice(offset, offset + limit);

      // Enrich with client info
      const enriched = paginated.map(l => {
        const cliente = db.getById('clientes', l.cliente_id);
        return {
          ...l,
          cliente_nome: cliente?.nome,
          cpf_cnpj: cliente?.cpf_cnpj
        };
      });

      return { limits: enriched, total };
    } catch (error) {
      logger.error('Erro ao buscar limites pendentes:', error);
      throw error;
    }
  }

  async getLimitHistory(
    page: number = 1,
    limit: number = 10,
    clienteId?: number
  ): Promise<{ limits: (LimiteCredito & { cliente_nome?: string; cpf_cnpj?: string })[]; total: number }> {
    try {
      const db = getDb();
      let allLimits = db.getAll('limites_credito');

      if (clienteId) {
        allLimits = allLimits.filter(l => l.cliente_id === clienteId);
      }

      // Sort by updated_at descending
      allLimits.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      const total = allLimits.length;

      // Paginate
      const offset = (page - 1) * limit;
      const paginated = allLimits.slice(offset, offset + limit);

      // Enrich with client info
      const enriched = paginated.map(l => {
        const cliente = db.getById('clientes', l.cliente_id);
        return {
          ...l,
          cliente_nome: cliente?.nome,
          cpf_cnpj: cliente?.cpf_cnpj
        };
      });

      return { limits: enriched, total };
    } catch (error) {
      logger.error('Erro ao buscar historico de limites:', error);
      throw error;
    }
  }

  async getLimitById(limitId: number): Promise<(LimiteCredito & { cliente_nome?: string; cpf_cnpj?: string }) | null> {
    try {
      const db = getDb();
      const limite = db.getById('limites_credito', limitId);
      if (!limite) return null;

      const cliente = db.getById('clientes', limite.cliente_id);
      return {
        ...limite,
        cliente_nome: cliente?.nome,
        cpf_cnpj: cliente?.cpf_cnpj
      };
    } catch (error) {
      logger.error('Erro ao buscar limite por ID:', error);
      throw error;
    }
  }

  async getCurrentLimitByClient(clienteId: number): Promise<LimiteCredito | null> {
    try {
      const db = getDb();
      const activeLimits = db.query('limites_credito',
        (l: LimiteCredito) => l.cliente_id === clienteId && l.status === 'ATIVO'
      );

      if (activeLimits.length === 0) return null;

      // Sort by data_aprovacao descending and return the most recent
      activeLimits.sort((a, b) => {
        const dateA = a.data_aprovacao ? new Date(a.data_aprovacao).getTime() : 0;
        const dateB = b.data_aprovacao ? new Date(b.data_aprovacao).getTime() : 0;
        return dateB - dateA;
      });

      return activeLimits[0];
    } catch (error) {
      logger.error('Erro ao buscar limite atual do cliente:', error);
      throw error;
    }
  }
}
