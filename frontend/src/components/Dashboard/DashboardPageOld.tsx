import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Paper,
  Divider
} from '@mui/material';
import {
  Search,
  Person,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Assessment,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { Client, DashboardStats } from '../../types';
import { useNavigate } from 'react-router-dom';

// Mock data for demonstration
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

const DashboardPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(mockClients);
  const [stats] = useState<DashboardStats>(mockStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 700) return '#4caf50';
    if (score >= 600) return '#ff9800';
    return '#f44336';
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Dashboard de Análise de Crédito
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Clientes
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.totalClients.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Análises Ativas
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.activeAnalyses}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Assessment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Score Médio
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.averageScore}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Taxa de Aprovação
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                    {Math.round((stats.monthlyApprovals / (stats.monthlyApprovals + stats.monthlyRejections)) * 100)}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <AccountBalance />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Buscar por nome, documento ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              fullWidth
            >
              Filtros Avançados
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Client Cards */}
      <Grid container spacing={3}>
        {filteredClients.map((client) => (
          <Grid item xs={12} sm={6} lg={4} key={client.id}>
            <Card 
              elevation={3} 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
              onClick={() => navigate(`/client/${client.id}`)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {client.name.charAt(0)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" component="div">
                      {client.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {client.document}
                    </Typography>
                  </Box>
                  <Chip
                    label={client.status}
                    color={getStatusColor(client.status) as any}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Score de Crédito
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getScoreColor(client.creditScore), fontWeight: 'bold' }}
                    >
                      {client.creditScore}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(client.creditScore / 850) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(client.creditScore),
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Limite de Crédito
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      R$ {client.creditLimit.toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={client.riskLevel}
                    color={getRiskColor(client.riskLevel) as any}
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="caption" color="text.secondary">
                  Última análise: {client.lastAnalysisDate.toLocaleDateString('pt-BR')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredClients.length === 0 && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary" mb={1}>
            Nenhum cliente encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tente ajustar os termos de busca ou filtros
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default DashboardPage;