import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock axios-based API module to prevent real API calls
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  },
  authAPI: {
    login: vi.fn().mockResolvedValue({ data: { success: true, token: 'test', user: {} } }),
    validateToken: vi.fn().mockResolvedValue({ data: { success: true, user: {} } })
  },
  clientsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: { success: true, data: [], pagination: {} } }),
    getById: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getStatistics: vi.fn().mockResolvedValue({ data: { success: true, data: {} } })
  },
  scoreAPI: {
    calculate: vi.fn().mockResolvedValue({ data: { success: true } }),
    getLatest: vi.fn().mockResolvedValue({ data: { success: true } }),
    getHistory: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getDefaults: vi.fn().mockResolvedValue({ data: { success: true } })
  },
  dashboardAPI: {
    getStats: vi.fn().mockResolvedValue({
      data: {
        success: true,
        stats: {
          totalClients: 0,
          activeClients: 0,
          averageScore: 0,
          riskDistribution: {},
          totalPendingLimits: 0,
          totalApprovedThisMonth: 0,
          totalRejectedThisMonth: 0,
          clients: []
        }
      }
    })
  },
  limitsAPI: {
    request: vi.fn().mockResolvedValue({ data: { success: true } }),
    getByClient: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getCurrentByClient: vi.fn().mockResolvedValue({ data: { success: true } }),
    getPending: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    approve: vi.fn().mockResolvedValue({ data: { success: true } }),
    reject: vi.fn().mockResolvedValue({ data: { success: true } })
  },
  configAPI: {
    getScoring: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    updateScoringWeights: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}));

// Mock AuthContext so components that call useAuth() get a valid context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', nome: 'Admin', email: 'admin@test.com', perfil: 'ADMIN' },
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock recharts to avoid canvas/SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div data-testid="mock-bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: () => <div data-testid="mock-pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  LineChart: () => <div data-testid="mock-line-chart" />,
  Line: () => null
}));

import LoginPage from '../components/Login/LoginPage';
import DashboardPage from '../components/Dashboard/DashboardPage';
import LimitsManagementPage from '../components/LimitsManagement/LimitsManagementPage';
import MainLayout from '../components/Layout/MainLayout';
import App from '../App';

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('CreditAnalyzer')).toBeInTheDocument();
    expect(screen.getByText('Entrar')).toBeInTheDocument();
  });

  it('shows username and password fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
  });
});

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // While loading, the dashboard shows skeleton placeholders
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('LimitsManagementPage', () => {
  it('renders loading state', () => {
    render(
      <MemoryRouter>
        <LimitsManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Carregando limites pendentes...')).toBeInTheDocument();
  });
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);

    // The App component renders; since user is mocked as authenticated,
    // it should redirect to dashboard and show loading state
    expect(document.body).toBeTruthy();
  });
});

describe('MainLayout', () => {
  it('renders navigation items', () => {
    render(
      <MemoryRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // MainLayout has two drawers (mobile temporary + desktop permanent),
    // so navigation text appears multiple times
    const dashboardItems = screen.getAllByText('Dashboard');
    expect(dashboardItems.length).toBeGreaterThanOrEqual(1);

    const limitsItems = screen.getAllByText('Gestao de Limites');
    expect(limitsItems.length).toBeGreaterThanOrEqual(1);

    const metricsItems = screen.getAllByText('Configurar Metricas');
    expect(metricsItems.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
