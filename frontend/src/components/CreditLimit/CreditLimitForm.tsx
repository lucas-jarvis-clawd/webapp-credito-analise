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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Person,
  Assessment,
  MonetizationOn,
  CheckCircle,
  Warning,
  Error,
  TrendingUp,
  AccountBalance,
  Calculate,
  Save,
  Cancel,
  Info
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '../../types';

const steps = [
  'Dados do Cliente',
  'Análise de Risco',
  'Configuração do Limite',
  'Confirmação'
];

// Mock client data
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

interface CreditLimitRequest {
  clientId: string;
  requestedLimit: number;
  reason: string;
  justification: string;
  analysisType: 'automatic' | 'manual' | 'hybrid';
  urgency: 'low' | 'medium' | 'high';
  validUntil: Date;
}

const CreditLimitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client] = useState<Client>(mockClient);
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [formData, setFormData] = useState<CreditLimitRequest>({
    clientId: id || '',
    requestedLimit: client.creditLimit,
    reason: '',
    justification: '',
    analysisType: 'automatic',
    urgency: 'medium',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  });

  const [riskAnalysis, setRiskAnalysis] = useState({
    debtToIncomeRatio: (client.totalDebt / client.monthlyIncome) * 100,
    creditUtilization: (client.totalDebt / client.creditLimit) * 100,
    recommendedLimit: 0,
    riskFactors: [] as string[],
    approvalProbability: 85
  });

  useEffect(() => {
    // Calculate recommended limit based on score and income
    const baseLimit = client.monthlyIncome * 3; // 3x monthly income
    const scoreMultiplier = client.creditScore / 850; // Score factor
    const recommended = Math.round(baseLimit * scoreMultiplier);
    
    const factors: string[] = [];
    
    if (riskAnalysis.debtToIncomeRatio > 40) {
      factors.push('Alta relação dívida/renda');
    }
    if (riskAnalysis.creditUtilization > 80) {
      factors.push('Alta utilização de crédito atual');
    }
    if (client.creditScore < 600) {
      factors.push('Score de crédito baixo');
    }

    setRiskAnalysis(prev => ({
      ...prev,
      recommendedLimit: recommended,
      riskFactors: factors
    }));
  }, [client, riskAnalysis.debtToIncomeRatio, riskAnalysis.creditUtilization]);

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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Submitting credit limit request:', formData);
    
    setIsSubmitting(false);
    setShowConfirmDialog(false);
    navigate(`/client/${client.id}`);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getLimitRecommendation = () => {
    const requested = formData.requestedLimit;
    const recommended = riskAnalysis.recommendedLimit;
    
    if (requested <= recommended * 0.8) {
      return { type: 'success', message: 'Limite conservador e seguro' };
    } else if (requested <= recommended) {
      return { type: 'info', message: 'Limite dentro do recomendado' };
    } else if (requested <= recommended * 1.2) {
      return { type: 'warning', message: 'Limite ligeiramente acima do recomendado' };
    } else {
      return { type: 'error', message: 'Limite muito acima do recomendado' };
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                  {client.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  {client.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {client.document}
                </Typography>
                <Chip
                  label={client.status}
                  color={client.status === 'active' ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2">Score de Crédito</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      {client.creditScore}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MonetizationOn sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="subtitle2">Renda Mensal</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      R$ {client.monthlyIncome.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <AccountBalance sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="subtitle2">Limite Atual</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      R$ {client.creditLimit.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Error sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant="subtitle2">Dívida Total</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="error.main">
                      R$ {client.totalDebt.toLocaleString()}
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
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Análise de Risco
                  </Typography>
                  
                  <Box mb={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Relação Dívida/Renda: {riskAnalysis.debtToIncomeRatio.toFixed(1)}%
                    </Typography>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <Slider
                            value={riskAnalysis.debtToIncomeRatio}
                            max={100}
                            disabled
                            sx={{
                              '& .MuiSlider-thumb': {
                                color: riskAnalysis.debtToIncomeRatio > 40 ? 'error.main' : 'success.main'
                              },
                              '& .MuiSlider-track': {
                                color: riskAnalysis.debtToIncomeRatio > 40 ? 'error.main' : 'success.main'
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Utilização de Crédito: {riskAnalysis.creditUtilization.toFixed(1)}%
                    </Typography>
                    <Slider
                      value={riskAnalysis.creditUtilization}
                      max={100}
                      disabled
                      sx={{
                        '& .MuiSlider-thumb': {
                          color: riskAnalysis.creditUtilization > 80 ? 'error.main' : 'success.main'
                        },
                        '& .MuiSlider-track': {
                          color: riskAnalysis.creditUtilization > 80 ? 'error.main' : 'success.main'
                        }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box textAlign="center">
                    <Typography variant="subtitle2" color="text.secondary">
                      Probabilidade de Aprovação
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" color="success.main">
                      {riskAnalysis.approvalProbability}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Calculate sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Limite Recomendado
                  </Typography>
                  
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      R$ {riskAnalysis.recommendedLimit.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Baseado em renda e score
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {riskAnalysis.riskFactors.length > 0 ? (
                    <>
                      <Typography variant="subtitle2" color="warning.main" gutterBottom>
                        <Warning sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                        Fatores de Atenção
                      </Typography>
                      <List dense>
                        {riskAnalysis.riskFactors.map((factor, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Warning color="warning" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={factor}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  ) : (
                    <Alert severity="success">
                      <Typography variant="body2">
                        Perfil de baixo risco. Cliente elegível para limites elevados.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        const limitRec = getLimitRecommendation();
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuração do Limite de Crédito
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Limite Solicitado"
                        type="number"
                        value={formData.requestedLimit}
                        onChange={(e) => setFormData(prev => ({ ...prev, requestedLimit: Number(e.target.value) }))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                      />
                      <Alert severity={limitRec.type as any} sx={{ mt: 1 }}>
                        {limitRec.message}
                      </Alert>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Análise</InputLabel>
                        <Select
                          value={formData.analysisType}
                          label="Tipo de Análise"
                          onChange={(e) => setFormData(prev => ({ ...prev, analysisType: e.target.value as any }))}
                        >
                          <MenuItem value="automatic">Automática</MenuItem>
                          <MenuItem value="manual">Manual</MenuItem>
                          <MenuItem value="hybrid">Híbrida</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Urgência</InputLabel>
                        <Select
                          value={formData.urgency}
                          label="Urgência"
                          onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                        >
                          <MenuItem value="low">Baixa</MenuItem>
                          <MenuItem value="medium">Média</MenuItem>
                          <MenuItem value="high">Alta</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Válido Até"
                        type="date"
                        value={formData.validUntil.toISOString().split('T')[0]}
                        onChange={(e) => setFormData(prev => ({ ...prev, validUntil: new Date(e.target.value) }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Motivo da Solicitação</InputLabel>
                        <Select
                          value={formData.reason}
                          label="Motivo da Solicitação"
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        >
                          <MenuItem value="increase_income">Aumento de renda</MenuItem>
                          <MenuItem value="score_improvement">Melhoria do score</MenuItem>
                          <MenuItem value="relationship_time">Tempo de relacionamento</MenuItem>
                          <MenuItem value="payment_history">Histórico de pagamento</MenuItem>
                          <MenuItem value="special_campaign">Campanha especial</MenuItem>
                          <MenuItem value="competitor_offer">Oferta da concorrência</MenuItem>
                          <MenuItem value="other">Outro</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Justificativa Detalhada"
                        multiline
                        rows={4}
                        value={formData.justification}
                        onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                        placeholder="Descreva os motivos técnicos e comerciais para esta solicitação..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Resumo da Análise
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Limite Atual
                    </Typography>
                    <Typography variant="h6">
                      R$ {client.creditLimit.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Limite Recomendado
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      R$ {riskAnalysis.recommendedLimit.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Limite Solicitado
                    </Typography>
                    <Typography variant="h6" color={limitRec.type + '.main'}>
                      R$ {formData.requestedLimit.toLocaleString()}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Chip
                    label={`${client.riskLevel.toUpperCase()} RISCO`}
                    color={getRiskColor(client.riskLevel) as any}
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  />
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
                Confirmação da Solicitação
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Dados do Cliente
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nome:</strong> {client.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Documento:</strong> {client.document}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Score:</strong> {client.creditScore}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nível de Risco:</strong> {client.riskLevel}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Configuração do Limite
                    </Typography>
                    <Typography variant="body2">
                      <strong>Limite Atual:</strong> R$ {client.creditLimit.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Novo Limite:</strong> R$ {formData.requestedLimit.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Variação:</strong> {formData.requestedLimit > client.creditLimit ? '+' : ''}
                      R$ {(formData.requestedLimit - client.creditLimit).toLocaleString()}
                      ({((formData.requestedLimit - client.creditLimit) / client.creditLimit * 100).toFixed(1)}%)
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tipo:</strong> {formData.analysisType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Urgência:</strong> {formData.urgency}
                    </Typography>
                  </Paper>
                </Grid>

                {formData.justification && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Justificativa
                      </Typography>
                      <Typography variant="body2">
                        {formData.justification}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Configuração de Limite de Crédito
        </Typography>
        <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </Box>

      {/* Stepper */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Box sx={{ mb: 3 }}>
        {renderStepContent(activeStep)}
      </Box>

      {/* Navigation */}
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
              disabled={!formData.reason || !formData.justification}
              startIcon={<Save />}
            >
              Solicitar Aprovação
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Próximo
            </Button>
          )}
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirmar Solicitação</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza de que deseja solicitar a alteração do limite de crédito de{' '}
            <strong>{client.name}</strong> para{' '}
            <strong>R$ {formData.requestedLimit.toLocaleString()}</strong>?
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