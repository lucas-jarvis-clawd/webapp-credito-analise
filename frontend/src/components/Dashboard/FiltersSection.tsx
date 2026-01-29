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
  InputAdornment
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore
} from '@mui/icons-material';

interface FiltersSectionProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
}

export interface FilterState {
  searchTerm: string;
  classificacao: string;
  status: string;
  scoreRange: [number, number];
  creditLimitMin: number;
  creditLimitMax: number;
  tipo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const FiltersSection: React.FC<FiltersSectionProps> = ({ onFiltersChange, totalResults }) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    classificacao: 'all',
    status: 'all',
    scoreRange: [0, 100],
    creditLimitMin: 0,
    creditLimitMax: 1000000,
    tipo: 'all',
    sortBy: 'score_final',
    sortOrder: 'desc'
  });

  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterState = {
      searchTerm: '',
      classificacao: 'all',
      status: 'all',
      scoreRange: [0, 100],
      creditLimitMin: 0,
      creditLimitMax: 1000000,
      tipo: 'all',
      sortBy: 'score_final',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.classificacao !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.tipo !== 'all') count++;
    if (filters.scoreRange[0] !== 0 || filters.scoreRange[1] !== 100) count++;
    if (filters.creditLimitMin > 0 || filters.creditLimitMax < 1000000) count++;
    return count;
  };

  return (
    <Paper elevation={3} sx={{ mb: 3 }}>
      {/* Basic filters */}
      <Box p={3}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
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

          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Classificacao</InputLabel>
              <Select
                value={filters.classificacao}
                label="Classificacao"
                onChange={(e) => handleFilterChange('classificacao', e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="EXCELENTE">Excelente</MenuItem>
                <MenuItem value="BOM">Bom</MenuItem>
                <MenuItem value="REGULAR">Regular</MenuItem>
                <MenuItem value="RUIM">Ruim</MenuItem>
                <MenuItem value="PESSIMO">Pessimo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="ATIVO">Ativo</MenuItem>
                <MenuItem value="INATIVO">Inativo</MenuItem>
                <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box display="flex" gap={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setExpanded(!expanded)}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                Filtros Avancados
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

        {/* Results */}
        <Box mt={2} display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            {totalResults} resultado(s) encontrado(s)
          </Typography>

          {getActiveFiltersCount() > 0 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              {filters.classificacao !== 'all' && (
                <Chip
                  label={`Classe: ${filters.classificacao}`}
                  onDelete={() => handleFilterChange('classificacao', 'all')}
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
              {filters.tipo !== 'all' && (
                <Chip
                  label={`Tipo: ${filters.tipo}`}
                  onDelete={() => handleFilterChange('tipo', 'all')}
                  size="small"
                />
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Advanced filters */}
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ display: 'none' }}>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Score Range */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Faixa de Score de Credito
              </Typography>
              <Box px={2}>
                <Slider
                  value={filters.scoreRange}
                  onChange={(_, value) => handleFilterChange('scoreRange', value)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 75, label: '75' },
                    { value: 100, label: '100' }
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

            {/* Credit Limit */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Limite de Credito
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  label="Minimo"
                  type="number"
                  size="small"
                  value={filters.creditLimitMin}
                  onChange={(e) => handleFilterChange('creditLimitMin', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
                <TextField
                  label="Maximo"
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

            {/* Type and Sort */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Tipo de Cliente
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.tipo}
                  label="Tipo"
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="PF">Pessoa Fisica</MenuItem>
                  <MenuItem value="PJ">Pessoa Juridica</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                Ordenacao
              </Typography>
              <Box display="flex" gap={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Ordenar por"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="nome">Nome</MenuItem>
                    <MenuItem value="score_final">Score</MenuItem>
                    <MenuItem value="limite_credito">Limite</MenuItem>
                    <MenuItem value="created_at">Data de Cadastro</MenuItem>
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
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default FiltersSection;
