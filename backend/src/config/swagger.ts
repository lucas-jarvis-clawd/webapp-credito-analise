import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CreditAnalyzer API',
      version: '1.0.0',
      description: 'API do sistema de analise de credito para lojistas do ramo textil. ' +
        'Utiliza 7 metricas ponderadas para calcular score de credito sem necessidade de dados contabeis formais.',
      contact: {
        name: 'Equipe de Desenvolvimento'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Base'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via POST /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            nome: { type: 'string' },
            perfil: { type: 'string', enum: ['ADMIN', 'ANALISTA', 'CONSULTOR'] }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            cpf_cnpj: { type: 'string' },
            tipo: { type: 'string', enum: ['PF', 'PJ'] },
            email: { type: 'string' },
            telefone: { type: 'string' },
            limite_credito: { type: 'number' },
            status: { type: 'string', enum: ['ATIVO', 'INATIVO', 'BLOQUEADO'] },
            segmento_textil: { type: 'string', enum: ['MODA_FEMININA', 'MODA_MASCULINA', 'INFANTIL', 'CAMA_MESA_BANHO', 'TECIDOS', 'AVIAMENTOS'] },
            tipo_negocio: { type: 'string', enum: ['LOJA_FISICA', 'AMBULANTE', 'ONLINE', 'MISTO'] },
            faturamento_estimado: { type: 'number' },
            score_final: { type: 'number', description: 'Score 0-100 (incluso no dashboard)' },
            classificacao: { type: 'string', enum: ['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'PESSIMO'] }
          }
        },
        ScoreResult: {
          type: 'object',
          properties: {
            cliente_id: { type: 'integer' },
            score_final: { type: 'number', minimum: 0, maximum: 100 },
            classificacao: { type: 'string', enum: ['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'PESSIMO'] },
            metricas: {
              type: 'object',
              properties: {
                historico_pagamentos: { type: 'number', description: 'Historico de pagamentos (0-100)' },
                tempo_relacionamento: { type: 'number', description: 'Tempo de relacionamento (0-100)' },
                tendencia_volume: { type: 'number', description: 'Tendencia de volume (0-100)' },
                prazo_medio_pagamento: { type: 'number', description: 'Prazo medio de pagamento (0-100)' },
                indice_sazonalidade: { type: 'number', description: 'Indice de sazonalidade textil (0-100)' },
                referencia_comercial: { type: 'number', description: 'Referencia comercial (0-100)' },
                capacidade_estimada: { type: 'number', description: 'Capacidade estimada (0-100)' }
              }
            },
            ponderacoes: {
              type: 'object',
              description: 'Pesos utilizados (somam 1.0)',
              properties: {
                historico_pagamentos: { type: 'number', example: 0.25 },
                tempo_relacionamento: { type: 'number', example: 0.15 },
                tendencia_volume: { type: 'number', example: 0.10 },
                prazo_medio_pagamento: { type: 'number', example: 0.15 },
                indice_sazonalidade: { type: 'number', example: 0.10 },
                referencia_comercial: { type: 'number', example: 0.15 },
                capacidade_estimada: { type: 'number', example: 0.10 }
              }
            },
            data_calculo: { type: 'string', format: 'date-time' }
          }
        },
        LimiteCredito: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            cliente_id: { type: 'integer' },
            limite_atual: { type: 'number' },
            limite_solicitado: { type: 'number' },
            limite_aprovado: { type: 'number' },
            status: { type: 'string', enum: ['ATIVO', 'PENDENTE', 'REJEITADO'] },
            motivo: { type: 'string' },
            aprovado_por: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
