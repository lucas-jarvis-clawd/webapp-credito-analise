# CLAUDE.md - Contexto do Projeto

## O que e este projeto

WebApp de analise de credito para lojistas do ramo textil que operam sem informacoes contabeis formais. O sistema substitui planilhas Excel com um modelo de scoring automatizado baseado em 7 metricas ponderadas.

## Comandos essenciais

```bash
# Backend (porta 3001)
cd backend && npm install && npm run dev

# Frontend (porta 5173)
cd frontend && npm install && npm run dev

# Testes backend (104 testes: 79 API + 25 unit)
cd backend && npm test

# Testes frontend (6 smoke tests)
cd frontend && npm test

# Type check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## Arquitetura

- **Backend**: Node.js + Express + TypeScript. Banco de dados in-memory com persistencia em `backend/data/db.json`. Sem Oracle/SQL.
- **Frontend**: React 19 + TypeScript + Material-UI v7 + Vite + Recharts + React Router v7.
- **Auth**: JWT com bcrypt. Mock users (sem AD real).
- **API Docs**: Swagger UI em `http://localhost:3001/api-docs`.

## Usuarios de teste

| Usuario    | Senha          | Perfil    |
|------------|----------------|-----------|
| admin      | admin123       | ADMIN     |
| analista1  | analista1123   | ANALISTA  |
| consultor1 | consultor1123  | CONSULTOR |

## Modelo de scoring (7 metricas)

| Metrica                  | Peso  | Descricao                                      |
|--------------------------|-------|-------------------------------------------------|
| historico_pagamentos     | 0.25  | % duplicatas pagas no prazo (com peso recencia) |
| tempo_relacionamento     | 0.15  | Meses desde primeira duplicata                  |
| prazo_medio_pagamento    | 0.15  | Media de dias para pagar                        |
| referencia_comercial     | 0.15  | Media de scores de referencias                  |
| tendencia_volume         | 0.10  | Volume 6 meses recentes vs anteriores           |
| indice_sazonalidade      | 0.10  | Regularidade + alinhamento sazonal por segmento |
| capacidade_estimada      | 0.10  | Razao limite credito / maior compra             |

Classificacao: EXCELENTE (80-100), BOM (65-79), REGULAR (50-64), RUIM (30-49), PESSIMO (0-29).

Sazonalidade diferencia 6 segmentos texteis: MODA_FEMININA, MODA_MASCULINA, INFANTIL, CAMA_MESA_BANHO, TECIDOS, AVIAMENTOS.

## Estrutura de arquivos relevantes

```
backend/src/
  app.ts                    # Express app + swagger + CORS
  config/swagger.ts         # OpenAPI 3.0.3 config
  database/memoryDb.ts      # Banco in-memory tipado (zero as any)
  database/connection.ts    # Inicializacao + seed
  middleware/auth.ts        # JWT middleware + RBAC
  middleware/errorHandler.ts
  models/types.ts           # Interfaces tipadas com union literals
  routes/                   # 6 arquivos de rotas com swagger annotations
  services/scoreService.ts  # Modelo de scoring (7 metricas)
  services/clientService.ts
  services/limitService.ts
  utils/jwt.ts              # JWT centralizado
  utils/scoringConfig.ts    # Pesos compartilhados
  utils/logger.ts           # Winston logger
  validation/schemas.ts     # Joi schemas
  __tests__/api.test.ts     # 79 testes de integracao (supertest)
  __tests__/scoreService.test.ts  # 25 testes unitarios

frontend/src/
  App.tsx                   # Rotas + theme + auth
  contexts/AuthContext.tsx  # Provider de autenticacao
  services/api.ts           # Axios + interceptors
  types/index.ts            # Tipos alinhados com backend
  components/
    Login/LoginPage.tsx
    Layout/MainLayout.tsx        # Sidebar + AppBar + breadcrumbs
    Dashboard/DashboardPage.tsx  # Dashboard com skeleton loading
    Dashboard/ChartsSection.tsx
    Dashboard/ClientsTable.tsx
    Dashboard/FiltersSection.tsx
    Dashboard/MetricsCards.tsx
    ClientAnalysis/ClientAnalysisPage.tsx  # Analise + confiabilidade
    CreditLimit/CreditLimitForm.tsx
    LimitsManagement/LimitsManagementPage.tsx
    MetricsConfiguration/MetricsConfigPage.tsx
  __tests__/smoke.test.tsx  # 6 smoke tests
```

## Convencoes

- Zero `as any` / `: any` no codigo fonte (exceto tests).
- Union literal types para campos como status, perfil, classificacao.
- Tratamento de erros com classe `AppError` e middleware centralizado.
- Rate limiting no login (5 req/min por IP).
- Body size limit de 10kb.
- CORS restritivo configuravel via env.
- Dados de seed sao gerados aleatoriamente a cada inicializacao.

## Variaveis de ambiente

Ver `backend/.env.example`:
- `PORT` (default 3001)
- `NODE_ENV` (development/production)
- `CORS_ORIGIN` (default http://localhost:5173)
- `JWT_SECRET` (obrigatorio em producao)
- `JWT_EXPIRES_IN` (default 24h)
