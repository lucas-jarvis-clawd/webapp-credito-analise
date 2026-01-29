import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Person,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Assessment
} from '@mui/icons-material';
import type { DashboardStats } from '../../types';

interface MetricsCardsProps {
  stats: DashboardStats;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ stats }) => {
  const totalDecisions = stats.totalApprovedThisMonth + stats.totalRejectedThisMonth;
  const approvalRate = totalDecisions > 0
    ? Math.round((stats.totalApprovedThisMonth / totalDecisions) * 100)
    : 0;

  const metrics = [
    {
      title: 'Total de Clientes',
      value: stats.totalClients.toLocaleString(),
      icon: <Person />,
      color: 'primary.main',
      trend: `${stats.activeClients} ativos`
    },
    {
      title: 'Clientes Ativos',
      value: stats.activeClients,
      icon: <Assessment />,
      color: 'info.main',
      trend: `${stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}% do total`
    },
    {
      title: 'Score Medio',
      value: stats.averageScore,
      icon: <TrendingUp />,
      color: 'success.main',
      trend: 'Media geral dos clientes',
      progress: stats.averageScore
    },
    {
      title: 'Taxa de Aprovacao',
      value: `${approvalRate}%`,
      icon: <CheckCircle />,
      color: 'success.main',
      trend: `${stats.totalApprovedThisMonth} aprovacoes`,
      progress: approvalRate
    },
    {
      title: 'Aprovados Este Mes',
      value: stats.totalApprovedThisMonth,
      icon: <CheckCircle />,
      color: 'success.main',
      trend: 'Limites aprovados'
    },
    {
      title: 'Rejeitados Este Mes',
      value: stats.totalRejectedThisMonth,
      icon: <Cancel />,
      color: 'error.main',
      trend: 'Limites rejeitados'
    },
    {
      title: 'Limites Pendentes',
      value: stats.totalPendingLimits,
      icon: <HourglassEmpty />,
      color: 'warning.main',
      trend: 'Aguardando aprovacao'
    },
    {
      title: 'Risco Alto',
      value: `${(stats.riskDistribution?.['RUIM'] || 0) + (stats.riskDistribution?.['PESSIMO'] || 0)}`,
      icon: <TrendingDown />,
      color: 'error.main',
      trend: 'Clientes RUIM + PESSIMO'
    }
  ];

  return (
    <Grid container spacing={3}>
      {metrics.map((metric, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Card
            elevation={3}
            sx={{
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {metric.title}
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {metric.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: metric.color, width: 48, height: 48 }}>
                  {metric.icon}
                </Avatar>
              </Box>

              {metric.progress && (
                <Box mb={1}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(metric.progress, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: metric.color,
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                {metric.trend}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricsCards;
