import React, { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  Avatar,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  LinearProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  MoreVert,
  Search,
  Visibility,
  CreditCard
} from '@mui/icons-material';
import type { Client } from '../../types';
import { useNavigate } from 'react-router-dom';

interface ClientsTableProps {
  clients: Client[];
}

type Order = 'asc' | 'desc';

const ClientsTable: React.FC<ClientsTableProps> = ({ clients }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<string>('score_final');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, clientId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(clientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf_cnpj.includes(searchTerm) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      const aValue = a[orderBy as keyof Client];
      const bValue = b[orderBy as keyof Client];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return order === 'asc' ? -1 : 1;
      if (bValue == null) return order === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [filteredClients, order, orderBy]);

  const paginatedClients = useMemo(() => {
    return sortedClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedClients, page, rowsPerPage]);

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

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'ATIVO': return 'success';
      case 'INATIVO': return 'warning';
      case 'BLOQUEADO': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score && score !== 0) return '#757575';
    if (score >= 80) return '#4caf50';
    if (score >= 65) return '#2196f3';
    if (score >= 50) return '#ff9800';
    if (score >= 30) return '#ff5722';
    return '#f44336';
  };

  const headCells = [
    { id: 'nome', label: 'Cliente' },
    { id: 'score_final', label: 'Score' },
    { id: 'classificacao', label: 'Classificacao' },
    { id: 'limite_credito', label: 'Limite' },
    { id: 'status', label: 'Status' },
    { id: 'tipo', label: 'Tipo' },
  ];

  return (
    <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header with search */}
      <Box p={3} borderBottom="1px solid" borderColor="divider">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Lista de Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredClients.length} cliente(s) encontrado(s)
          </Typography>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nome, documento ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer>
        <Table stickyHeader aria-label="clientes table">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}>
                Acoes
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum cliente encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client) => (
                <TableRow
                  hover
                  key={client.id}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => navigate(`/client/${client.id}`)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        {client.nome.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {client.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.cpf_cnpj}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: getScoreColor(client.score_final),
                          fontWeight: 'bold'
                        }}
                      >
                        {client.score_final ?? '-'}
                      </Typography>
                      {client.score_final != null && (
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(client.score_final, 100)}
                          sx={{
                            width: 80,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getScoreColor(client.score_final),
                              borderRadius: 2
                            }
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {client.classificacao ? (
                      <Chip
                        label={client.classificacao}
                        color={getClassificacaoColor(client.classificacao)}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      R$ {client.limite_credito.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.status}
                      color={getStatusColor(client.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.tipo}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Mais opcoes">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, client.id);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredClients.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por pagina:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      {/* Actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => selectedClient && navigate(`/client/${selectedClient}`)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          Analise do Cliente
        </MenuItem>
        <MenuItem onClick={() => selectedClient && navigate(`/client/${selectedClient}/credit-limit`)}>
          <CreditCard sx={{ mr: 1 }} fontSize="small" />
          Configurar Limite
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ClientsTable;
