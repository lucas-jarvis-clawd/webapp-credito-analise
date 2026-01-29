import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Slider,
  Divider,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Save,
  Restore,
  Info,
  Settings,
  Assessment
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { MetricConfiguration } from '../../types';
import { configAPI } from '../../services/api';

const METRIC_DEFINITIONS: Record<string, { name: string; description: string }> = {
  historico_pagamentos: {
    name: 'Historico de Pagamentos',
    description: 'Avalia o comportamento de pagamentos do cliente ao longo do tempo'
  },
  tempo_relacionamento: {
    name: 'Tempo de Relacionamento',
    description: 'Considera o tempo total de relacionamento comercial com o cliente'
  },
  tendencia_volume: {
    name: 'Tendencia de Volume',
    description: 'Analisa a tendencia de volume de compras do cliente'
  },
  prazo_medio_pagamento: {
    name: 'Prazo Medio de Pagamento',
    description: 'Avalia os prazos medios de pagamento praticados'
  },
  indice_sazonalidade: {
    name: 'Indice de Sazonalidade',
    description: 'Considera os padroes sazonais do negocio textil'
  },
  referencia_comercial: {
    name: 'Referencia Comercial',
    description: 'Avalia referencias comerciais do cliente no mercado'
  },
  capacidade_estimada: {
    name: 'Capacidade Estimada',
    description: 'Estima a capacidade de credito baseada no faturamento'
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const MetricsConfigPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricConfiguration[]>([]);
  const [originalWeights, setOriginalWeights] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const totalWeight = metrics
    .filter(m => m.isActive)
    .reduce((sum, metric) => sum + metric.weight, 0);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await configAPI.getScoring();
      if (response.data.success) {
        const config = response.data.data;
        const weights = config.pesos || {};

        const metricsFromConfig: MetricConfiguration[] = Object.entries(weights).map(([key, weight]) => ({
          id: key,
          name: METRIC_DEFINITIONS[key]?.name || key,
          key: key,
          weight: Math.round((weight as number) * 100),
          isActive: true,
          description: METRIC_DEFINITIONS[key]?.description || ''
        }));

        if (metricsFromConfig.length === 0) {
          const defaultMetrics: MetricConfiguration[] = Object.entries(METRIC_DEFINITIONS).map(([key, def]) => ({
            id: key,
            name: def.name,
            key: key,
            weight: Math.round(100 / Object.keys(METRIC_DEFINITIONS).length),
            isActive: true,
            description: def.description
          }));
          setMetrics(defaultMetrics);
        } else {
          setMetrics(metricsFromConfig);
        }

        const origWeights: Record<string, number> = {};
        Object.entries(weights).forEach(([key, value]) => {
          origWeights[key] = Math.round((value as number) * 100);
        });
        setOriginalWeights(origWeights);
        setHasChanges(false);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao carregar configuracao de scoring.');
      const defaultMetrics: MetricConfiguration[] = Object.entries(METRIC_DEFINITIONS).map(([key, def]) => ({
        id: key,
        name: def.name,
        key: key,
        weight: Math.round(100 / Object.keys(METRIC_DEFINITIONS).length),
        isActive: true,
        description: def.description
      }));
      setMetrics(defaultMetrics);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    setMetrics(prev => prev.map(metric =>
      metric.id === id ? { ...metric, weight: newWeight } : metric
    ));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const weights: Record<string, number> = {};
      metrics
        .filter(m => m.isActive)
        .forEach(m => {
          weights[m.key] = m.weight / 100;
        });

      await configAPI.updateScoringWeights(weights);
      setSuccessMessage('Configuracao salva com sucesso!');
      setHasChanges(false);

      const origWeights: Record<string, number> = {};
      metrics.forEach(m => {
        origWeights[m.key] = m.weight;
      });
      setOriginalWeights(origWeights);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao salvar configuracao.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToOriginal = () => {
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      weight: originalWeights[metric.key] || metric.weight
    })));
    setHasChanges(false);
    setSuccessMessage(null);
  };

  const normalizeWeights = () => {
    const activeMetrics = metrics.filter(m => m.isActive);
    const currentTotal = activeMetrics.reduce((sum, metric) => sum + metric.weight, 0);

    if (currentTotal !== 100 && currentTotal > 0) {
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
    if (totalWeight === 100) return { color: 'success' as const, message: 'Configuracao valida' };
    if (totalWeight > 100) return { color: 'error' as const, message: `Excesso de ${totalWeight - 100}%` };
    return { color: 'warning' as const, message: `Faltam ${100 - totalWeight}%` };
  };

  const weightStatus = getWeightStatus();

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary" mt={3}>
            Carregando configuracao de metricas...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          <Settings sx={{ mr: 2, verticalAlign: 'middle' }} />
          Configuracao de Metricas
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Restore />}
            onClick={handleResetToOriginal}
            disabled={!hasChanges}
          >
            Restaurar
          </Button>
          <Button
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSaveConfiguration}
            disabled={!hasChanges || totalWeight !== 100 || isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Configuracao'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Alert
        severity={weightStatus.color}
        sx={{ mb: 3 }}
        action={
          totalWeight !== 100 ? (
            <Button color="inherit" size="small" onClick={normalizeWeights}>
              Normalizar
            </Button>
          ) : undefined
        }
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body1">
            <strong>Peso Total: {totalWeight}%</strong> - {weightStatus.message}
          </Typography>
          {hasChanges && (
            <Chip label="Alteracoes nao salvas" color="warning" size="small" />
          )}
        </Box>
      </Alert>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Configuracao das Metricas Texteis (7 metricas)
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metrica</TableCell>
                      <TableCell>Descricao</TableCell>
                      <TableCell align="center" sx={{ width: 250 }}>Peso (%)</TableCell>
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
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {metric.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ width: 250 }}>
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
                Visualizacao de Pesos
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Distribuicao de Pesos
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Bar dataKey="weight" fill="#2196f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contribuicao por Metrica
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
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Distribuicao Visual
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
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
                Resumo da Configuracao
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Metricas Ativas
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
                      ? `Adicione ${100 - totalWeight}% para completar a configuracao`
                      : `Reduza ${totalWeight - 100}% para balancear os pesos`
                    }
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MetricsConfigPage;
