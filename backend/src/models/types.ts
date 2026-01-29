// ============================
// Interfaces para o sistema de crédito têxtil
// ============================

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
  segmento_textil?: 'MODA_FEMININA' | 'MODA_MASCULINA' | 'INFANTIL' | 'CAMA_MESA_BANHO' | 'TECIDOS' | 'AVIAMENTOS';
  tipo_negocio?: 'LOJA_FISICA' | 'AMBULANTE' | 'ONLINE' | 'MISTO';
  faturamento_estimado?: number;
  created_at: Date;
  updated_at: Date;
}

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

export interface ScoreHistorico {
  id: number;
  cliente_id: number;
  score_final: number;
  historico_pagamentos: number;
  tempo_relacionamento: number;
  tendencia_volume: number;
  prazo_medio_pagamento: number;
  indice_sazonalidade: number;
  referencia_comercial: number;
  capacidade_estimada: number;
  peso_historico_pagamentos: number;
  peso_tempo_relacionamento: number;
  peso_tendencia_volume: number;
  peso_prazo_medio_pagamento: number;
  peso_indice_sazonalidade: number;
  peso_referencia_comercial: number;
  peso_capacidade_estimada: number;
  classificacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' | 'PESSIMO';
  data_calculo: Date;
}

export interface ConfiguracaoSistema {
  id: number;
  categoria: string;
  chave: string;
  valor: string;
  descricao?: string;
  tipo: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  created_at: Date;
  updated_at: Date;
}

export interface ReferenciaComercial {
  id: number;
  cliente_id: number;
  nome_referencia: string;
  telefone_referencia?: string;
  score_referencia: number; // 0-100
  data_consulta: Date;
  consultado_por: string;
  observacoes?: string;
}

// ============================
// Interfaces para o sistema de scoring (7 métricas)
// ============================

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
  historico_pagamentos: number;  // 0.25
  tempo_relacionamento: number;  // 0.15
  tendencia_volume: number;      // 0.10
  prazo_medio_pagamento: number; // 0.15
  indice_sazonalidade: number;   // 0.10
  referencia_comercial: number;  // 0.15
  capacidade_estimada: number;   // 0.10
}

export interface ScoreResult {
  cliente_id: number;
  score_final: number;
  metricas: ScoreMetrics;
  ponderacoes: ScoreWeights;
  classificacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' | 'PESSIMO';
  data_calculo: Date;
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

// ============================
// Interface para autenticação (mock AD)
// ============================

export interface User {
  id: number;
  username: string;
  email: string;
  nome: string;
  perfil: 'ADMIN' | 'ANALISTA' | 'CONSULTOR';
  ativo: boolean;
}
