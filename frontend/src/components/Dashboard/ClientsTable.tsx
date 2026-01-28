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
  Edit,
  Assessment,
  FilterList
} from '@mui/icons-material';
import { Client } from '../../types';
import { useNavigate } from 'react-router-dom';

interface ClientsTableProps {
  clients: Client[];
}

type Order = 'asc' | 'desc';
type OrderBy = keyof Client;

const ClientsTable: React.FC<ClientsTableProps> = ({ clients }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('lastAnalysisDate');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, clientId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(clientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      if (orderBy === 'lastAnalysisDate') {
        const aValue = new Date(a[orderBy]).getTime();
        const bValue = new Date(b[orderBy]).getTime();
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'inactive': return 'Inativo';
      default: return status;
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return 'Baixo';
      case 'medium': return 'Médio';
      case 'high': return 'Alto';
      default: return risk;
    }
  };

  const headCells = [
    { id: 'name' as OrderBy, label: 'Cliente' },
    { id: 'creditScore' as OrderBy, label: 'Score' },
    { id: 'riskLevel' as OrderBy, label: 'Risco' },
    { id: 'creditLimit' as OrderBy, label: 'Limite' },
    { id: 'status' as OrderBy, label: 'Status' },
    { id: 'lastAnalysisDate' as OrderBy, label: 'Última Análise' },
  ];

  return (
    <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Cabeçalho com busca */}
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
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedClients.map((client) => (
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
                      {client.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {client.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {client.document}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: getScoreColor(client.creditScore),
                        fontWeight: 'bold'
                      }}
                    >
                      {client.creditScore}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(client.creditScore / 850) * 100}
                      sx={{
                        width: 80,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(client.creditScore),
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getRiskText(client.riskLevel)}
                    color={getRiskColor(client.riskLevel) as any}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    R$ {client.creditLimit.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(client.status)}
                    color={getStatusColor(client.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {client.lastAnalysisDate.toLocaleDateString('pt-BR')}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Mais opções">
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
            ))}
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
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => selectedClient && navigate(`/client/${selectedClient}`)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          Visualizar Detalhes
        </MenuItem>
        <MenuItem onClick={() => selectedClient && navigate(`/client/${selectedClient}`)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Editar Cliente
        </MenuItem>
        <MenuItem onClick={() => selectedClient && navigate(`/client/${selectedClient}`)}>
          <Assessment sx={{ mr: 1 }} fontSize="small" />
          Nova Análise
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ClientsTable;