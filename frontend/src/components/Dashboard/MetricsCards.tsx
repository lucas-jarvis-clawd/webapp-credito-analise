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
  AccountBalance,
  Assessment,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { DashboardStats } from '../../types';

interface MetricsCardsProps {
  stats: DashboardStats;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ stats }) => {
  const approvalRate = Math.round((stats.monthlyApprovals / (stats.monthlyApprovals + stats.monthlyRejections)) * 100);

  const metrics = [
    {
      title: 'Total de Clientes',
      value: stats.totalClients.toLocaleString(),
      icon: <Person />,
      color: 'primary.main',
      trend: '+12% este mês'
    },
    {
      title: 'Análises Ativas',
      value: stats.activeAnalyses,
      icon: <Assessment />,
      color: 'info.main',
      trend: `${stats.activeAnalyses} em andamento`
    },
    {
      title: 'Score Médio',
      value: stats.averageScore,
      icon: <TrendingUp />,
      color: 'success.main',
      trend: '+15 pontos vs. último mês',
      progress: (stats.averageScore / 850) * 100
    },
    {
      title: 'Taxa de Aprovação',
      value: `${approvalRate}%`,
      icon: <CheckCircle />,
      color: 'success.main',
      trend: `${stats.monthlyApprovals} aprovações`,
      progress: approvalRate
    },
    {
      title: 'Aprovações Este Mês',
      value: stats.monthlyApprovals,
      icon: <CheckCircle />,
      color: 'success.main',
      trend: 'Meta: 200'
    },
    {
      title: 'Rejeições Este Mês',
      value: stats.monthlyRejections,
      icon: <Cancel />,
      color: 'error.main',
      trend: 'Redução de 8%'
    },
    {
      title: 'Risco Baixo',
      value: `${stats.riskDistribution.low}%`,
      icon: <TrendingUp />,
      color: 'success.main',
      trend: 'Clientes baixo risco'
    },
    {
      title: 'Risco Alto',
      value: `${stats.riskDistribution.high}%`,
      icon: <TrendingDown />,
      color: 'error.main',
      trend: 'Clientes alto risco'
    }
  ];

  return (
    <Grid container spacing={3}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
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
                    value={metric.progress}
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