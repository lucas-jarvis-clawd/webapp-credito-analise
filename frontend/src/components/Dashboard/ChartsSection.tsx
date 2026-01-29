import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { DashboardStats } from '../../types';

interface ChartsSectionProps {
  stats: DashboardStats;
}

const RISK_COLORS: Record<string, string> = {
  'EXCELENTE': '#4caf50',
  'BOM': '#2196f3',
  'REGULAR': '#ff9800',
  'RUIM': '#ff5722',
  'PESSIMO': '#f44336',
};

const ChartsSection: React.FC<ChartsSectionProps> = ({ stats }) => {
  // Build risk distribution data from the backend's riskDistribution map
  const riskData = Object.entries(stats.riskDistribution || {}).map(([name, value]) => ({
    name: name,
    value: value,
    color: RISK_COLORS[name] || '#9e9e9e'
  }));

  // Build score distribution from clients data
  const scoreRanges = [
    { range: '0-29', min: 0, max: 29 },
    { range: '30-49', min: 30, max: 49 },
    { range: '50-64', min: 50, max: 64 },
    { range: '65-79', min: 65, max: 79 },
    { range: '80-100', min: 80, max: 100 },
  ];

  const scoreDistribution = scoreRanges.map(range => {
    const count = (stats.clients || []).filter(
      c => (c.score_final || 0) >= range.min && (c.score_final || 0) <= range.max
    ).length;
    return {
      range: range.range,
      count,
      percentage: stats.clients?.length ? Math.round((count / stats.clients.length) * 100) : 0
    };
  });

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Score Distribution */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card elevation={3} sx={{ height: '400px' }}>
          <CardContent sx={{ height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Distribuicao de Scores de Credito
              </Typography>
              <Chip
                label={`${(stats.clients || []).length} clientes`}
                color="primary"
                size="small"
              />
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={scoreDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number, name: string | undefined) => [
                    name === 'count' ? `${value} clientes` : `${value}%`,
                    name === 'count' ? 'Quantidade' : 'Percentual'
                  ]}
                  labelStyle={{ color: '#666', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="count"
                  fill="#2196f3"
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Distribution */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card elevation={3} sx={{ height: '400px' }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Distribuicao de Risco
            </Typography>
            {riskData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="65%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [`${value}`, 'Clientes']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box mt={1} display="flex" flexDirection="column" gap={1}>
                  {riskData.map((item, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1}>
                      <Box
                        width={12}
                        height={12}
                        borderRadius="50%"
                        sx={{ backgroundColor: item.color }}
                      />
                      <Typography variant="body2">
                        {item.name}: {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="80%">
                <Typography variant="body2" color="text.secondary">
                  Sem dados de distribuicao de risco
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ChartsSection;
