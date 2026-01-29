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
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Assessment,
  TrendingUp,
  CheckCircle,
  AccountBalance,
  CreditCard,
  Phone,
  Email,
  Refresh,
  Calculate
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { Client, ScoreResult, ScoreHistory } from '../../types';
import { clientsAPI, scoreAPI } from '../../services/api';

interface ClientStatistics {
  total_duplicatas: number;
  duplicatas_pagas: number;
  duplicatas_vencidas: number;
  duplicatas_abertas: number;
  valor_medio_duplicatas: number;
  valor_total_duplicatas: number;
  total_pagamentos: number;
  valor_medio_pagamentos: number;
  prazo_medio_pagamento_dias: number;
}

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

const METRIC_LABELS: Record<string, string> = {
  historico_pagamentos: 'Historico de Pagamentos',
  tempo_relacionamento: 'Tempo de Relacionamento',
  tendencia_volume: 'Tendencia de Volume',
  prazo_medio_pagamento: 'Prazo Medio de Pagamento',
  indice_sazonalidade: 'Indice de Sazonalidade',
  referencia_comercial: 'Referencia Comercial',
  capacidade_estimada: 'Capacidade Estimada'
};

const ClientAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);

  const clientId = id ? parseInt(id, 10) : 0;

  const loadData = async () => {
    if (!clientId) {
      setError('ID do cliente invalido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const clientResponse = await clientsAPI.getById(clientId);
      if (clientResponse.data.success) {
        setClient(clientResponse.data.data);
      }

      try {
        const scoreResponse = await scoreAPI.getLatest(clientId);
        if (scoreResponse.data.success) {
          setScoreResult(scoreResponse.data.data);
        }
      } catch {
        // Score not calculated yet
      }

      try {
        const historyResponse = await scoreAPI.getHistory(clientId);
        if (historyResponse.data.success) {
          setScoreHistory(historyResponse.data.data || []);
        }
      } catch {
        // No history yet
      }

      try {
        const statsResponse = await clientsAPI.getStatistics(clientId);
        if (statsResponse.data.success) {
          setStatistics(statsResponse.data.data);
        }
      } catch {
        // Statistics not available
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao carregar dados do cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleCalculateScore = async () => {
    if (!clientId) return;
    setIsCalculating(true);
    try {
      const response = await scoreAPI.calculate(clientId);
      if (response.data.success) {
        setScoreResult(response.data.data);
        try {
          const historyResponse = await scoreAPI.getHistory(clientId);
          if (historyResponse.data.success) {
            setScoreHistory(historyResponse.data.data || []);
          }
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao calcular score.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getClassificacaoColor = (classificacao?: string) => {
    switch (classificacao) {
      case 'EXCELENTE': return '#4caf50';
      case 'BOM': return '#2196f3';
      case 'REGULAR': return '#ff9800';
      case 'RUIM': return '#ff5722';
      case 'PESSIMO': return '#f44336';
      default: return '#757575';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 65) return '#2196f3';
    if (score >= 50) return '#ff9800';
    if (score >= 30) return '#ff5722';
    return '#f44336';
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary" mt={3}>
            Carregando dados do cliente...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error && !client) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            {error}
          </Alert>
          <Box display="flex" gap={2}>
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
              Voltar
            </Button>
            <Button variant="contained" startIcon={<Refresh />} onClick={loadData}>
              Tentar Novamente
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!client) return null;

  const chartData = scoreHistory.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    score: item.score,
    classificacao: item.classificacao
  }));

  const metricsData = scoreResult
    ? Object.entries(scoreResult.metricas).map(([key, value]) => ({
        key,
        name: METRIC_LABELS[key] || key,
        value: Math.round(value * 100) / 100,
        weight: scoreResult.ponderacoes[key as keyof typeof scoreResult.ponderacoes]
          ? Math.round(scoreResult.ponderacoes[key as keyof typeof scoreResult.ponderacoes] * 100)
          : 0
      }))
    : [];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary" flexGrow={1}>
          Analise de Credito - {client.nome}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={isCalculating ? <CircularProgress size={20} /> : <Calculate />}
            onClick={handleCalculateScore}
            disabled={isCalculating}
          >
            {isCalculating ? 'Calculando...' : 'Calcular Score'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/client/${client.id}/credit-limit`)}
          >
            Solicitar Limite
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Client Info Card */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main', mb: 2 }}>
                  {client.nome.charAt(0)}
                </Avatar>
                <Chip
                  label={client.status}
                  color={client.status === 'ATIVO' ? 'success' : client.status === 'BLOQUEADO' ? 'error' : 'warning'}
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  label={client.tipo === 'PF' ? 'Pessoa Fisica' : 'Pessoa Juridica'}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                {client.nome}
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <CreditCard sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">{client.cpf_cnpj}</Typography>
              </Box>
              {client.email && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">{client.email}</Typography>
                </Box>
              )}
              {client.telefone && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">{client.telefone}</Typography>
                </Box>
              )}
              {client.segmento_textil && (
                <Box mt={1}>
                  <Chip label={`Segmento: ${client.segmento_textil}`} size="small" variant="outlined" />
                </Box>
              )}
              {client.tipo_negocio && (
                <Box mt={1}>
                  <Chip label={`Negocio: ${client.tipo_negocio}`} size="small" variant="outlined" />
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box textAlign="center">
                {scoreResult ? (
                  <>
                    <Typography variant="h3" component="div" sx={{ color: getScoreColor(scoreResult.score_final), fontWeight: 'bold' }}>
                      {scoreResult.score_final}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Score de Credito
                    </Typography>
                    <Box sx={{ backgroundColor: getClassificacaoColor(scoreResult.classificacao), color: 'white', p: 1, borderRadius: 2, mt: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Classificacao: {scoreResult.classificacao}
                      </Typography>
                    </Box>
                    {scoreResult.confiabilidade && (
                      <Tooltip title={`Confiabilidade dos dados: ${scoreResult.confiabilidade.score}/100 - ${scoreResult.confiabilidade.fatores.qtd_duplicatas} duplicatas, ${scoreResult.confiabilidade.fatores.qtd_pagamentos} pagamentos, ${scoreResult.confiabilidade.fatores.qtd_referencias} referencias, ${scoreResult.confiabilidade.fatores.meses_historico} meses`}>
                        <Chip
                          label={`Confianca: ${scoreResult.confiabilidade.nivel}`}
                          size="small"
                          color={
                            scoreResult.confiabilidade.nivel === 'ALTO' ? 'success' :
                            scoreResult.confiabilidade.nivel === 'MEDIO' ? 'info' :
                            scoreResult.confiabilidade.nivel === 'BAIXO' ? 'warning' : 'error'
                          }
                          sx={{ ml: 1, mt: 1 }}
                        />
                      </Tooltip>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Calculado em: {new Date(scoreResult.data_calculo).toLocaleDateString('pt-BR')}
                    </Typography>
                  </>
                ) : (
                  <Box>
                    <Typography variant="h6" color="text.secondary">
                      Score nao calculado
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Calculate />}
                      onClick={handleCalculateScore}
                      sx={{ mt: 1 }}
                      disabled={isCalculating}
                    >
                      Calcular Agora
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    R$ {client.limite_credito.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Limite de Credito
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {client.faturamento_estimado ? `R$ ${client.faturamento_estimado.toLocaleString()}` : '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Faturamento Estimado
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {scoreResult ? scoreResult.score_final : '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Score Atual
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ fontSize: 40, color: scoreResult ? getClassificacaoColor(scoreResult.classificacao) : 'grey.400', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {scoreResult ? `${scoreResult.classificacao}` : '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Classificacao
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
            <Tab label="Historico de Score" />
            <Tab label="Analise de Metricas" />
            <Tab label="Informacoes do Cliente" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Evolucao do Score de Credito
          </Typography>
          {chartData.length > 0 ? (
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
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
          ) : (
            <Box textAlign="center" py={6}>
              <Typography variant="body1" color="text.secondary">
                Nenhum historico de score disponivel. Calcule o score do cliente para gerar o primeiro registro.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Calculate />}
                onClick={handleCalculateScore}
                sx={{ mt: 2 }}
                disabled={isCalculating}
              >
                Calcular Score
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {scoreResult ? (
            <>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance das Metricas
                  </Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={metricsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2196f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Distribuicao de Pesos
                  </Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={metricsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="weight"
                        >
                          {metricsData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 50}, 70%, 50%)`} />
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
                Detalhes das Metricas (7 metricas texteis)
              </Typography>
              <Grid container spacing={2}>
                {metricsData.map((metric) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={metric.key}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {metric.name}
                        </Typography>
                        <Chip label={`${metric.weight}%`} size="small" color="primary" />
                      </Box>
                      <Box display="flex" alignItems="center">
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(metric.value, 100)}
                          sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {metric.value}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Box textAlign="center" py={6}>
              <Typography variant="body1" color="text.secondary">
                Nenhuma analise de metricas disponivel. Calcule o score primeiro.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Calculate />}
                onClick={handleCalculateScore}
                sx={{ mt: 2 }}
                disabled={isCalculating}
              >
                Calcular Score
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Dados Cadastrais
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">Nome</Typography>
                  <Typography variant="body1" fontWeight="bold">{client.nome}</Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">CPF/CNPJ</Typography>
                  <Typography variant="body1">{client.cpf_cnpj}</Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">Tipo</Typography>
                  <Typography variant="body1">{client.tipo === 'PF' ? 'Pessoa Fisica' : 'Pessoa Juridica'}</Typography>
                </Box>
                {client.email && (
                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{client.email}</Typography>
                  </Box>
                )}
                {client.telefone && (
                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">Telefone</Typography>
                    <Typography variant="body1">{client.telefone}</Typography>
                  </Box>
                )}
                {client.endereco && (
                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">Endereco</Typography>
                    <Typography variant="body1">{client.endereco}</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {statistics && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Estatisticas Financeiras
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {statistics.total_duplicatas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Duplicatas
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {statistics.duplicatas_pagas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pagas
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="error.main">
                        {statistics.duplicatas_vencidas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vencidas
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="warning.main">
                        {statistics.duplicatas_abertas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Abertas
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold">
                        R$ {statistics.valor_total_duplicatas.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Valor Total
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold">
                        R$ {statistics.valor_medio_duplicatas.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Valor Medio
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="info.main">
                        {statistics.total_pagamentos}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pagamentos
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color={statistics.prazo_medio_pagamento_dias > 7 ? 'error.main' : 'success.main'}>
                        {statistics.prazo_medio_pagamento_dias}d
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prazo Medio (dias)
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Dados Comerciais
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label={client.status} color={client.status === 'ATIVO' ? 'success' : 'warning'} size="small" />
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">Limite de Credito</Typography>
                  <Typography variant="body1" fontWeight="bold">R$ {client.limite_credito.toLocaleString()}</Typography>
                </Box>
                {client.segmento_textil && (
                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">Segmento Textil</Typography>
                    <Typography variant="body1">{client.segmento_textil}</Typography>
                  </Box>
                )}
                {client.tipo_negocio && (
                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">Tipo de Negocio</Typography>
                    <Typography variant="body1">{client.tipo_negocio}</Typography>
                  </Box>
                )}
                {client.faturamento_estimado && (
                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">Faturamento Estimado</Typography>
                    <Typography variant="body1">R$ {client.faturamento_estimado.toLocaleString()}</Typography>
                  </Box>
                )}
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">Cadastrado em</Typography>
                  <Typography variant="body1">{new Date(client.created_at).toLocaleDateString('pt-BR')}</Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">Ultima Atualizacao</Typography>
                  <Typography variant="body1">{new Date(client.updated_at).toLocaleDateString('pt-BR')}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Container>
  );
};

export default ClientAnalysisPage;
