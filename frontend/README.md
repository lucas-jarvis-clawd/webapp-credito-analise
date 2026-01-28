# CreditAnalyzer - Frontend

Sistema Inteligente de Análise de Crédito desenvolvido com React + TypeScript.

## 🚀 Características

- **Dashboard Interativo**: Visão geral dos clientes com cards informativos
- **Análise Detalhada**: Histórico, gráficos e métricas de cada cliente
- **Configuração de Métricas**: Sistema para ajustar ponderação das métricas de análise
- **Formulário de Limite**: Processo guiado para configurar limites de crédito
- **Interface Moderna**: Design responsivo com Material-UI
- **Gráficos Avançados**: Visualizações com Recharts
- **Autenticação**: Sistema de login simulado

## 🛠️ Tecnologias Utilizadas

- **React 19** com TypeScript
- **Material-UI v6** - Interface moderna e responsiva
- **Recharts** - Gráficos e visualizações
- **React Router** - Navegação entre páginas
- **Axios** - Cliente HTTP para APIs
- **Vite** - Build tool rápida

## 📦 Instalação

1. Instalar dependências:
```bash
npm install
```

2. Executar em modo desenvolvimento:
```bash
npm run dev
```

3. Fazer build para produção:
```bash
npm run build
```

## 🔐 Credenciais de Teste

### Administrador
- **Usuário**: admin
- **Senha**: admin123

### Analista
- **Usuário**: analyst
- **Senha**: analyst123

## 🏗️ Estrutura do Projeto

```
src/
├── components/           # Componentes da interface
│   ├── Dashboard/       # Dashboard principal
│   ├── ClientAnalysis/  # Análise individual do cliente
│   ├── MetricsConfiguration/ # Config de métricas
│   ├── CreditLimit/     # Formulário de limite
│   ├── Login/          # Página de login
│   └── Layout/         # Layout principal
├── contexts/           # Contextos React (Auth)
├── services/          # Serviços de API
├── types/            # Definições TypeScript
└── utils/           # Utilitários

```

## 🎨 Componentes Principais

### 1. Dashboard Principal
- Cards de estatísticas gerais
- Lista de clientes com filtros
- Busca e navegação

### 2. Análise do Cliente
- Histórico de score com gráficos
- Métricas detalhadas
- Recomendações e fatores de risco

### 3. Configuração de Métricas
- Ajuste de pesos das métricas
- Visualização da distribuição
- Simulação de impacto

### 4. Formulário de Limite
- Processo em etapas (stepper)
- Análise de risco automática
- Validações e recomendações

## 🎯 Funcionalidades

✅ **Login Simulado** - Autenticação com mock AD  
✅ **Dashboard Responsivo** - Cards de clientes e estatísticas  
✅ **Análise Individual** - Gráficos de histórico e métricas  
✅ **Configuração de Métricas** - Sistema de ponderação  
✅ **Formulário de Limite** - Processo guiado em etapas  
✅ **Interface Moderna** - Material-UI com tema customizado  
✅ **Gráficos Interativos** - Charts com Recharts  

## 🌈 Design System

### Cores Principais
- **Primary**: #2196f3 (Azul)
- **Success**: #4caf50 (Verde)
- **Warning**: #ff9800 (Laranja)
- **Error**: #f44336 (Vermelho)

### Tipografia
- **Font Family**: Roboto
- **Weights**: 400, 600

## 🚀 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build
- `npm run lint` - Verificação de código

## 🔮 Próximos Passos

- [ ] Integração com API real
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Export de relatórios PDF
- [ ] Temas dark/light

## 👨‍💻 Desenvolvimento

Desenvolvido com foco em UX para analistas de crédito, priorizando:
- Interface intuitiva e moderna
- Performance e responsividade
- Visualizações claras e informativas
- Processo de trabalho otimizado

---

**CreditAnalyzer** - Sistema que impressiona! 🎯