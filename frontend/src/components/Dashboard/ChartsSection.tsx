import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
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
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { DashboardStats } from '../../types';

interface ChartsSectionProps {
  stats: DashboardStats;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ stats }) => {
  // Dados para gráfico de distribuição de scores
  const scoreDistribution = [
    { range: '300-400', count: 45, percentage: 8 },
    { range: '401-500', count: 78, percentage: 14 },
    { range: '501-600', count: 156, percentage: 28 },
    { range: '601-700', count: 189, percentage: 34 },
    { range: '701-800', count: 98, percentage: 18 },
    { range: '801-850', count: 23, percentage: 4 }
  ];

  // Dados para gráfico de risco
  const riskData = [
    { name: 'Baixo Risco', value: stats.riskDistribution.low, color: '#4caf50' },
    { name: 'Médio Risco', value: stats.riskDistribution.medium, color: '#ff9800' },
    { name: 'Alto Risco', value: stats.riskDistribution.high, color: '#f44336' }
  ];

  // Dados para evolução temporal (mockado)
  const monthlyData = [
    { month: 'Jan', approvals: 145, rejections: 25, avgScore: 652 },
    { month: 'Fev', approvals: 167, rejections: 18, avgScore: 661 },
    { month: 'Mar', approvals: 178, rejections: 22, avgScore: 665 },
    { month: 'Abr', approvals: 156, rejections: 31, avgScore: 658 },
    { month: 'Mai', approvals: 189, rejections: 19, avgScore: 672 },
    { month: 'Jun', approvals: 198, rejections: 15, avgScore: 678 }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
      {/* Distribuição de Scores */}
      <Grid item xs={12} lg={8}>
        <Card elevation={3} sx={{ height: '400px' }}>
          <CardContent sx={{ height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Distribuição de Scores de Crédito
              </Typography>
              <Chip 
                label={`${scoreDistribution.reduce((acc, item) => acc + item.count, 0)} clientes`}
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
                  formatter={(value, name) => [
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

      {/* Distribuição de Risco */}
      <Grid item xs={12} lg={4}>
        <Card elevation={3} sx={{ height: '400px' }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Distribuição de Risco
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
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
                  formatter={(value) => [`${value}%`, 'Percentual']}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box mt={2} display="flex" flexDirection="column" gap={1}>
              {riskData.map((item, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1}>
                  <Box 
                    width={12} 
                    height={12} 
                    borderRadius="50%" 
                    sx={{ backgroundColor: item.color }}
                  />
                  <Typography variant="body2">
                    {item.name}: {item.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Evolução Temporal */}
      <Grid item xs={12}>
        <Card elevation={3} sx={{ height: '350px' }}>
          <CardContent sx={{ height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Evolução Mensal - Aprovações vs. Rejeições
              </Typography>
              <Box display="flex" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={12} height={12} sx={{ backgroundColor: '#4caf50' }} />
                  <Typography variant="body2">Aprovações</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={12} height={12} sx={{ backgroundColor: '#f44336' }} />
                  <Typography variant="body2">Rejeições</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={12} height={12} sx={{ backgroundColor: '#2196f3' }} />
                  <Typography variant="body2">Score Médio</Typography>
                </Box>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
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
                />
                <Bar 
                  yAxisId="left"
                  dataKey="approvals" 
                  fill="#4caf50"
                  radius={[2, 2, 0, 0]}
                  fillOpacity={0.7}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="rejections" 
                  fill="#f44336"
                  radius={[2, 2, 0, 0]}
                  fillOpacity={0.7}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#2196f3"
                  strokeWidth={3}
                  dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ChartsSection;