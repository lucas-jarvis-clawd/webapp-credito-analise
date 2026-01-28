// Interfaces para as tabelas do Oracle

export interface FDuplicata {
  id: number;
  cliente_id: number;
  numero_duplicata: string;
  valor: number;
  data_vencimento: Date;
  data_emissao: Date;
  status: 'ABERTA' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FPagamento {
  id: number;
  duplicata_id: number;
  valor_pago: number;
  data_pagamento: Date;
  forma_pagamento: 'DINHEIRO' | 'PIX' | 'TRANSFERENCIA' | 'CARTAO' | 'BOLETO';
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

// Interfaces para o sistema de scoring

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string;
  tipo: 'PF' | 'PJ';
  email?: string;
  telefone?: string;
  endereco?: string;
  limite_credito: number;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  created_at: Date;
  updated_at: Date;
}

export interface ScoreMetrics {
  pontuacao_interna: number;
  historico_pagamentos: number;
  valor_medio_duplicatas: number;
  prazo_medio_pagamento: number;
}

export interface ScoreWeights {
  pontuacao: number;
  historico: number;
  valor: number;
  prazo: number;
}

export interface ScoreResult {
  cliente_id: number;
  score_final: number;
  metricas: ScoreMetrics;
  ponderacoes: ScoreWeights;
  classificacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' | 'PÉSSIMO';
  data_calculo: Date;
}

export interface LimiteCredito {
  id: number;
  cliente_id: number;
  limite_atual: number;
  limite_solicitado?: number;
  limite_aprovado?: number;
  data_aprovacao?: Date;
  aprovado_por?: string;
  motivo?: string;
  status: 'ATIVO' | 'PENDENTE' | 'REJEITADO';
  created_at: Date;
  updated_at: Date;
}

// Interface para autenticação (mock AD)
export interface User {
  id: number;
  username: string;
  email: string;
  nome: string;
  perfil: 'ADMIN' | 'ANALISTA' | 'CONSULTOR';
  ativo: boolean;
}