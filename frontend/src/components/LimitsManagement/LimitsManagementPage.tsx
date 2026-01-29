import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Visibility
} from '@mui/icons-material';
import { limitsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import type { LimiteCredito } from '../../types';

const LimitsManagementPage: React.FC = () => {
  const [limits, setLimits] = useState<LimiteCredito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Approval dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<LimiteCredito | null>(null);
  const [approvedValue, setApprovedValue] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const loadPendingLimits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await limitsAPI.getPending();
      if (response.data.success) {
        setLimits(response.data.data || []);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao carregar limites pendentes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingLimits();
  }, []);

  const handleApproveClick = (limit: LimiteCredito) => {
    setSelectedLimit(limit);
    setApprovedValue(String(limit.limite_solicitado || 0));
    setApproveNotes('');
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (limit: LimiteCredito) => {
    setSelectedLimit(limit);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedLimit) return;
    setIsSubmitting(true);
    try {
      await limitsAPI.approve(selectedLimit.id, {
        limite_aprovado: parseFloat(approvedValue),
        observacoes: approveNotes || undefined
      });
      setSuccessMsg(`Limite #${selectedLimit.id} aprovado com sucesso.`);
      setApproveDialogOpen(false);
      loadPendingLimits();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao aprovar limite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedLimit || rejectReason.length < 10) return;
    setIsSubmitting(true);
    try {
      await limitsAPI.reject(selectedLimit.id, { motivo: rejectReason });
      setSuccessMsg(`Limite #${selectedLimit.id} rejeitado.`);
      setRejectDialogOpen(false);
      loadPendingLimits();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao rejeitar limite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary" mt={3}>
            Carregando limites pendentes...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
            Gestao de Limites de Credito
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Aprovar ou rejeitar solicitacoes de limite pendentes
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Refresh />} onClick={loadPendingLimits}>
          Atualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Limites Pendentes ({limits.length})
          </Typography>

          {limits.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography variant="body1" color="text.secondary">
                Nenhum limite pendente de aprovacao.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Limite Atual</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Solicitado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Motivo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Acoes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {limits.map((limit) => (
                    <TableRow key={limit.id} hover>
                      <TableCell>#{limit.id}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/client/${limit.cliente_id}`)}
                        >
                          Cliente #{limit.cliente_id}
                        </Button>
                      </TableCell>
                      <TableCell>
                        R$ {(limit.limite_atual || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="primary.main">
                          R$ {(limit.limite_solicitado || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {limit.motivo || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(limit.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Chip label={limit.status} color="warning" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApproveClick(limit)}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleRejectClick(limit)}
                          >
                            Rejeitar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aprovar Limite de Credito</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <TextField
              label="Valor Aprovado (R$)"
              type="number"
              fullWidth
              value={approvedValue}
              onChange={(e) => setApprovedValue(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Observacoes (opcional)"
              fullWidth
              multiline
              rows={3}
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveSubmit}
            disabled={isSubmitting || !approvedValue || parseFloat(approvedValue) <= 0}
          >
            {isSubmitting ? 'Aprovando...' : 'Confirmar Aprovacao'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeitar Limite de Credito</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <TextField
              label="Motivo da Rejeicao (minimo 10 caracteres)"
              fullWidth
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              error={rejectReason.length > 0 && rejectReason.length < 10}
              helperText={rejectReason.length > 0 && rejectReason.length < 10 ? 'Minimo 10 caracteres' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectSubmit}
            disabled={isSubmitting || rejectReason.length < 10}
          >
            {isSubmitting ? 'Rejeitando...' : 'Confirmar Rejeicao'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LimitsManagementPage;
