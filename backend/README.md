# WebApp Análise de Crédito - Backend

Sistema backend em Node.js + TypeScript para análise de crédito com conexão Oracle Database.

## 🚀 Funcionalidades

### ✅ Implementado

1. **Setup Inicial**
   - ✅ Node.js + TypeScript + Express
   - ✅ Estrutura de pastas organizada
   - ✅ Configuração de build e desenvolvimento

2. **Conexão Oracle Database**
   - ✅ Pool de conexões configurado
   - ✅ Tabelas: f_duplicatas, f_pagamentos
   - ✅ Suporte a outras tabelas (clientes, limites_credito, etc.)

3. **APIs REST**
   - ✅ **Autenticação:** Mock Active Directory com JWT
   - ✅ **Clientes:** Busca, filtros, paginação, estatísticas
   - ✅ **Score:** Cálculo de métricas, histórico, pesos customizados
   - ✅ **Limites:** CRUD de limites de crédito
   - ✅ **Configurações:** Gerenciamento de ponderações

4. **Sistema de Scoring** 
   - ✅ 4 métricas principais implementadas:
     - Pontuação interna (baseada em regras de negócio)
     - Histórico de pagamentos (% duplicatas pagas)
     - Valor médio das duplicatas (normalizado)
     - Prazo médio de pagamento (normalizado)
   - ✅ Ponderações configuráveis
   - ✅ Classificação automática (EXCELENTE, BOM, REGULAR, RUIM, PÉSSIMO)

5. **Gerador de Dados Fake**
   - ✅ Clientes PF/PJ com CPF/CNPJ válidos
   - ✅ Duplicatas com status realistas
   - ✅ Pagamentos compatíveis com Oracle
   - ✅ Script de seed para 50 clientes + 300 duplicatas

## 🛠️ Configuração

### Pré-requisitos
- Node.js 18+
- Oracle Database (local ou remoto)
- npm ou yarn

### Instalação

1. **Clone e instale dependências:**
```bash
cd webapp-credito/backend
npm install
```

2. **Configure o ambiente:**
```bash
cp .env .env.local
# Edite .env.local com suas configurações do Oracle
```

3. **Variáveis de ambiente (.env):**
```env
# Servidor
PORT=3001
NODE_ENV=development

# Oracle Database
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=xe
DB_USER=credito_user
DB_PASSWORD=credito_pass

# JWT
JWT_SECRET=seu_jwt_secret_muito_secreto
JWT_EXPIRES_IN=24h

# Scoring (pesos padrão)
SCORE_DEFAULT_WEIGHTS_PONTUACAO=0.3
SCORE_DEFAULT_WEIGHTS_HISTORICO=0.25
SCORE_DEFAULT_WEIGHTS_VALOR=0.25
SCORE_DEFAULT_WEIGHTS_PRAZO=0.2
```

### Executar

1. **Desenvolvimento:**
```bash
npm run dev
```

2. **Produção:**
```bash
npm run build
npm start
```

3. **Gerar dados fake:**
```bash
npm run seed
```

## 📊 Estrutura do Banco

### Tabelas Principais

1. **clientes** - Dados dos clientes
2. **f_duplicatas** - Duplicatas/faturas
3. **f_pagamentos** - Pagamentos das duplicatas  
4. **limites_credito** - Histórico de limites
5. **score_historico** - Histórico de scores calculados
6. **configuracoes_sistema** - Configurações e ponderações

### Relacionamentos
```
clientes → f_duplicatas → f_pagamentos
clientes → limites_credito
clientes → score_historico
```

## 🔐 Autenticação

### Mock Active Directory

**Usuários de teste:**
- **admin / admin123** - Perfil: ADMIN
- **analista1 / analista1123** - Perfil: ANALISTA  
- **consultor1 / consultor1123** - Perfil: CONSULTOR

### Níveis de Acesso

- **ADMIN:** Acesso total + configurações
- **ANALISTA:** Análise e aprovação de limites
- **CONSULTOR:** Consulta de clientes e scores

## 🎯 APIs Disponíveis

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/validate` - Validar token
- `GET /api/auth/users` - Listar usuários

### Clientes  
- `GET /api/clients` - Listar com filtros/paginação
- `GET /api/clients/:id` - Buscar por ID
- `GET /api/clients/:id/duplicatas` - Duplicatas do cliente
- `GET /api/clients/:id/pagamentos` - Pagamentos do cliente
- `GET /api/clients/:id/statistics` - Estatísticas
- `PUT /api/clients/:id/limit` - Atualizar limite

### Scoring
- `POST /api/score/calculate/:clienteId` - Calcular score
- `GET /api/score/:clienteId` - Último score
- `GET /api/score/:clienteId/history` - Histórico
- `GET /api/score/:clienteId/metrics` - Métricas detalhadas
- `POST /api/score/batch` - Score em lote
- `GET /api/score/defaults` - Configurações padrão

### Limites de Crédito
- `GET /api/limits/pending` - Pendentes
- `GET /api/limits/history` - Histórico
- `GET /api/limits/:id` - Por ID
- `GET /api/limits/client/:clienteId` - Do cliente
- `POST /api/limits/request` - Solicitar
- `POST /api/limits/:id/approve` - Aprovar
- `POST /api/limits/:id/reject` - Rejeitar

### Configurações
- `GET /api/config` - Todas
- `GET /api/config/scoring` - De scoring
- `PUT /api/config/scoring/weights` - Atualizar pesos
- `POST /api/config` - Criar
- `PUT /api/config/:chave` - Atualizar
- `DELETE /api/config/:chave` - Deletar

## 🔢 Sistema de Scoring

### Métricas (0-100 cada)

1. **Pontuação Interna (30%)**
   - Base: 50 pontos
   - +2 pontos por duplicata paga (máx +25)
   - -5 pontos por duplicata vencida (máx -30)
   - +10 pontos se ≥10 operações (+5 se ≥5)

2. **Histórico de Pagamentos (25%)**
   - % de duplicatas pagas vs total
   - 100% pagamento = 100 pontos

3. **Valor Médio Duplicatas (25%)**
   - Normalizado até R$ 10.000 = 100 pontos
   - Linear entre 0 e valor máximo

4. **Prazo Médio Pagamento (20%)**
   - Antecipado/prazo = 100 pontos
   - Até 7 dias = 80 pontos
   - Até 15 dias = 60 pontos  
   - Até 30 dias = 40 pontos
   - >30 dias = decrescente

### Score Final
Score = (P1×0.3) + (P2×0.25) + (P3×0.25) + (P4×0.2)

### Classificação
- **80-100:** EXCELENTE 🟢
- **65-79:** BOM 🔵  
- **50-64:** REGULAR 🟡
- **30-49:** RUIM 🟠
- **0-29:** PÉSSIMO 🔴

## 🧪 Teste Rápido

1. **Inicie o servidor:**
```bash
npm run dev
```

2. **Teste autenticação:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

3. **Teste health check:**
```bash
curl http://localhost:3001/health
```

4. **Gere dados fake (se necessário):**
```bash
npm run seed
```

## 🎯 Próximos Passos

- [ ] Integração real com Active Directory
- [ ] Testes unitários e integração
- [ ] Documentação OpenAPI/Swagger
- [ ] Cache Redis para performance
- [ ] Monitoramento e métricas
- [ ] Deploy automatizado

## 🐛 Troubleshooting

### Conexão Oracle
- Verificar se serviço Oracle está rodando
- Validar credenciais em .env
- Testar conectividade de rede

### Erros Comuns
- **Port 3001 in use:** Alterar PORT no .env
- **JWT secret:** Configurar JWT_SECRET forte
- **Tabelas não existem:** Executar `npm run seed`

---

**Desenvolvido em 3h para MVP funcional** ⚡
**Foco: Funcionalidade > Perfeição** 🎯