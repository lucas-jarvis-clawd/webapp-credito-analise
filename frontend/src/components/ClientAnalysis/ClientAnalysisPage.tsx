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
  Button,
  Paper,
  Divider,
  LinearProgress,
  IconButton,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  AccountBalance,
  CreditCard,
  Phone,
  Email
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Client, ScoreHistory, Metric, CreditAnalysis } from '../../types';

// Mock data
const mockClient: Client = {
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
};

const mockScoreHistory: ScoreHistory[] = [
  { date: new Date('2024-01-01'), score: 720, reason: 'Pagamento em dia' },
  { date: new Date('2024-01-05'), score: 735, reason: 'Redução de dívida' },
  { date: new Date('2024-01-10'), score: 750, reason: 'Novo histórico positivo' },
  { date: new Date('2024-01-15'), score: 765, reason: 'Aumento de renda' },
  { date: new Date('2024-01-20'), score: 780, reason: 'Perfil consolidado' }
];

const mockMetrics: Metric[] = [
  { id: '1', name: 'Histórico de Pagamento', weight: 35, value: 85, description: 'Pontualidade nos pagamentos', category: 'financial' },
  { id: '2', name: 'Utilização de Crédito', weight: 30, value: 40, description: 'Percentual do limite usado', category: 'financial' },
  { id: '3', name: 'Tempo de Relacionamento', weight: 15, value: 90, description: 'Tempo como cliente', category: 'behavioral' },
  { id: '4', name: 'Diversificação de Crédito', weight: 10, value: 75, description: 'Variedade de produtos', category: 'financial' },
  { id: '5', name: 'Renda vs Gastos', weight: 10, value: 88, description: 'Capacidade de pagamento', category: 'demographic' }
];

const mockAnalysis: CreditAnalysis = {
  clientId: '1',
  finalScore: 780,
  metrics: mockMetrics,
  recommendations: [
    'Cliente apresenta excelente histórico de pagamento',
    'Baixa utilização do crédito disponível indica responsabilidade',
    'Renda estável permite aumento do limite de crédito'
  ],
  riskFactors: [
    'Concentração de gastos em cartão de crédito'
  ],
  creditLimit: 15000,
  approvalStatus: 'approved',
  analysisDate: new Date('2024-01-20'),
  analystId: '2'
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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client] = useState<Client>(mockClient);
  const [scoreHistory] = useState<ScoreHistory[]>(mockScoreHistory);
  const [analysis] = useState<CreditAnalysis>(mockAnalysis);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#757575';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 700) return '#4caf50';
    if (score >= 600) return '#ff9800';
    return '#f44336';
  };

  const chartData = scoreHistory.map(item => ({
    date: item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    score: item.score,
    reason: item.reason
  }));

  const riskData = [
    { name: 'Baixo Risco', value: 70, color: '#4caf50' },
    { name: 'Médio Risco', value: 20, color: '#ff9800' },
    { name: 'Alto Risco', value: 10, color: '#f44336' }
  ];

  const metricsData = analysis.metrics.map(metric => ({
    name: metric.name,
    value: metric.value,
    weight: metric.weight
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary" flexGrow={1}>
          Análise de Crédito - {client.name}
        </Typography>
        <Button variant="contained" startIcon={<Edit />}>
          Editar Limite
        </Button>
      </Box>

      {/* Client Info Card */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main', mb: 2 }}>
                  {client.name.charAt(0)}
                </Avatar>
                <Chip
                  label={client.status}
                  color={client.status === 'active' ? 'success' : 'warning'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                {client.name}
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <CreditCard sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">{client.document}</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Email sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">{client.email}</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">{client.phone}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" component="div" sx={{ color: getScoreColor(client.creditScore), fontWeight: 'bold' }}>
                  {client.creditScore}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Score de Crédito
                </Typography>
                <Box sx={{ backgroundColor: getRiskColor(client.riskLevel), color: 'white', p: 1, borderRadius: 2, mt: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Risco: {client.riskLevel.toUpperCase()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    R$ {client.creditLimit.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Limite de Crédito
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Error sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    R$ {client.totalDebt.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Dívida Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    R$ {client.monthlyIncome.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Renda Mensal
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {Math.round(((client.creditLimit - client.totalDebt) / client.creditLimit) * 100)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Crédito Disponível
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Histórico de Score" />
            <Tab label="Análise de Métricas" />
            <Tab label="Recomendações" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Evolução do Score de Crédito
          </Typography>
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[500, 850]} />
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    value,
                    'Score',
                    props.payload.reason
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2196f3" 
                  strokeWidth={3}
                  dot={{ fill: '#2196f3', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Performance das Métricas
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Distribuição de Pesos
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={metricsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, weight }) => `${weight}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="weight"
                    >
                      {metricsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 70}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Detalhes das Métricas
          </Typography>
          <Grid container spacing={2}>
            {analysis.metrics.map((metric) => (
              <Grid item xs={12} sm={6} key={metric.id}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {metric.name}
                    </Typography>
                    <Chip label={`${metric.weight}%`} size="small" color="primary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {metric.description}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={metric.value}
                      sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {metric.value}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Status: {analysis.approvalStatus === 'approved' ? 'APROVADO' : 'REJEITADO'}
                </Typography>
                <Typography variant="body2">
                  Score Final: {analysis.finalScore} | Limite Sugerido: R$ {analysis.creditLimit.toLocaleString()}
                </Typography>
              </Alert>

              <Typography variant="h6" gutterBottom color="success.main">
                <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recomendações Positivas
              </Typography>
              <List>
                {analysis.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="warning.main">
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                Fatores de Risco
              </Typography>
              <List>
                {analysis.riskFactors.map((risk, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={risk} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Container>
  );
};

export default ClientAnalysisPage;