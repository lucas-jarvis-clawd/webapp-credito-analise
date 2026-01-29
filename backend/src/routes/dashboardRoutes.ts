import express from 'express';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { ScoreService } from '../services/scoreService';
import { Cliente, LimiteCredito, ScoreHistorico } from '../models/types';
import { logger } from '../utils/logger';

const router = express.Router();
const scoreService = new ScoreService();

// Middleware de autenticacao para todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Estatisticas do dashboard (clientes, scores, limites)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Estatisticas consolidadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalClients:
 *                       type: integer
 *                     activeClients:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     riskDistribution:
 *                       type: object
 *                     totalPendingLimits:
 *                       type: integer
 *                     clients:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Client'
 */
router.get('/stats', async (req, res, next) => {
  try {
    const db = getDb();

    // Basic client stats
    const allClients = db.getAll('clientes');
    const totalClients = allClients.length;
    const activeClients = allClients.filter((c: Cliente) => c.status === 'ATIVO').length;

    // Score distribution - get latest score per client
    const allScores = db.getAll('score_historico');
    const latestScoresByClient = new Map<number, ScoreHistorico>();
    for (const s of allScores) {
      const existing = latestScoresByClient.get(s.cliente_id);
      if (!existing || new Date(s.data_calculo).getTime() > new Date(existing.data_calculo).getTime()) {
        latestScoresByClient.set(s.cliente_id, s);
      }
    }

    // Compute average score
    const scoreValues = Array.from(latestScoresByClient.values()).map(s => s.score_final);
    const averageScore = scoreValues.length > 0
      ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
      : 0;

    // Risk distribution
    const riskDistribution: Record<string, number> = {
      'EXCELENTE': 0,
      'BOM': 0,
      'REGULAR': 0,
      'RUIM': 0,
      'PESSIMO': 0
    };
    for (const s of latestScoresByClient.values()) {
      if (riskDistribution[s.classificacao] !== undefined) {
        riskDistribution[s.classificacao]++;
      }
    }

    // Limits stats
    const allLimits = db.getAll('limites_credito');
    const totalPendingLimits = allLimits.filter((l: LimiteCredito) => l.status === 'PENDENTE').length;

    // Approved/rejected this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalApprovedThisMonth = allLimits.filter((l: LimiteCredito) =>
      l.status === 'ATIVO' &&
      l.data_aprovacao &&
      new Date(l.data_aprovacao) >= startOfMonth
    ).length;

    const totalRejectedThisMonth = allLimits.filter((l: LimiteCredito) =>
      l.status === 'REJEITADO' &&
      l.data_aprovacao &&
      new Date(l.data_aprovacao) >= startOfMonth
    ).length;

    // Build clients array with latest scores
    const clientsWithScores = allClients.map(c => {
      const latestScore = latestScoresByClient.get(c.id);
      return {
        id: c.id,
        nome: c.nome,
        cpf_cnpj: c.cpf_cnpj,
        tipo: c.tipo,
        status: c.status,
        limite_credito: c.limite_credito,
        segmento_textil: c.segmento_textil,
        tipo_negocio: c.tipo_negocio,
        faturamento_estimado: c.faturamento_estimado,
        score_final: latestScore?.score_final || null,
        classificacao: latestScore?.classificacao || null
      };
    });

    res.json({
      success: true,
      stats: {
        totalClients,
        activeClients,
        averageScore,
        riskDistribution,
        totalPendingLimits,
        totalApprovedThisMonth,
        totalRejectedThisMonth,
        clients: clientsWithScores
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatisticas do dashboard:', error);
    next(error);
  }
});

export default router;
