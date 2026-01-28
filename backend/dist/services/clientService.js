"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class ClientService {
    async getClients(page = 1, limit = 10, filters) {
        const connection = await (0, connection_1.getConnection)();
        try {
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE 1=1';
            let binds = {};
            if (filters?.nome) {
                whereClause += ' AND UPPER(nome) LIKE UPPER(:nome)';
                binds.nome = `%${filters.nome}%`;
            }
            if (filters?.cpf_cnpj) {
                whereClause += ' AND cpf_cnpj = :cpf_cnpj';
                binds.cpf_cnpj = filters.cpf_cnpj;
            }
            if (filters?.status) {
                whereClause += ' AND status = :status';
                binds.status = filters.status;
            }
            // Query para buscar clientes com paginação
            const clientsQuery = `
        SELECT * FROM (
          SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.nome) as rn
          FROM clientes c
          ${whereClause}
        )
        WHERE rn BETWEEN :offset + 1 AND :offset + :limit
      `;
            // Query para contar total
            const countQuery = `
        SELECT COUNT(*) as total
        FROM clientes c
        ${whereClause}
      `;
            binds.offset = offset;
            binds.limit = limit;
            const [clientsResult, countResult] = await Promise.all([
                connection.execute(clientsQuery, binds),
                connection.execute(countQuery, binds)
            ]);
            const clients = clientsResult.rows;
            const total = countResult.rows[0].TOTAL;
            return { clients, total };
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar clientes:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
    async getClientById(id) {
        const connection = await (0, connection_1.getConnection)();
        try {
            const result = await connection.execute('SELECT * FROM clientes WHERE id = :id', { id });
            const clients = result.rows;
            return clients.length > 0 ? clients[0] : null;
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar cliente por ID:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
    async getClientDuplicatas(clienteId) {
        const connection = await (0, connection_1.getConnection)();
        try {
            const result = await connection.execute(`
        SELECT * FROM f_duplicatas 
        WHERE cliente_id = :clienteId 
        ORDER BY data_emissao DESC
      `, { clienteId });
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar duplicatas do cliente:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
    async getClientPagamentos(clienteId) {
        const connection = await (0, connection_1.getConnection)();
        try {
            const result = await connection.execute(`
        SELECT p.* FROM f_pagamentos p
        INNER JOIN f_duplicatas d ON p.duplicata_id = d.id
        WHERE d.cliente_id = :clienteId
        ORDER BY p.data_pagamento DESC
      `, { clienteId });
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar pagamentos do cliente:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
    async getClientStatistics(clienteId) {
        const connection = await (0, connection_1.getConnection)();
        try {
            const result = await connection.execute(`
        SELECT 
          COUNT(d.id) as total_duplicatas,
          SUM(CASE WHEN d.status = 'PAGA' THEN 1 ELSE 0 END) as duplicatas_pagas,
          SUM(CASE WHEN d.status = 'VENCIDA' THEN 1 ELSE 0 END) as duplicatas_vencidas,
          AVG(d.valor) as valor_medio_duplicatas,
          SUM(d.valor) as valor_total_duplicatas,
          COUNT(p.id) as total_pagamentos,
          AVG(p.valor_pago) as valor_medio_pagamentos,
          AVG(p.data_pagamento - d.data_vencimento) as prazo_medio_pagamento_dias
        FROM f_duplicatas d
        LEFT JOIN f_pagamentos p ON d.id = p.duplicata_id
        WHERE d.cliente_id = :clienteId
      `, { clienteId });
            return result.rows && result.rows.length > 0 ? result.rows[0] : null;
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar estatísticas do cliente:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
    async updateClientLimit(clienteId, novoLimite) {
        const connection = await (0, connection_1.getConnection)();
        try {
            const result = await connection.execute(`
        UPDATE clientes 
        SET limite_credito = :novoLimite, updated_at = CURRENT_TIMESTAMP
        WHERE id = :clienteId
      `, { novoLimite, clienteId });
            return result.rowsAffected !== undefined && result.rowsAffected > 0;
        }
        catch (error) {
            logger_1.logger.error('Erro ao atualizar limite do cliente:', error);
            throw error;
        }
        finally {
            await connection.close();
        }
    }
}
exports.ClientService = ClientService;
