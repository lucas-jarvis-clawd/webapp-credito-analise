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
  CardContent,
  CircularProgress,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Refresh,
  Dashboard as DashboardIcon,
  TableChart,
  BarChart,
  Settings
} from '@mui/icons-material';
import type { Client, DashboardStats } from '../../types';
import { dashboardAPI } from '../../services/api';
import MetricsCards from './MetricsCards';
import ChartsSection from './ChartsSection';
import ClientsTable from './ClientsTable';
import FiltersSection from './FiltersSection';
import type { FilterState } from './FiltersSection';
import { useNavigate } from 'react-router-dom';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    classificacao: 'all',
    status: 'all',
    scoreRange: [0, 100],
    creditLimitMin: 0,
    creditLimitMax: 1000000,
    tipo: 'all',
    sortBy: 'score_final',
    sortOrder: 'desc'
  });
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError('Falha ao carregar dados do dashboard.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao conectar com o servidor. Verifique se o backend esta rodando.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const clients = stats?.clients || [];

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search filter
      if (filters.searchTerm &&
        !client.nome.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
        !client.cpf_cnpj.includes(filters.searchTerm) &&
        !(client.email || '').toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Classificacao filter
      if (filters.classificacao !== 'all' && client.classificacao !== filters.classificacao) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }

      // Type filter
      if (filters.tipo !== 'all' && client.tipo !== filters.tipo) {
        return false;
      }

      // Score range filter
      const score = client.score_final || 0;
      if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) {
        return false;
      }

      // Credit limit filter
      if (client.limite_credito < filters.creditLimitMin || client.limite_credito > filters.creditLimitMax) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const key = filters.sortBy as keyof Client;
      const aValue = a[key];
      const bValue = b[key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return filters.sortOrder === 'asc' ? -1 : 1;
      if (bValue == null) return filters.sortOrder === 'asc' ? 1 : -1;

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box>
          {/* Skeleton metrics cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map(i => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rounded" height={120} />
              </Grid>
            ))}
          </Grid>
          {/* Skeleton charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
          </Grid>
          {/* Skeleton table */}
          <Skeleton variant="rounded" height={400} />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            {error}
          </Alert>
          <Button variant="contained" startIcon={<Refresh />} onClick={handleRefresh}>
            Tentar Novamente
          </Button>
        </Box>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

  const totalDecisions = stats.totalApprovedThisMonth + stats.totalRejectedThisMonth;
  const approvalRate = totalDecisions > 0
    ? Math.round((stats.totalApprovedThisMonth / totalDecisions) * 100)
    : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
            Dashboard de Analise de Credito
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Sistema Inteligente de Analise e Gestao de Credito
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

      {/* Main Metrics */}
      <Box mb={4}>
        <MetricsCards stats={stats} />
      </Box>

      {/* Tab Navigation */}
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
            label="Visao Geral"
            iconPosition="start"
          />
          <Tab
            icon={<BarChart />}
            label="Graficos e Analises"
            iconPosition="start"
          />
          <Tab
            icon={<TableChart />}
            label="Lista de Clientes"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Overview - Summary */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Resumo Executivo
                </Typography>
                <Typography variant="body1" mb={2}>
                  O sistema esta processando <strong>{stats.totalClients}</strong> clientes com um score medio de <strong>{stats.averageScore}</strong> pontos.
                  {totalDecisions > 0 && (
                    <> A taxa de aprovacao atual e de <strong>{approvalRate}%</strong>,
                    demonstrando controle de risco.</>
                  )}
                </Typography>
                <Box display="flex" gap={2} mt={3}>
                  {Object.entries(stats.riskDistribution || {}).map(([key, value]) => (
                    <Box key={key} textAlign="center">
                      <Typography variant="h4" fontWeight="bold" color={
                        key === 'EXCELENTE' ? 'success.main' :
                        key === 'BOM' ? 'info.main' :
                        key === 'REGULAR' ? 'warning.main' :
                        'error.main'
                      }>
                        {value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {key}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Acoes Rapidas
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button variant="outlined" startIcon={<DashboardIcon />} fullWidth onClick={() => navigate('/dashboard')}>
                    Atualizar Dashboard
                  </Button>
                  <Button variant="outlined" startIcon={<BarChart />} fullWidth onClick={() => setTabValue(1)}>
                    Ver Graficos
                  </Button>
                  <Button variant="outlined" startIcon={<Settings />} fullWidth onClick={() => navigate('/metrics-config')}>
                    Configurar Metricas
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Charts */}
        <ChartsSection stats={stats} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Clients List with Filters */}
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
