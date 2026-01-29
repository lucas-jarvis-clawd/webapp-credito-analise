// Types for the Credit Analysis System - aligned with backend API

export interface User {
  id: number;
  username: string;
  email: string;
  nome: string;
  perfil: 'ADMIN' | 'ANALISTA' | 'CONSULTOR';
}

export interface Client {
  id: number;
  nome: string;
  cpf_cnpj: string;
  tipo: 'PF' | 'PJ';
  email?: string;
  telefone?: string;
  endereco?: string;
  limite_credito: number;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  segmento_textil?: string;
  tipo_negocio?: string;
  faturamento_estimado?: number;
  created_at: string;
  updated_at: string;
  // These may come from dashboard endpoint
  score_final?: number;
  classificacao?: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' | 'PESSIMO';
}

export interface ScoreMetrics {
  historico_pagamentos: number;
  tempo_relacionamento: number;
  tendencia_volume: number;
  prazo_medio_pagamento: number;
  indice_sazonalidade: number;
  referencia_comercial: number;
  capacidade_estimada: number;
}

export interface ScoreWeights {
  historico_pagamentos: number;
  tempo_relacionamento: number;
  tendencia_volume: number;
  prazo_medio_pagamento: number;
  indice_sazonalidade: number;
  referencia_comercial: number;
  capacidade_estimada: number;
}

export interface ScoreResult {
  cliente_id: number;
  score_final: number;
  metricas: ScoreMetrics;
  ponderacoes: ScoreWeights;
  classificacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' | 'PESSIMO';
  data_calculo: string;
  confiabilidade?: {
    nivel: 'ALTO' | 'MEDIO' | 'BAIXO' | 'INSUFICIENTE';
    score: number;
    fatores: {
      qtd_duplicatas: number;
      qtd_pagamentos: number;
      qtd_referencias: number;
      meses_historico: number;
    };
  };
}

export interface ScoreHistory {
  date: string;
  score: number;
  classificacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' | 'PESSIMO';
}

export interface LimiteCredito {
  id: number;
  cliente_id: number;
  limite_atual?: number;
  limite_solicitado?: number;
  limite_aprovado?: number;
  data_aprovacao?: string;
  aprovado_por?: string;
  motivo?: string;
  status: 'ATIVO' | 'PENDENTE' | 'REJEITADO';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  averageScore: number;
  riskDistribution: Record<string, number>;
  totalPendingLimits: number;
  totalApprovedThisMonth: number;
  totalRejectedThisMonth: number;
  clients: Client[];
}

export interface MetricConfiguration {
  id: string;
  name: string;
  key: string;
  weight: number;
  isActive: boolean;
  description: string;
}
