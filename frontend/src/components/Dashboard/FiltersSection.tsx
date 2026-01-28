import React, { useState } from 'react';
import {
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Button,
  Chip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  DateRange,
  TrendingUp
} from '@mui/icons-material';
// import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { ptBR } from 'date-fns/locale';

interface FiltersSectionProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
}

export interface FilterState {
  searchTerm: string;
  riskLevel: string;
  status: string;
  scoreRange: [number, number];
  creditLimitMin: number;
  creditLimitMax: number;
  dateFrom: Date | null;
  dateTo: Date | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showOnlyRecentAnalysis: boolean;
}

const FiltersSection: React.FC<FiltersSectionProps> = ({ onFiltersChange, totalResults }) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    riskLevel: 'all',
    status: 'all',
    scoreRange: [300, 850],
    creditLimitMin: 0,
    creditLimitMax: 100000,
    dateFrom: null,
    dateTo: null,
    sortBy: 'lastAnalysisDate',
    sortOrder: 'desc',
    showOnlyRecentAnalysis: false
  });

  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterState = {
      searchTerm: '',
      riskLevel: 'all',
      status: 'all',
      scoreRange: [300, 850],
      creditLimitMin: 0,
      creditLimitMax: 100000,
      dateFrom: null,
      dateTo: null,
      sortBy: 'lastAnalysisDate',
      sortOrder: 'desc',
      showOnlyRecentAnalysis: false
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.riskLevel !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.scoreRange[0] !== 300 || filters.scoreRange[1] !== 850) count++;
    if (filters.creditLimitMin > 0 || filters.creditLimitMax < 100000) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.showOnlyRecentAnalysis) count++;
    return count;
  };

  return (
    <Paper elevation={3} sx={{ mb: 3 }}>
      {/* Filtros básicos */}
      <Box p={3}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nome, documento ou email..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Nível de Risco</InputLabel>
              <Select
                value={filters.riskLevel}
                label="Nível de Risco"
                onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="low">Baixo</MenuItem>
                <MenuItem value="medium">Médio</MenuItem>
                <MenuItem value="high">Alto</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setExpanded(!expanded)}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                Filtros Avançados
                {getActiveFiltersCount() > 0 && (
                  <Chip 
                    label={getActiveFiltersCount()} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Button>
              
              <Button
                variant="text"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                size="small"
                color="secondary"
              >
                Limpar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Resultados */}
        <Box mt={2} display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            {totalResults} resultado(s) encontrado(s)
          </Typography>
          
          {getActiveFiltersCount() > 0 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              {filters.riskLevel !== 'all' && (
                <Chip 
                  label={`Risco: ${filters.riskLevel}`}
                  onDelete={() => handleFilterChange('riskLevel', 'all')}
                  size="small"
                />
              )}
              {filters.status !== 'all' && (
                <Chip 
                  label={`Status: ${filters.status}`}
                  onDelete={() => handleFilterChange('status', 'all')}
                  size="small"
                />
              )}
              {filters.showOnlyRecentAnalysis && (
                <Chip 
                  label="Análises Recentes"
                  onDelete={() => handleFilterChange('showOnlyRecentAnalysis', false)}
                  size="small"
                />
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Filtros avançados */}
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ display: 'none' }}>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Faixa de Score */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Faixa de Score de Crédito
              </Typography>
              <Box px={2}>
                <Slider
                  value={filters.scoreRange}
                  onChange={(_, value) => handleFilterChange('scoreRange', value)}
                  valueLabelDisplay="auto"
                  min={300}
                  max={850}
                  marks={[
                    { value: 300, label: '300' },
                    { value: 500, label: '500' },
                    { value: 700, label: '700' },
                    { value: 850, label: '850' }
                  ]}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption" color="text.secondary">
                  {filters.scoreRange[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filters.scoreRange[1]}
                </Typography>
              </Box>
            </Grid>

            {/* Limite de Crédito */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Limite de Crédito
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  label="Mínimo"
                  type="number"
                  size="small"
                  value={filters.creditLimitMin}
                  onChange={(e) => handleFilterChange('creditLimitMin', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
                <TextField
                  label="Máximo"
                  type="number"
                  size="small"
                  value={filters.creditLimitMax}
                  onChange={(e) => handleFilterChange('creditLimitMax', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Box>
            </Grid>

            {/* Período */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Período da Análise
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  label="De"
                  type="date"
                  size="small"
                  value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Até"
                  type="date"
                  size="small"
                  value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
            </Grid>

            {/* Ordenação */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Ordenação
              </Typography>
              <Box display="flex" gap={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Ordenar por"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="name">Nome</MenuItem>
                    <MenuItem value="creditScore">Score</MenuItem>
                    <MenuItem value="creditLimit">Limite</MenuItem>
                    <MenuItem value="lastAnalysisDate">Data da Análise</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small">
                  <InputLabel>Ordem</InputLabel>
                  <Select
                    value={filters.sortOrder}
                    label="Ordem"
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <MenuItem value="asc">Crescente</MenuItem>
                    <MenuItem value="desc">Decrescente</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            {/* Opções adicionais */}
            <Grid item xs={12}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Opções Adicionais
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.showOnlyRecentAnalysis}
                    onChange={(e) => handleFilterChange('showOnlyRecentAnalysis', e.target.checked)}
                  />
                }
                label="Mostrar apenas análises dos últimos 30 dias"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default FiltersSection;