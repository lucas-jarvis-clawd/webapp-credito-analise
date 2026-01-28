# 🏦 WebApp Análise de Crédito

Sistema completo de análise de crédito para substituir planilhas Excel, desenvolvido overnight para Lucas.

## 🚀 Funcionalidades

### 📊 Análise de Score Automática
- **Variação de Pedido**: Comparação com coleção anterior
- **Maior Atraso**: Atraso máximo histórico do cliente
- **Atraso Médio**: Média de atrasos de pagamento
- **Variação de Atraso**: Mudança de comportamento entre coleções

### 🎛️ Sistema de Ponderação
- Configuração de pesos para cada métrica
- Cálculo de score final personalizado
- Interface intuitiva para ajustes

### 👤 Interface do Analista
- Dashboard com visão geral dos clientes
- Análise individual detalhada
- Campo para definir limite de crédito aprovado
- Histórico de decisões

### 🔐 Autenticação
- Integração com Active Directory
- Controle de acesso por perfis

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** + TypeScript
- **Material-UI** para componentes
- **Chart.js** para gráficos
- **Axios** para API calls

### Backend  
- **Node.js** + Express + TypeScript
- **Oracle Database** (f_duplicatas, f_pagamentos)
- **JWT** para autenticação
- **Swagger** para documentação da API

### Banco de Dados
- **Oracle** (produção)
- **SQLite** (desenvolvimento e dados fake)

## 🏗️ Estrutura do Projeto

```
webapp-credito/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Integração com APIs
│   │   └── utils/         # Utilitários e helpers
│   └── public/
├── backend/           # Node.js API
│   ├── src/
│   │   ├── controllers/   # Controllers da API
│   │   ├── models/        # Modelos de dados
│   │   ├── services/      # Lógica de negócio
│   │   ├── routes/        # Definição de rotas
│   │   └── utils/         # Utilitários
├── database/          # Scripts e dados
│   ├── migrations/    # Scripts de criação
│   ├── seeds/         # Dados fake
│   └── queries/       # Consultas SQL
├── docker/            # Configuração de containers
└── docs/              # Documentação
```

## 🚀 Como Executar

### Desenvolvimento Rápido (Dados Fake)
```bash
# Iniciar backend com dados fake
cd backend && npm install && npm run dev

# Iniciar frontend
cd frontend && npm install && npm start
```

### Produção (Oracle)
```bash
# Com Docker Compose
docker-compose up -d

# Manual
cd backend && npm run build && npm start
cd frontend && npm run build
```

## 📈 Métricas Implementadas

### 1. Variação de Pedido
```
Variação = (Pedido_Atual - Pedido_Anterior) / Pedido_Anterior * 100
```

### 2. Maior Atraso
```
Max(Data_Pagamento - Data_Vencimento) para todos os pagamentos
```

### 3. Atraso Médio  
```
Média(Data_Pagamento - Data_Vencimento) onde atraso > 0
```

### 4. Variação de Atraso
```
Comparação do atraso médio entre coleções consecutivas
```

## 🎯 Score Final
```
Score = (Metrica1 * Peso1) + (Metrica2 * Peso2) + ... 
Normalizado entre 0-1000
```

## 👨‍💻 Equipe de Desenvolvimento Noturna

- **Arquiteto**: Estrutura geral e tecnologias
- **Backend Dev**: APIs e integração Oracle  
- **Frontend Dev**: Interface React moderna
- **Data Engineer**: Dados fake e algoritmos de scoring

## 📅 Cronograma de Desenvolvimento

- **00:00-01:00**: Arquitetura e setup
- **01:00-03:00**: Backend e APIs
- **03:00-05:00**: Frontend e UX
- **05:00-06:00**: Testes e screenshots

---

**Desenvolvido em uma noite para surpreender Lucas! 🌙✨**