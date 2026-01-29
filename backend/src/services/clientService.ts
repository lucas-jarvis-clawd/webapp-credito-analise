import { getDb } from '../database/connection';
import { Cliente, FDuplicata, FPagamento } from '../models/types';
import { logger } from '../utils/logger';

export class ClientService {

  async getClients(
    page: number = 1,
    limit: number = 10,
    filters?: { nome?: string; cpf_cnpj?: string; status?: string }
  ): Promise<{ clients: Cliente[]; total: number }> {
    try {
      const db = getDb();
      let clients = db.getAll('clientes');

      // Apply filters
      if (filters?.nome) {
        const nomeUpper = filters.nome.toUpperCase();
        clients = clients.filter(c => c.nome.toUpperCase().includes(nomeUpper));
      }

      if (filters?.cpf_cnpj) {
        clients = clients.filter(c => c.cpf_cnpj === filters.cpf_cnpj);
      }

      if (filters?.status) {
        clients = clients.filter(c => c.status === filters.status);
      }

      // Sort by name
      clients.sort((a, b) => a.nome.localeCompare(b.nome));

      const total = clients.length;

      // Paginate
      const offset = (page - 1) * limit;
      const paginated = clients.slice(offset, offset + limit);

      return { clients: paginated, total };
    } catch (error) {
      logger.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }

  async getClientById(id: number): Promise<Cliente | null> {
    try {
      const db = getDb();
      const client = db.getById('clientes', id);
      return client || null;
    } catch (error) {
      logger.error('Erro ao buscar cliente por ID:', error);
      throw error;
    }
  }

  async getClientDuplicatas(clienteId: number): Promise<FDuplicata[]> {
    try {
      const db = getDb();
      const duplicatas = db.query('f_duplicatas', (d: FDuplicata) => d.cliente_id === clienteId);
      // Sort by emission date descending
      duplicatas.sort((a, b) => new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime());
      return duplicatas;
    } catch (error) {
      logger.error('Erro ao buscar duplicatas do cliente:', error);
      throw error;
    }
  }

  async getClientPagamentos(clienteId: number): Promise<FPagamento[]> {
    try {
      const db = getDb();
      // First get all duplicata IDs for this client
      const duplicatas = db.query('f_duplicatas', (d: FDuplicata) => d.cliente_id === clienteId);
      const duplicataIds = new Set(duplicatas.map(d => d.id));

      // Then get payments matching those duplicatas
      const pagamentos = db.query('f_pagamentos', (p: FPagamento) => duplicataIds.has(p.duplicata_id));
      // Sort by payment date descending
      pagamentos.sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime());
      return pagamentos;
    } catch (error) {
      logger.error('Erro ao buscar pagamentos do cliente:', error);
      throw error;
    }
  }

  async getClientStatistics(clienteId: number): Promise<{
    total_duplicatas: number;
    duplicatas_pagas: number;
    duplicatas_vencidas: number;
    duplicatas_abertas: number;
    valor_medio_duplicatas: number;
    valor_total_duplicatas: number;
    total_pagamentos: number;
    valor_medio_pagamentos: number;
    prazo_medio_pagamento_dias: number;
  }> {
    try {
      const db = getDb();
      const duplicatas = db.query('f_duplicatas', (d: FDuplicata) => d.cliente_id === clienteId);

      if (duplicatas.length === 0) {
        return {
          total_duplicatas: 0,
          duplicatas_pagas: 0,
          duplicatas_vencidas: 0,
          duplicatas_abertas: 0,
          valor_medio_duplicatas: 0,
          valor_total_duplicatas: 0,
          total_pagamentos: 0,
          valor_medio_pagamentos: 0,
          prazo_medio_pagamento_dias: 0
        };
      }

      const duplicatasPagas = duplicatas.filter(d => d.status === 'PAGA');
      const duplicatasVencidas = duplicatas.filter(d => d.status === 'VENCIDA');
      const duplicatasAbertas = duplicatas.filter(d => d.status === 'ABERTA');
      const valorTotal = duplicatas.reduce((sum, d) => sum + d.valor, 0);
      const valorMedio = valorTotal / duplicatas.length;

      // Get payments
      const duplicataIds = new Set(duplicatas.map(d => d.id));
      const pagamentos = db.query('f_pagamentos', (p: FPagamento) => duplicataIds.has(p.duplicata_id));

      const valorMedioPagamentos = pagamentos.length > 0
        ? pagamentos.reduce((sum, p) => sum + p.valor_pago, 0) / pagamentos.length
        : 0;

      // Calculate average payment delay
      let prazoMedio = 0;
      if (pagamentos.length > 0) {
        let totalDias = 0;
        let count = 0;
        for (const pag of pagamentos) {
          const dup = duplicatas.find(d => d.id === pag.duplicata_id);
          if (dup) {
            const diffMs = new Date(pag.data_pagamento).getTime() - new Date(dup.data_vencimento).getTime();
            totalDias += diffMs / 86400000;
            count++;
          }
        }
        prazoMedio = count > 0 ? Math.round((totalDias / count) * 10) / 10 : 0;
      }

      return {
        total_duplicatas: duplicatas.length,
        duplicatas_pagas: duplicatasPagas.length,
        duplicatas_vencidas: duplicatasVencidas.length,
        duplicatas_abertas: duplicatasAbertas.length,
        valor_medio_duplicatas: Math.round(valorMedio * 100) / 100,
        valor_total_duplicatas: Math.round(valorTotal * 100) / 100,
        total_pagamentos: pagamentos.length,
        valor_medio_pagamentos: Math.round(valorMedioPagamentos * 100) / 100,
        prazo_medio_pagamento_dias: prazoMedio
      };
    } catch (error) {
      logger.error('Erro ao buscar estatisticas do cliente:', error);
      throw error;
    }
  }

  async updateClientLimit(clienteId: number, novoLimite: number): Promise<boolean> {
    try {
      const db = getDb();
      const updated = db.update('clientes', clienteId, {
        limite_credito: novoLimite,
        updated_at: new Date()
      } as Partial<Cliente>);
      return updated !== undefined;
    } catch (error) {
      logger.error('Erro ao atualizar limite do cliente:', error);
      throw error;
    }
  }
}
