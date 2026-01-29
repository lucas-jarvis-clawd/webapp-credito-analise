# CreditAnalyzer - Sistema de Analise de Credito Textil

Sistema web completo de analise de credito desenvolvido para lojistas do ramo textil que operam sem informacoes contabeis formais (balanco, DRE). Utiliza um modelo de scoring automatizado com 7 metricas ponderadas baseadas em historico de duplicatas, pagamentos e referencias comerciais.

## Visao Geral

O CreditAnalyzer substitui planilhas Excel por uma aplicacao web moderna com:

- **Score automatico** de credito com 7 metricas configuraveis
- **Sazonalidade inteligente** diferenciada por 6 segmentos texteis
- **Indicador de confiabilidade** dos dados (ALTO/MEDIO/BAIXO/INSUFICIENTE)
- **Gestao de limites** com fluxo de aprovacao/rejeicao
- **Dashboard interativo** com graficos, filtros e tabela de clientes
- **Controle de acesso** baseado em perfis (ADMIN, ANALISTA, CONSULTOR)
- **Documentacao da API** via Swagger/OpenAPI

## Stack Tecnologica

| Camada     | Tecnologias                                                   |
|------------|---------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Material-UI 7, Vite, Recharts, Axios   |
| Backend    | Node.js, Express, TypeScript, JWT, bcrypt, Joi, Winston       |
| Banco      | In-memory com persistencia em JSON (backend/data/db.json)     |
| Testes     | Vitest, Supertest, React Testing Library                      |
| Docs       | Swagger UI (swagger-jsdoc + swagger-ui-express)               |

## Como Executar

### Pre-requisitos

- Node.js 18+
- npm 9+

### Instalacao e Execucao

```bash
# 1. Clonar o repositorio
git clone https://github.com/lucas-jarvis-clawd/webapp-credito-analise.git
cd webapp-credito-analise

# 2. Iniciar o backend (porta 3001)
cd backend
npm install
npm run dev

# 3. Em outro terminal, iniciar o frontend (porta 5173)
cd frontend
npm install
npm run dev
```

A aplicacao estara disponivel em:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api-docs

### Variaveis de Ambiente

Copie `backend/.env.example` para `backend/.env` e ajuste conforme necessario:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_secure_random_secret_here
JWT_EXPIRES_IN=24h
```

> Em producao, `JWT_SECRET` e obrigatorio. O sistema recusa iniciar sem ele.

## Usuarios de Teste

| Usuario      | Senha          | Perfil      | Permissoes                                    |
|--------------|----------------|-------------|-----------------------------------------------|
| `admin`      | `admin123`     | ADMIN       | Acesso total, configurar pesos, listar users  |
| `analista1`  | `analista1123` | ANALISTA    | Calcular scores, aprovar/rejeitar limites     |
| `consultor1` | `consultor1123`| CONSULTOR   | Visualizar clientes e scores (somente leitura)|

## Funcionalidades

### Dashboard (`/dashboard`)

- Cards com metricas consolidadas (total clientes, ativos, score medio, limites pendentes)
- Graficos de distribuicao de risco (barra e pizza) via Recharts
- Tabela de clientes com filtros avancados:
  - Busca por nome
  - Filtro por classificacao, status, tipo (PF/PJ)
  - Range de score e limite de credito
  - Ordenacao por qualquer coluna
- Skeleton loading para melhor percepcao de performance

### Analise do Cliente (`/client/:id`)

- **Aba Historico**: Grafico de linha da evolucao do score ao longo do tempo
- **Aba Metricas**: Barras horizontais com o valor de cada uma das 7 metricas
- **Aba Informacoes**: Dados cadastrais + 8 cards de estatisticas financeiras (duplicatas pagas, vencidas, abertas, valor total, valor medio, pagamentos, prazo medio)
- Calculo de score sob demanda com resultado exibido em destaque
- **Chip de confiabilidade** indicando a qualidade/quantidade de dados do cliente

### Gestao de Limites (`/limits`)

- Tabela de solicitacoes pendentes
- Dialog de aprovacao com campo de valor aprovado e observacoes
- Dialog de rejeicao com motivo obrigatorio (minimo 10 caracteres)
- Feedback visual de sucesso/erro

### Configuracao de Limite (`/client/:id/credit-limit`)

- Formulario para solicitar novo limite de credito
- Exibe limite atual e historico de solicitacoes

### Configuracao de Metricas (`/metrics-config`)

- Interface para ajustar os pesos das 7 metricas de scoring
- Validacao de que a soma dos pesos seja 1.0

### Navegacao

- Sidebar responsiva (permanent em desktop, drawer em mobile)
- Breadcrumbs dinamicos com contexto de navegacao
- Menu de perfil com opcao de logout

## Modelo de Scoring

O sistema avalia clientes texteis atraves de 7 metricas, cada uma gerando um score de 0 a 100:

### 1. Historico de Pagamentos (peso: 25%)

Percentual de duplicatas pagas no prazo, com peso de recencia:
- Duplicatas dos ultimos 6 meses: peso 1.5x
- Duplicatas de 6-12 meses: peso 1.0x
- Duplicatas mais antigas: peso 0.5x

Pagamentos com ate 3 dias de atraso sao considerados no prazo (grace period).

### 2. Prazo Medio de Pagamento (peso: 15%)

Media de dias entre vencimento e pagamento efetivo:
- Antecipado (3+ dias): 100
- No prazo: 95
- Ate 3 dias de atraso: 90
- Ate 7 dias: 75
- Ate 15 dias: 55
- Ate 30 dias: 35
- Acima de 30: decrescente

### 3. Referencia Comercial (peso: 15%)

Media dos scores (0-100) de referencias comerciais cadastradas no sistema. Sem referencias = 50 (neutro).

### 4. Tempo de Relacionamento (peso: 15%)

Meses desde a primeira duplicata emitida:
- 0 meses = 0
- 6 meses = 50
- 12+ meses = 100

### 5. Tendencia de Volume (peso: 10%)

Comparacao do volume de compras nos ultimos 6 meses vs os 6 meses anteriores. Crescimento gera score alto, declinio gera score baixo.

### 6. Indice de Sazonalidade (peso: 10%)

Combina dois fatores:
- **Regularidade (60%)**: Coeficiente de variacao das compras trimestrais. Compras regulares = score alto.
- **Alinhamento sazonal (40%)**: Correlacao de Pearson entre o padrao de compras do cliente e o padrao esperado para seu segmento textil.

Padroes sazonais por segmento:

| Segmento         | Q1    | Q2    | Q3    | Q4    | Picos                           |
|------------------|-------|-------|-------|-------|---------------------------------|
| MODA_FEMININA    | 0.30  | 0.20  | 0.15  | 0.35  | Verao/Carnaval + Natal          |
| MODA_MASCULINA   | 0.20  | 0.30  | 0.15  | 0.35  | Dia dos Pais + Natal            |
| INFANTIL         | 0.25  | 0.15  | 0.20  | 0.40  | Natal/Dia Criancas + Volta aula |
| CAMA_MESA_BANHO  | 0.20  | 0.30  | 0.15  | 0.35  | Inverno + Natal/Casamentos      |
| TECIDOS          | 0.23  | 0.25  | 0.22  | 0.30  | Relativamente uniforme          |
| AVIAMENTOS       | 0.25  | 0.25  | 0.25  | 0.25  | Distribuicao uniforme           |

### 7. Capacidade Estimada (peso: 10%)

Razao entre o limite de credito do cliente e o valor da maior compra individual:
- Razao >= 5: 100 (muito seguro)
- Razao >= 3: 85
- Razao >= 2: 70
- Razao >= 1: 50
- Razao < 1: 30 ou menos (risco)

### Classificacao Final

| Classificacao | Score   | Cor     |
|---------------|---------|---------|
| EXCELENTE     | 80-100  | Verde   |
| BOM           | 65-79   | Verde claro |
| REGULAR       | 50-64   | Amarelo |
| RUIM          | 30-49   | Laranja |
| PESSIMO       | 0-29    | Vermelho|

### Indicador de Confiabilidade

Cada calculo de score inclui um indicador de confiabilidade que avalia a qualidade dos dados disponiveis:

| Fator             | Pontuacao maxima |
|-------------------|-----------------|
| Qtd duplicatas    | 25 pontos       |
| Qtd pagamentos    | 25 pontos       |
| Qtd referencias   | 25 pontos       |
| Meses de historico| 25 pontos       |

Niveis: ALTO (75-100), MEDIO (50-74), BAIXO (25-49), INSUFICIENTE (0-24).

## API

A API esta documentada via Swagger em http://localhost:3001/api-docs quando o backend esta rodando.

### Principais endpoints

| Metodo | Endpoint                         | Descricao                        | Acesso           |
|--------|----------------------------------|----------------------------------|------------------|
| POST   | /api/auth/login                  | Autenticacao (rate limited)      | Publico          |
| POST   | /api/auth/validate               | Validar token JWT                | Autenticado      |
| GET    | /api/dashboard/stats             | Estatisticas do dashboard        | Autenticado      |
| GET    | /api/clients                     | Listar clientes (paginado)       | Autenticado      |
| GET    | /api/clients/:id                 | Detalhe do cliente               | Autenticado      |
| GET    | /api/clients/:id/statistics      | Estatisticas financeiras         | Autenticado      |
| POST   | /api/score/calculate/:clienteId  | Calcular score de credito        | Autenticado      |
| GET    | /api/score/:clienteId            | Ultimo score (sem recalcular)    | Autenticado      |
| GET    | /api/score/:clienteId/history    | Historico de scores              | Autenticado      |
| GET    | /api/limits/pending              | Limites pendentes                | ADMIN, ANALISTA  |
| POST   | /api/limits/request              | Solicitar limite                 | Autenticado      |
| POST   | /api/limits/:id/approve          | Aprovar limite                   | ADMIN, ANALISTA  |
| POST   | /api/limits/:id/reject           | Rejeitar limite                  | ADMIN, ANALISTA  |
| GET    | /api/config/scoring              | Config do scoring                | ADMIN, ANALISTA  |
| PUT    | /api/config/scoring/weights      | Atualizar pesos                  | ADMIN            |

## Testes

```bash
# Backend: 104 testes (79 integracao + 25 unitarios)
cd backend && npm test

# Frontend: 6 smoke tests
cd frontend && npm test

# Type check backend
cd backend && npx tsc --noEmit

# Type check frontend
cd frontend && npx tsc --noEmit
```

Os testes de integracao cobrem:
- Autenticacao (login, validacao de token, credenciais invalidas)
- Protecao de rotas (401 sem token, 403 sem permissao)
- CRUD de clientes, scores, limites e configuracoes
- Fluxo completo de aprovacao/rejeicao de limites
- Rate limiting no login
- Respostas 404

## Seguranca

- **Senhas**: Hash bcrypt (salt rounds 10)
- **JWT**: Secret centralizado, obrigatorio em producao
- **Rate limiting**: 5 tentativas de login por minuto por IP
- **CORS**: Restrito a origem configuravel via env
- **Helmet**: Headers HTTP de seguranca
- **Body size**: Limite de 10kb nas requisicoes
- **RBAC**: 3 perfis com permissoes granulares por endpoint
- **Validacao**: Joi schemas nos inputs criticos
- **Tipos**: Zero `as any` / `: any` em todo o codigo fonte

## Estrutura do Projeto

```
webapp-credito-analise/
├── backend/
│   ├── src/
│   │   ├── __tests__/          # Testes (api.test.ts, scoreService.test.ts)
│   │   ├── config/             # Swagger config
│   │   ├── database/           # MemoryDb tipado + connection
│   │   ├── middleware/         # Auth + error handler
│   │   ├── models/             # Interfaces TypeScript
│   │   ├── routes/             # 6 arquivos de rotas (com OpenAPI annotations)
│   │   ├── services/           # Score, Client, Limit services
│   │   ├── utils/              # JWT, logger, scoring config, seed
│   │   ├── validation/         # Joi schemas
│   │   └── app.ts              # Express app entry point
│   ├── data/                   # db.json (persistencia)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── __tests__/          # Smoke tests
│   │   ├── components/         # 7 modulos de UI
│   │   │   ├── ClientAnalysis/
│   │   │   ├── CreditLimit/
│   │   │   ├── Dashboard/      # 5 subcomponentes
│   │   │   ├── Layout/
│   │   │   ├── LimitsManagement/
│   │   │   ├── Login/
│   │   │   └── MetricsConfiguration/
│   │   ├── contexts/           # AuthContext
│   │   ├── hooks/              # useDebounce, useLocalStorage
│   │   ├── services/           # API client (Axios)
│   │   ├── types/              # Tipos compartilhados
│   │   ├── utils/              # Formatters
│   │   ├── App.tsx             # Rotas + theme
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── tsconfig.json
├── CLAUDE.md                   # Contexto para Claude Code
└── README.md                   # Este arquivo
```
