import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh,
  Dashboard as DashboardIcon,
  TableChart,
  BarChart,
  Settings
} from '@mui/icons-material';
import { Client, DashboardStats } from '../../types';
import MetricsCards from './MetricsCards';
import ChartsSection from './ChartsSection';
import ClientsTable from './ClientsTable';
import FiltersSection, { FilterState } from './FiltersSection';

// Mock data expandido para demonstração
const mockClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    document: '123.456.789-01',
    email: 'joao@email.com',
    phone: '(11) 99999-1111',
    creditScore: 780,
    riskLevel: 'low',
    creditLimit: 15000,
    lastAnalysisDate: new Date('2024-01-20'),
    status: 'active',
    totalDebt: 2500,
    monthlyIncome: 8000
  },
  {
    id: '2',
    name: 'Maria Santos',
    document: '987.654.321-09',
    email: 'maria@email.com',
    phone: '(11) 88888-2222',
    creditScore: 650,
    riskLevel: 'medium',
    creditLimit: 8000,
    lastAnalysisDate: new Date('2024-01-19'),
    status: 'active',
    totalDebt: 4200,
    monthlyIncome: 6500
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    document: '456.789.123-45',
    email: 'carlos@email.com',
    phone: '(11) 77777-3333',
    creditScore: 520,
    riskLevel: 'high',
    creditLimit: 3000,
    lastAnalysisDate: new Date('2024-01-18'),
    status: 'pending',
    totalDebt: 8500,
    monthlyIncome: 4000
  },
  {
    id: '4',
    name: 'Ana Costa',
    document: '789.123.456-78',
    email: 'ana@email.com',
    phone: '(11) 66666-4444',
    creditScore: 720,
    riskLevel: 'low',
    creditLimit: 12000,
    lastAnalysisDate: new Date('2024-01-17'),
    status: 'active',
    totalDebt: 1800,
    monthlyIncome: 9500
  },
  {
    id: '5',
    name: 'Pedro Almeida',
    document: '321.654.987-12',
    email: 'pedro@email.com',
    phone: '(11) 55555-5555',
    creditScore: 690,
    riskLevel: 'low',
    creditLimit: 10000,
    lastAnalysisDate: new Date('2024-01-16'),
    status: 'active',
    totalDebt: 3200,
    monthlyIncome: 7500
  },
  {
    id: '6',
    name: 'Empresa ABC Ltda',
    document: '12.345.678/0001-90',
    email: 'contato@abc.com',
    phone: '(11) 3333-4444',
    creditScore: 750,
    riskLevel: 'low',
    creditLimit: 50000,
    lastAnalysisDate: new Date('2024-01-15'),
    status: 'active',
    totalDebt: 12000,
    monthlyIncome: 45000
  },
  {
    id: '7',
    name: 'Comercial XYZ S/A',
    document: '98.765.432/0001-10',
    email: 'financeiro@xyz.com',
    phone: '(11) 2222-3333',
    creditScore: 620,
    riskLevel: 'medium',
    creditLimit: 25000,
    lastAnalysisDate: new Date('2024-01-14'),
    status: 'pending',
    totalDebt: 18000,
    monthlyIncome: 32000
  },
  {
    id: '8',
    name: 'Indústria DEF Ltda',
    document: '11.222.333/0001-44',
    email: 'vendas@def.com',
    phone: '(11) 1111-2222',
    creditScore: 480,
    riskLevel: 'high',
    creditLimit: 8000,
    lastAnalysisDate: new Date('2024-01-13'),
    status: 'inactive',
    totalDebt: 35000,
    monthlyIncome: 28000
  },
  {
    id: '9',
    name: 'Fernanda Lima',
    document: '444.555.666-77',
    email: 'fernanda@email.com',
    phone: '(11) 9999-8888',
    creditScore: 710,
    riskLevel: 'low',
    creditLimit: 13000,
    lastAnalysisDate: new Date('2024-01-12'),
    status: 'active',
    totalDebt: 2800,
    monthlyIncome: 8500
  },
  {
    id: '10',
    name: 'Roberto Ferreira',
    document: '777.888.999-00',
    email: 'roberto@email.com',
    phone: '(11) 7777-6666',
    creditScore: 580,
    riskLevel: 'medium',
    creditLimit: 6000,
    lastAnalysisDate: new Date('2024-01-11'),
    status: 'pending',
    totalDebt: 7200,
    monthlyIncome: 5500
  },
  {
    id: '11',
    name: 'Startup Tech Ltda',
    document: '55.666.777/0001-88',
    email: 'admin@startup.com',
    phone: '(11) 5555-4444',
    creditScore: 640,
    riskLevel: 'medium',
    creditLimit: 20000,
    lastAnalysisDate: new Date('2024-01-10'),
    status: 'active',
    totalDebt: 15000,
    monthlyIncome: 38000
  },
  {
    id: '12',
    name: 'Luana Rodrigues',
    document: '999.000.111-22',
    email: 'luana@email.com',
    phone: '(11) 8888-7777',
    creditScore: 760,
    riskLevel: 'low',
    creditLimit: 18000,
    lastAnalysisDate: new Date('2024-01-09'),
    status: 'active',
    totalDebt: 4500,
    monthlyIncome: 9800
  },
  {
    id: '13',
    name: 'Gabriel Mendes',
    document: '333.444.555-66',
    email: 'gabriel@email.com',
    phone: '(11) 6666-5555',
    creditScore: 510,
    riskLevel: 'high',
    creditLimit: 4000,
    lastAnalysisDate: new Date('2024-01-08'),
    status: 'inactive',
    totalDebt: 9800,
    monthlyIncome: 4200
  },
  {
    id: '14',
    name: 'Consultoria ABC',
    document: '22.333.444/0001-55',
    email: 'contato@consultoria.com',
    phone: '(11) 4444-3333',
    creditScore: 685,
    riskLevel: 'low',
    creditLimit: 35000,
    lastAnalysisDate: new Date('2024-01-07'),
    status: 'active',
    totalDebt: 22000,
    monthlyIncome: 42000
  },
  {
    id: '15',
    name: 'Juliana Sousa',
    document: '666.777.888-99',
    email: 'juliana@email.com',
    phone: '(11) 3333-2222',
    creditScore: 730,
    riskLevel: 'low',
    creditLimit: 16000,
    lastAnalysisDate: new Date('2024-01-06'),
    status: 'active',
    totalDebt: 3600,
    monthlyIncome: 8800
  }
];

const mockStats: DashboardStats = {
  totalClients: 1247,
  activeAnalyses: 34,
  averageScore: 678,
  riskDistribution: {
    low: 45,
    medium: 35,
    high: 20
  },
  monthlyApprovals: 156,
  monthlyRejections: 23
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DashboardPageNew: React.FC = () => {
  const [clients] = useState<Client[]>(mockClients);
  const [stats] = useState<DashboardStats>(mockStats);
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    riskLevel: 'all',
    status: 'all',
    scoreRange: [300, 850],
    creditLimitMin: 0,
    creditLimitMax: 100000,
    dateFrom: null,
    dateTo: null,
    sortBy: 'lastAnalysisDate',
    sortOrder: 'desc',
    showOnlyRecentAnalysis: false
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Filtro de busca
      if (filters.searchTerm && !client.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !client.document.includes(filters.searchTerm) &&
          !client.email.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro de nível de risco
      if (filters.riskLevel !== 'all' && client.riskLevel !== filters.riskLevel) {
        return false;
      }

      // Filtro de status
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }

      // Filtro de score
      if (client.creditScore < filters.scoreRange[0] || client.creditScore > filters.scoreRange[1]) {
        return false;
      }

      // Filtro de limite de crédito
      if (client.creditLimit < filters.creditLimitMin || client.creditLimit > filters.creditLimitMax) {
        return false;
      }

      // Filtro de data
      if (filters.dateFrom && client.lastAnalysisDate < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && client.lastAnalysisDate > filters.dateTo) {
        return false;
      }

      // Filtro de análises recentes (últimos 30 dias)
      if (filters.showOnlyRecentAnalysis) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (client.lastAnalysisDate < thirtyDaysAgo) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const key = filters.sortBy as keyof Client;
      const aValue = a[key];
      const bValue = b[key];
      
      if (key === 'lastAnalysisDate') {
        const aTime = new Date(aValue as Date).getTime();
        const bTime = new Date(bValue as Date).getTime();
        return filters.sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [clients, filters]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
            Dashboard de Análise de Crédito
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Sistema Inteligente de Análise e Gestão de Crédito
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
          size="large"
        >
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </Box>

      {/* Métricas Principais */}
      <Box mb={4}>
        <MetricsCards stats={stats} />
      </Box>

      {/* Navegação por Tabs */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              px: 3,
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab
            icon={<DashboardIcon />}
            label="Visão Geral"
            iconPosition="start"
          />
          <Tab
            icon={<BarChart />}
            label="Gráficos e Análises"
            iconPosition="start"
          />
          <Tab
            icon={<TableChart />}
            label="Lista de Clientes"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Conteúdo das Tabs */}
      <TabPanel value={tabValue} index={0}>
        {/* Visão Geral - Resumo */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Resumo Executivo
                </Typography>
                <Typography variant="body1" mb={2}>
                  O sistema está processando <strong>{stats.totalClients}</strong> clientes com um score médio de <strong>{stats.averageScore}</strong> pontos. 
                  A taxa de aprovação atual é de <strong>{Math.round((stats.monthlyApprovals / (stats.monthlyApprovals + stats.monthlyRejections)) * 100)}%</strong>, 
                  demonstrando um excelente controle de risco.
                </Typography>
                <Box display="flex" gap={2} mt={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {stats.riskDistribution.low}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Baixo Risco
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {stats.riskDistribution.medium}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Médio Risco
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {stats.riskDistribution.high}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alto Risco
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Ações Rápidas
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button variant="outlined" startIcon={<DashboardIcon />} fullWidth>
                    Nova Análise de Crédito
                  </Button>
                  <Button variant="outlined" startIcon={<BarChart />} fullWidth>
                    Relatório Mensal
                  </Button>
                  <Button variant="outlined" startIcon={<Settings />} fullWidth>
                    Configurar Métricas
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Gráficos e Análises */}
        <ChartsSection stats={stats} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Lista de Clientes com Filtros */}
        <Box>
          <FiltersSection 
            onFiltersChange={handleFiltersChange}
            totalResults={filteredClients.length}
          />
          <ClientsTable clients={filteredClients} />
        </Box>
      </TabPanel>
    </Container>
  );
};

export default DashboardPageNew;