import express from 'express';
import Joi from 'joi';
import { getConnection } from '../database/connection';
import { authMiddleware, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Schema de validação para configurações
const configSchema = Joi.object({
  chave: Joi.string().required(),
  valor: Joi.string().required(),
  descricao: Joi.string().optional(),
  tipo: Joi.string().valid('STRING', 'NUMBER', 'BOOLEAN', 'JSON').default('STRING')
});

const scoreWeightsSchema = Joi.object({
  pontuacao: Joi.number().min(0).max(1).required(),
  historico: Joi.number().min(0).max(1).required(),
  valor: Joi.number().min(0).max(1).required(),
  prazo: Joi.number().min(0).max(1).required()
}).custom((value) => {
  const sum = value.pontuacao + value.historico + value.valor + value.prazo;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error('A soma dos pesos deve ser igual a 1.0');
  }
  return value;
});

// GET /api/config - Listar todas as configurações (apenas ADMIN)
router.get('/', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT * FROM configuracoes_sistema 
        ORDER BY categoria, chave
      `);

      const configs = result.rows || [];

      res.json({
        success: true,
        data: configs
      });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/config/scoring - Obter configurações de scoring
router.get('/scoring', requireRole(['ADMIN', 'ANALISTA']), async (req, res, next) => {
  try {
    const connection = await getConnection();
    try {
      const result = await connection.execute(`
        SELECT * FROM configuracoes_sistema 
        WHERE categoria = 'SCORING'
        ORDER BY chave
      `);

      const configs = result.rows || [];
      
      // Formatar as configurações de scoring
      const scoringConfig = {
        pesos: {
          pontuacao: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_PONTUACAO || '0.3'),
          historico: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_HISTORICO || '0.25'),
          valor: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_VALOR || '0.25'),
          prazo: parseFloat(process.env.SCORE_DEFAULT_WEIGHTS_PRAZO || '0.2')
        },
        limites: {
          score_min: parseInt(process.env.SCORE_MIN || '0'),
          score_max: parseInt(process.env.SCORE_MAX || '1000')
        },
        classificacoes: {
          excelente: { min: 80, max: 100, cor: '#4CAF50' },
          bom: { min: 65, max: 79, cor: '#8BC34A' },
          regular: { min: 50, max: 64, cor: '#FFC107' },
          ruim: { min: 30, max: 49, cor: '#FF9800' },
          pessimo: { min: 0, max: 29, cor: '#F44336' }
        }
      };

      // Sobrescrever com valores do banco se existirem
      configs.forEach((config: any) => {
        switch (config.CHAVE) {
          case 'peso_pontuacao':
            scoringConfig.pesos.pontuacao = parseFloat(config.VALOR);
            break;
          case 'peso_historico':
            scoringConfig.pesos.historico = parseFloat(config.VALOR);
            break;
          case 'peso_valor':
            scoringConfig.pesos.valor = parseFloat(config.VALOR);
            break;
          case 'peso_prazo':
            scoringConfig.pesos.prazo = parseFloat(config.VALOR);
            break;
          case 'score_min':
            scoringConfig.limites.score_min = parseInt(config.VALOR);
            break;
          case 'score_max':
            scoringConfig.limites.score_max = parseInt(config.VALOR);
            break;
        }
      });

      res.json({
        success: true,
        data: scoringConfig
      });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
});

// PUT /api/config/scoring/weights - Atualizar pesos do scoring (apenas ADMIN)
router.put('/scoring/weights', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { error } = scoreWeightsSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { pontuacao, historico, valor, prazo } = req.body;
    const connection = await getConnection();

    try {
      // Atualizar ou inserir os pesos
      const queries = [
        {
          chave: 'peso_pontuacao',
          valor: pontuacao.toString(),
          descricao: 'Peso da pontuação interna no cálculo do score'
        },
        {
          chave: 'peso_historico',
          valor: historico.toString(),
          descricao: 'Peso do histórico de pagamentos no cálculo do score'
        },
        {
          chave: 'peso_valor',
          valor: valor.toString(),
          descricao: 'Peso do valor médio das duplicatas no cálculo do score'
        },
        {
          chave: 'peso_prazo',
          valor: prazo.toString(),
          descricao: 'Peso do prazo médio de pagamento no cálculo do score'
        }
      ];

      for (const config of queries) {
        await connection.execute(`
          MERGE INTO configuracoes_sistema cs
          USING (SELECT :chave as chave, :valor as valor, :descricao as descricao FROM dual) src
          ON (cs.chave = src.chave AND cs.categoria = 'SCORING')
          WHEN MATCHED THEN
            UPDATE SET valor = src.valor, descricao = src.descricao, updated_at = CURRENT_TIMESTAMP
          WHEN NOT MATCHED THEN
            INSERT (categoria, chave, valor, descricao, tipo, created_at, updated_at)
            VALUES ('SCORING', src.chave, src.valor, src.descricao, 'NUMBER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, config);
      }

      logger.info(`Pesos de scoring atualizados por: ${req.user?.nome}`, { 
        pesos: { pontuacao, historico, valor, prazo }
      });

      res.json({
        success: true,
        data: { pontuacao, historico, valor, prazo },
        message: 'Pesos de scoring atualizados com sucesso'
      });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/config/:chave - Obter configuração específica
router.get('/:chave', async (req, res, next) => {
  try {
    const { chave } = req.params;
    const connection = await getConnection();

    try {
      const result = await connection.execute(`
        SELECT * FROM configuracoes_sistema 
        WHERE chave = :chave
      `, { chave });

      const configs = result.rows || [];
      
      if (configs.length === 0) {
        throw new AppError('Configuração não encontrada', 404);
      }

      res.json({
        success: true,
        data: configs[0]
      });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/config - Criar nova configuração (apenas ADMIN)
router.post('/', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { error } = configSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { chave, valor, descricao, tipo } = req.body;
    const connection = await getConnection();

    try {
      const result = await connection.execute(`
        INSERT INTO configuracoes_sistema (
          categoria, chave, valor, descricao, tipo, created_at, updated_at
        ) VALUES (
          'GERAL', :chave, :valor, :descricao, :tipo, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id INTO :id
      `, {
        chave,
        valor,
        descricao: descricao || null,
        tipo: tipo || 'STRING',
        id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
      });

      const newId = result.outBinds?.id?.[0];

      logger.info(`Nova configuração criada por: ${req.user?.nome}`, { 
        chave, valor, tipo 
      });

      res.status(201).json({
        success: true,
        data: { id: newId, chave, valor, descricao, tipo },
        message: 'Configuração criada com sucesso'
      });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
});

// PUT /api/config/:chave - Atualizar configuração (apenas ADMIN)
router.put('/:chave', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { chave } = req.params;
    const { valor, descricao } = req.body;

    if (!valor) {
      throw new AppError('Valor é obrigatório', 400);
    }

    const connection = await getConnection();

    try {
      const result = await connection.execute(`
        UPDATE configuracoes_sistema 
        SET valor = :valor, 
            descricao = COALESCE(:descricao, descricao),
            updated_at = CURRENT_TIMESTAMP
        WHERE chave = :chave
      `, {
        chave,
        valor,
        descricao: descricao || null
      });

      if (result.rowsAffected === 0) {
        throw new AppError('Configuração não encontrada', 404);
      }

      logger.info(`Configuração atualizada por: ${req.user?.nome}`, { 
        chave, valor 
      });

      res.json({
        success: true,
        data: { chave, valor, descricao },
        message: 'Configuração atualizada com sucesso'
      });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/config/:chave - Deletar configuração (apenas ADMIN)
router.delete('/:chave', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { chave } = req.params;
    const connection = await getConnection();

    try {
      const result = await connection.execute(`
        DELETE FROM configuracoes_sistema 
        WHERE chave = :chave
      `, { chave });

      if (result.rowsAffected === 0) {
        throw new AppError('Configuração não encontrada', 404);
      }

      logger.info(`Configuração deletada por: ${req.user?.nome}`, { chave });

      res.json({
        success: true,
        message: 'Configuração deletada com sucesso'
      });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
});

export default router;