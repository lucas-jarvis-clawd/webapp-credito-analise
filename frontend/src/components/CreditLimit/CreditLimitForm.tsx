import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Assessment,
  MonetizationOn,
  CheckCircle,
  TrendingUp,
  AccountBalance,
  Save,
  Cancel,
  Info,
  ArrowBack,
  Refresh
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import type { Client, ScoreResult } from '../../types';
import { clientsAPI, scoreAPI, limitsAPI } from '../../services/api';

const steps = [
  'Dados do Cliente',
  'Analise de Score',
  'Solicitar Limite',
  'Confirmacao'
];

const CreditLimitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = id ? parseInt(id, 10) : 0;

  const [client, setClient] = useState<Client | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    limiteSolicitado: 0,
    motivo: ''
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

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
        setFormData(prev => ({
          ...prev,
          limiteSolicitado: clientResponse.data.data.limite_credito
        }));
      }

      try {
        const scoreResponse = await scoreAPI.getLatest(clientId);
        if (scoreResponse.data.success) {
          setScoreResult(scoreResponse.data.data);
        }
      } catch {
        // Score not calculated yet
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao carregar dados do cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await limitsAPI.request({
        cliente_id: clientId,
        limite_solicitado: formData.limiteSolicitado,
        motivo: formData.motivo
      });

      if (response.data.success) {
        setSubmitSuccess(true);
        setShowConfirmDialog(false);
        setTimeout(() => {
          navigate(`/client/${clientId}`);
        }, 2000);
      } else {
        setError('Falha ao enviar solicitacao.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao enviar solicitacao de limite.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const getClassificacaoColor = (classificacao?: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (classificacao) {
      case 'EXCELENTE': return 'success';
      case 'BOM': return 'info';
      case 'REGULAR': return 'warning';
      case 'RUIM': return 'error';
      case 'PESSIMO': return 'error';
      default: return 'default';
    }
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

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                  {client.nome.charAt(0)}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  {client.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {client.cpf_cnpj}
                </Typography>
                <Chip
                  label={client.status}
                  color={client.status === 'ATIVO' ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
                <Chip
                  label={client.tipo}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, ml: 1 }}
                />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2">Score de Credito</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      {scoreResult ? scoreResult.score_final : 'Nao calculado'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Assessment sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="subtitle2">Classificacao</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {scoreResult ? `${scoreResult.classificacao}` : '-'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <AccountBalance sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="subtitle2">Limite Atual</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      R$ {client.limite_credito.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MonetizationOn sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="subtitle2">Faturamento Estimado</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {client.faturamento_estimado ? `R$ ${client.faturamento_estimado.toLocaleString()}` : '-'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Analise de Score
                  </Typography>

                  {scoreResult ? (
                    <>
                      <Box textAlign="center" mb={3}>
                        <Typography variant="h3" fontWeight="bold" color="primary.main">
                          {scoreResult.score_final}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          Score Final
                        </Typography>
                        <Chip
                          label={`${scoreResult.classificacao}`}
                          color={getClassificacaoColor(scoreResult.classificacao)}
                          sx={{ mt: 1, fontWeight: 'bold' }}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" gutterBottom>
                        Metricas do Score
                      </Typography>
                      {Object.entries(scoreResult.metricas).map(([key, value]) => (
                        <Box key={key} display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {Math.round(value * 100) / 100}
                          </Typography>
                        </Box>
                      ))}
                    </>
                  ) : (
                    <Alert severity="info">
                      Score ainda nao calculado para este cliente.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informacoes do Cliente
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Limite Atual</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      R$ {client.limite_credito.toLocaleString()}
                    </Typography>
                  </Box>

                  {client.segmento_textil && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Segmento Textil</Typography>
                      <Typography variant="body1">{client.segmento_textil}</Typography>
                    </Box>
                  )}

                  {client.tipo_negocio && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Tipo de Negocio</Typography>
                      <Typography variant="body1">{client.tipo_negocio}</Typography>
                    </Box>
                  )}

                  {client.faturamento_estimado && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Faturamento Estimado</Typography>
                      <Typography variant="body1">R$ {client.faturamento_estimado.toLocaleString()}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Solicitacao de Limite de Credito
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Limite Solicitado"
                        type="number"
                        value={formData.limiteSolicitado}
                        onChange={(e) => setFormData(prev => ({ ...prev, limiteSolicitado: Number(e.target.value) }))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                      />
                      {formData.limiteSolicitado > client.limite_credito && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          Aumento de R$ {(formData.limiteSolicitado - client.limite_credito).toLocaleString()} solicitado
                        </Alert>
                      )}
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Motivo da Solicitacao"
                        multiline
                        rows={4}
                        value={formData.motivo}
                        onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                        placeholder="Descreva os motivos para esta solicitacao de limite de credito..."
                        required
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Resumo
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Limite Atual
                    </Typography>
                    <Typography variant="h6">
                      R$ {client.limite_credito.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Limite Solicitado
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      R$ {formData.limiteSolicitado.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Variacao
                    </Typography>
                    <Typography variant="h6" color={formData.limiteSolicitado >= client.limite_credito ? 'success.main' : 'error.main'}>
                      {formData.limiteSolicitado >= client.limite_credito ? '+' : ''}
                      R$ {(formData.limiteSolicitado - client.limite_credito).toLocaleString()}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {scoreResult && (
                    <Chip
                      label={`${scoreResult.classificacao}`}
                      color={getClassificacaoColor(scoreResult.classificacao)}
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary.main">
                <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                Confirmacao da Solicitacao
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Dados do Cliente
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nome:</strong> {client.nome}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Documento:</strong> {client.cpf_cnpj}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Score:</strong> {scoreResult ? scoreResult.score_final : 'Nao calculado'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Classificacao:</strong> {scoreResult ? scoreResult.classificacao : '-'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Solicitacao de Limite
                    </Typography>
                    <Typography variant="body2">
                      <strong>Limite Atual:</strong> R$ {client.limite_credito.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Novo Limite:</strong> R$ {formData.limiteSolicitado.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Variacao:</strong> {formData.limiteSolicitado > client.limite_credito ? '+' : ''}
                      R$ {(formData.limiteSolicitado - client.limite_credito).toLocaleString()}
                      {client.limite_credito > 0 && (
                        <> ({((formData.limiteSolicitado - client.limite_credito) / client.limite_credito * 100).toFixed(1)}%)</>
                      )}
                    </Typography>
                  </Paper>
                </Grid>

                {formData.motivo && (
                  <Grid size={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Motivo
                      </Typography>
                      <Typography variant="body2">
                        {formData.motivo}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );

      default:
        return 'Passo desconhecido';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Solicitacao de Limite de Credito
        </Typography>
        <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Solicitacao de limite enviada com sucesso! Redirecionando...
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box sx={{ mb: 3 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Voltar
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setShowConfirmDialog(true)}
              disabled={!formData.motivo || formData.limiteSolicitado <= 0 || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
            >
              {isSubmitting ? 'Enviando...' : 'Solicitar Aprovacao'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Proximo
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirmar Solicitacao</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza de que deseja solicitar a alteracao do limite de credito de{' '}
            <strong>{client.nome}</strong> para{' '}
            <strong>R$ {formData.limiteSolicitado.toLocaleString()}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreditLimitForm;
