import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Paper,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Restore,
  Info,
  Warning,
  Settings,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { MetricConfiguration } from '../../types';

// Mock data
const mockMetrics: MetricConfiguration[] = [
  {
    id: '1',
    name: 'Histórico de Pagamento',
    weight: 35,
    isActive: true,
    formula: 'payment_history_score * 0.35'
  },
  {
    id: '2',
    name: 'Utilização de Crédito',
    weight: 30,
    isActive: true,
    formula: '(1 - credit_utilization_ratio) * 0.30'
  },
  {
    id: '3',
    name: 'Tempo de Relacionamento',
    weight: 15,
    isActive: true,
    formula: 'relationship_years * 0.15'
  },
  {
    id: '4',
    name: 'Diversificação de Crédito',
    weight: 10,
    isActive: true,
    formula: 'credit_mix_score * 0.10'
  },
  {
    id: '5',
    name: 'Renda vs Gastos',
    weight: 10,
    isActive: true,
    formula: 'income_expense_ratio * 0.10'
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MetricsConfigPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricConfiguration[]>(mockMetrics);
  const [editingMetric, setEditingMetric] = useState<MetricConfiguration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [totalWeight, setTotalWeight] = useState(100);

  useEffect(() => {
    const activeMetrics = metrics.filter(m => m.isActive);
    const total = activeMetrics.reduce((sum, metric) => sum + metric.weight, 0);
    setTotalWeight(total);
  }, [metrics]);

  const handleWeightChange = (id: string, newWeight: number) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === id ? { ...metric, weight: newWeight } : metric
    ));
    setHasChanges(true);
  };

  const handleActiveChange = (id: string, isActive: boolean) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === id ? { ...metric, isActive } : metric
    ));
    setHasChanges(true);
  };

  const handleEditMetric = (metric: MetricConfiguration) => {
    setEditingMetric({ ...metric });
    setIsDialogOpen(true);
  };

  const handleSaveMetric = () => {
    if (editingMetric) {
      if (editingMetric.id) {
        // Edit existing
        setMetrics(prev => prev.map(m => m.id === editingMetric.id ? editingMetric : m));
      } else {
        // Add new
        const newMetric = {
          ...editingMetric,
          id: Date.now().toString()
        };
        setMetrics(prev => [...prev, newMetric]);
      }
      setHasChanges(true);
    }
    setIsDialogOpen(false);
    setEditingMetric(null);
  };

  const handleDeleteMetric = (id: string) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
    setHasChanges(true);
  };

  const handleAddNewMetric = () => {
    setEditingMetric({
      id: '',
      name: '',
      weight: 5,
      isActive: true,
      formula: ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveConfiguration = () => {
    // Here would be the API call to save configuration
    console.log('Saving configuration:', metrics);
    setHasChanges(false);
  };

  const handleResetToDefaults = () => {
    setMetrics(mockMetrics);
    setHasChanges(true);
  };

  const normalizeWeights = () => {
    const activeMetrics = metrics.filter(m => m.isActive);
    const currentTotal = activeMetrics.reduce((sum, metric) => sum + metric.weight, 0);
    
    if (currentTotal !== 100) {
      const factor = 100 / currentTotal;
      setMetrics(prev => prev.map(metric => 
        metric.isActive 
          ? { ...metric, weight: Math.round(metric.weight * factor) }
          : metric
      ));
      setHasChanges(true);
    }
  };

  const chartData = metrics
    .filter(m => m.isActive)
    .map((metric, index) => ({
      name: metric.name,
      weight: metric.weight,
      color: COLORS[index % COLORS.length]
    }));

  const getWeightStatus = () => {
    if (totalWeight === 100) return { color: 'success', message: 'Configuração válida' };
    if (totalWeight > 100) return { color: 'error', message: `Excesso de ${totalWeight - 100}%` };
    return { color: 'warning', message: `Faltam ${100 - totalWeight}%` };
  };

  const weightStatus = getWeightStatus();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          <Settings sx={{ mr: 2, verticalAlign: 'middle' }} />
          Configuração de Métricas
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Restore />}
            onClick={handleResetToDefaults}
          >
            Restaurar Padrões
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveConfiguration}
            disabled={!hasChanges || totalWeight !== 100}
          >
            Salvar Configuração
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      <Alert 
        severity={weightStatus.color as any} 
        sx={{ mb: 3 }}
        action={
          totalWeight !== 100 && (
            <Button color="inherit" size="small" onClick={normalizeWeights}>
              Normalizar
            </Button>
          )
        }
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body1">
            <strong>Peso Total: {totalWeight}%</strong> - {weightStatus.message}
          </Typography>
          {hasChanges && (
            <Chip label="Alterações não salvas" color="warning" size="small" />
          )}
        </Box>
      </Alert>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} lg={8}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Configuração das Métricas
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddNewMetric}
                >
                  Nova Métrica
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Métrica</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Peso (%)</TableCell>
                      <TableCell align="center">Fórmula</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {metric.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={metric.isActive}
                                onChange={(e) => handleActiveChange(metric.id, e.target.checked)}
                                size="small"
                              />
                            }
                            label=""
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ width: 200 }}>
                          <Box sx={{ px: 2 }}>
                            <Slider
                              value={metric.weight}
                              onChange={(_, value) => handleWeightChange(metric.id, value as number)}
                              min={0}
                              max={50}
                              step={1}
                              disabled={!metric.isActive}
                              valueLabelDisplay="auto"
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {metric.weight}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={metric.formula}>
                            <Typography variant="caption" 
                              sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}
                            >
                              {metric.formula}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditMetric(metric)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteMetric(metric.id)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card elevation={3} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Simulação de Impacto
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cenário: Cliente com Score 750
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Bar dataKey="weight" fill="#2196f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contribuição por Métrica
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    maxHeight: 200,
                    overflowY: 'auto'
                  }}>
                    {metrics
                      .filter(m => m.isActive)
                      .sort((a, b) => b.weight - a.weight)
                      .map((metric, index) => (
                        <Box key={metric.id} display="flex" alignItems="center" gap={2}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                          <Typography variant="body2" flexGrow={1}>
                            {metric.name}
                          </Typography>
                          <Chip 
                            label={`${metric.weight}%`} 
                            size="small"
                            color="primary"
                          />
                        </Box>
                      ))
                    }
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Visual Summary */}
        <Grid item xs={12} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Distribuição Visual
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, weight }) => `${weight}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="weight"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                Resumo da Configuração
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Métricas Ativas
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {metrics.filter(m => m.isActive).length}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Peso Total
                </Typography>
                <Typography variant="h4" color={weightStatus.color + '.main'}>
                  {totalWeight}%
                </Typography>
              </Box>

              {totalWeight !== 100 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {totalWeight < 100 
                      ? `Adicione ${100 - totalWeight}% para completar a configuração`
                      : `Reduza ${totalWeight - 100}% para balancear os pesos`
                    }
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMetric?.id ? 'Editar Métrica' : 'Nova Métrica'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome da Métrica"
            fullWidth
            variant="outlined"
            value={editingMetric?.name || ''}
            onChange={(e) => setEditingMetric(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
          <TextField
            margin="dense"
            label="Peso (%)"
            type="number"
            fullWidth
            variant="outlined"
            inputProps={{ min: 0, max: 50 }}
            value={editingMetric?.weight || 0}
            onChange={(e) => setEditingMetric(prev => prev ? { ...prev, weight: Number(e.target.value) } : null)}
          />
          <TextField
            margin="dense"
            label="Fórmula de Cálculo"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editingMetric?.formula || ''}
            onChange={(e) => setEditingMetric(prev => prev ? { ...prev, formula: e.target.value } : null)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingMetric?.isActive || false}
                onChange={(e) => setEditingMetric(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
              />
            }
            label="Métrica Ativa"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveMetric} 
            variant="contained"
            disabled={!editingMetric?.name || !editingMetric?.formula}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MetricsConfigPage;