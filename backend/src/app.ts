import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initializeDatabase } from './database/connection';
import { swaggerSpec } from './config/swagger';

// Importacao das rotas
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import scoreRoutes from './routes/scoreRoutes';
import limitRoutes from './routes/limitRoutes';
import configRoutes from './routes/configRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CreditAnalyzer API Documentation'
}));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/limits', limitRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'in-memory'
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint nao encontrado',
    path: req.originalUrl
  });
});

// Initialize the database (for use in tests or direct imports)
export async function initializeApp(): Promise<typeof app> {
  await initializeDatabase();
  logger.info('Banco de dados em memoria inicializado com sucesso');
  return app;
}

// Start server only when this file is run directly (not imported for testing)
if (require.main === module || !process.env.VITEST) {
  const startServer = async () => {
    try {
      await initializeApp();
      app.listen(PORT, () => {
        logger.info(`Servidor rodando na porta ${PORT}`);
        logger.info(`Sistema de analise de credito textil iniciado`);
        logger.info(`Banco de dados: in-memory com persistencia em disco (backend/data/db.json)`);
      });
    } catch (error) {
      logger.error('Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  };

  startServer();
}

export default app;
