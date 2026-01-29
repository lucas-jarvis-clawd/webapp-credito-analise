import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import {
  Cliente,
  FDuplicata,
  FPagamento,
  LimiteCredito,
  ScoreHistorico,
  ConfiguracaoSistema,
  ReferenciaComercial
} from '../models/types';

// ============================
// Persistence file paths
// ============================
const dataDir = path.resolve(__dirname, '..', '..', 'data');
const dataFile = path.join(dataDir, 'db.json');

// ============================
// Table types union
// ============================
type TableName =
  | 'clientes'
  | 'f_duplicatas'
  | 'f_pagamentos'
  | 'limites_credito'
  | 'score_historico'
  | 'configuracoes_sistema'
  | 'referencias_comerciais';

type TableRecord<T extends TableName> =
  T extends 'clientes' ? Cliente :
  T extends 'f_duplicatas' ? FDuplicata :
  T extends 'f_pagamentos' ? FPagamento :
  T extends 'limites_credito' ? LimiteCredito :
  T extends 'score_historico' ? ScoreHistorico :
  T extends 'configuracoes_sistema' ? ConfiguracaoSistema :
  T extends 'referencias_comerciais' ? ReferenciaComercial :
  never;

// ============================
// Tables shape
// ============================
interface Tables {
  clientes: Cliente[];
  f_duplicatas: FDuplicata[];
  f_pagamentos: FPagamento[];
  limites_credito: LimiteCredito[];
  score_historico: ScoreHistorico[];
  configuracoes_sistema: ConfiguracaoSistema[];
  referencias_comerciais: ReferenciaComercial[];
}

// ============================
// In-memory database class
// ============================
export class MemoryDatabase {
  private tables: Tables;

  private autoIncrements: Record<TableName, number>;

  constructor() {
    this.tables = {
      clientes: [],
      f_duplicatas: [],
      f_pagamentos: [],
      limites_credito: [],
      score_historico: [],
      configuracoes_sistema: [],
      referencias_comerciais: []
    };

    this.autoIncrements = {
      clientes: 0,
      f_duplicatas: 0,
      f_pagamentos: 0,
      limites_credito: 0,
      score_historico: 0,
      configuracoes_sistema: 0,
      referencias_comerciais: 0
    };
  }

  /**
   * Type-safe access to a table array. Centralizes the single unavoidable
   * cast that TypeScript requires when indexing a mapped-type object with
   * a generic key.
   */
  private getTableArray<T extends TableName>(table: T): TableRecord<T>[] {
    return this.tables[table] as TableRecord<T>[];
  }

  // ============================
  // Persistence: save & load
  // ============================

  save(): void {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dataFile, JSON.stringify(this.tables, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Erro ao salvar banco de dados em disco:', err);
    }
  }

  load(): boolean {
    try {
      if (!fs.existsSync(dataFile)) {
        return false;
      }
      const raw = fs.readFileSync(dataFile, 'utf-8');
      const parsed = JSON.parse(raw);

      // Restore tables
      const tableNames: TableName[] = [
        'clientes', 'f_duplicatas', 'f_pagamentos',
        'limites_credito', 'score_historico',
        'configuracoes_sistema', 'referencias_comerciais'
      ];

      for (const name of tableNames) {
        if (Array.isArray(parsed[name])) {
          (this.tables[name] as TableRecord<typeof name>[]) = parsed[name];
        }
      }

      // Restore auto-increment counters by scanning for max id in each table
      for (const name of tableNames) {
        const arr = this.getTableArray(name);
        let maxId = 0;
        for (const record of arr) {
          if (record.id && record.id > maxId) {
            maxId = record.id;
          }
        }
        this.autoIncrements[name] = maxId;
      }

      logger.info(`Banco de dados carregado de ${dataFile} com sucesso.`);
      return true;
    } catch (err) {
      logger.error('Erro ao carregar banco de dados do disco (sera feito seed):', err);
      return false;
    }
  }

  // ============================
  // CRUD operations
  // ============================

  getAll<T extends TableName>(table: T): TableRecord<T>[] {
    return [...this.getTableArray(table)];
  }

  getById<T extends TableName>(table: T, id: number): TableRecord<T> | undefined {
    return this.getTableArray(table).find(r => r.id === id);
  }

  insert<T extends TableName>(table: T, record: Omit<TableRecord<T>, 'id'>): TableRecord<T> {
    this.autoIncrements[table] += 1;
    const newRecord = { ...record, id: this.autoIncrements[table] } as TableRecord<T>;
    this.getTableArray(table).push(newRecord);
    this.save();
    return newRecord;
  }

  update<T extends TableName>(table: T, id: number, data: Partial<TableRecord<T>>): TableRecord<T> | undefined {
    const arr = this.getTableArray(table);
    const index = arr.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    arr[index] = { ...arr[index], ...data };
    this.save();
    return arr[index];
  }

  delete<T extends TableName>(table: T, id: number): boolean {
    const arr = this.getTableArray(table);
    const index = arr.findIndex(r => r.id === id);
    if (index === -1) return false;
    arr.splice(index, 1);
    this.save();
    return true;
  }

  query<T extends TableName>(table: T, filterFn: (record: TableRecord<T>) => boolean): TableRecord<T>[] {
    return this.getTableArray(table).filter(filterFn);
  }

  count<T extends TableName>(table: T, filterFn?: (record: TableRecord<T>) => boolean): number {
    const arr = this.getTableArray(table);
    if (!filterFn) return arr.length;
    return arr.filter(filterFn).length;
  }

  // ============================
  // Seed initialization
  // ============================
  seed(): void {
    logger.info('Iniciando seed do banco de dados em memoria...');
    this.seedClientes();
    this.seedDuplicatasAndPagamentos();
    this.seedLimitesCredito();
    this.seedScoreHistorico();
    this.seedConfiguracoesSistema();
    this.seedReferenciasComerciais();
    logger.info(`Seed completo: ${this.count('clientes')} clientes, ${this.count('f_duplicatas')} duplicatas, ${this.count('f_pagamentos')} pagamentos, ${this.count('limites_credito')} limites, ${this.count('referencias_comerciais')} referencias`);
    this.save();
  }

  // ===================================================================
  // SEED: Clientes
  // ===================================================================
  private seedClientes(): void {
    const clientesData: Omit<Cliente, 'id'>[] = [
      {
        nome: 'Maria Silva Confeccoes ME',
        cpf_cnpj: '12.345.678/0001-90',
        tipo: 'PJ',
        email: 'maria@silvaconfeccoes.com.br',
        telefone: '(11) 98765-4321',
        endereco: 'Rua 25 de Marco, 500 - Centro, Sao Paulo - SP',
        limite_credito: 50000,
        status: 'ATIVO',
        segmento_textil: 'MODA_FEMININA',
        tipo_negocio: 'LOJA_FISICA',
        faturamento_estimado: 120000,
        created_at: new Date('2023-03-15'),
        updated_at: new Date('2024-12-01')
      },
      {
        nome: 'Joao Carlos Oliveira',
        cpf_cnpj: '123.456.789-01',
        tipo: 'PF',
        email: 'joao.oliveira@gmail.com',
        telefone: '(21) 97654-3210',
        endereco: 'Rua da Alfandega, 120 - Centro, Rio de Janeiro - RJ',
        limite_credito: 15000,
        status: 'ATIVO',
        segmento_textil: 'MODA_MASCULINA',
        tipo_negocio: 'AMBULANTE',
        faturamento_estimado: 25000,
        created_at: new Date('2023-06-10'),
        updated_at: new Date('2024-11-15')
      },
      {
        nome: 'Textil Nordeste LTDA',
        cpf_cnpj: '23.456.789/0001-12',
        tipo: 'PJ',
        email: 'contato@textilnordeste.com.br',
        telefone: '(81) 3456-7890',
        endereco: 'Av. Conde da Boa Vista, 800 - Recife - PE',
        limite_credito: 80000,
        status: 'ATIVO',
        segmento_textil: 'TECIDOS',
        tipo_negocio: 'MISTO',
        faturamento_estimado: 200000,
        created_at: new Date('2022-08-20'),
        updated_at: new Date('2024-10-20')
      },
      {
        nome: 'Ana Paula Santos Modas',
        cpf_cnpj: '234.567.890-12',
        tipo: 'PF',
        email: 'ana.modas@hotmail.com',
        telefone: '(31) 99876-5432',
        endereco: 'Rua dos Caetes, 250 - Centro, Belo Horizonte - MG',
        limite_credito: 20000,
        status: 'ATIVO',
        segmento_textil: 'MODA_FEMININA',
        tipo_negocio: 'ONLINE',
        faturamento_estimado: 35000,
        created_at: new Date('2024-01-05'),
        updated_at: new Date('2024-12-10')
      },
      {
        nome: 'Enxovais Casa Bonita EIRELI',
        cpf_cnpj: '34.567.890/0001-23',
        tipo: 'PJ',
        email: 'vendas@casabonita.com.br',
        telefone: '(41) 3333-2222',
        endereco: 'Rua XV de Novembro, 300 - Centro, Curitiba - PR',
        limite_credito: 60000,
        status: 'ATIVO',
        segmento_textil: 'CAMA_MESA_BANHO',
        tipo_negocio: 'LOJA_FISICA',
        faturamento_estimado: 150000,
        created_at: new Date('2022-11-01'),
        updated_at: new Date('2024-09-15')
      },
      {
        nome: 'Roberto Mendes Tecidos',
        cpf_cnpj: '345.678.901-23',
        tipo: 'PF',
        email: 'roberto.tecidos@gmail.com',
        telefone: '(85) 98765-1234',
        endereco: 'Rua Jose Avelino, 80 - Praia de Iracema, Fortaleza - CE',
        limite_credito: 10000,
        status: 'ATIVO',
        segmento_textil: 'TECIDOS',
        tipo_negocio: 'AMBULANTE',
        faturamento_estimado: 12000,
        created_at: new Date('2024-03-20'),
        updated_at: new Date('2024-11-30')
      },
      {
        nome: 'Moda Kids Infantil LTDA',
        cpf_cnpj: '45.678.901/0001-34',
        tipo: 'PJ',
        email: 'contato@modakids.com.br',
        telefone: '(11) 2222-3333',
        endereco: 'Rua Maria Marcolina, 150 - Bras, Sao Paulo - SP',
        limite_credito: 45000,
        status: 'ATIVO',
        segmento_textil: 'INFANTIL',
        tipo_negocio: 'MISTO',
        faturamento_estimado: 90000,
        created_at: new Date('2023-01-10'),
        updated_at: new Date('2024-12-05')
      },
      {
        nome: 'Patricia Lima',
        cpf_cnpj: '456.789.012-34',
        tipo: 'PF',
        email: 'pat.lima@yahoo.com.br',
        telefone: '(62) 99988-7766',
        endereco: 'Rua 44, 200 - Setor Norte, Goiania - GO',
        limite_credito: 8000,
        status: 'BLOQUEADO',
        segmento_textil: 'MODA_FEMININA',
        tipo_negocio: 'ONLINE',
        faturamento_estimado: 8000,
        created_at: new Date('2023-09-01'),
        updated_at: new Date('2024-08-10')
      },
      {
        nome: 'Aviamentos Paulista ME',
        cpf_cnpj: '56.789.012/0001-45',
        tipo: 'PJ',
        email: 'aviamentos@paulista.com.br',
        telefone: '(11) 3456-7891',
        endereco: 'Rua Oriente, 400 - Bras, Sao Paulo - SP',
        limite_credito: 35000,
        status: 'ATIVO',
        segmento_textil: 'AVIAMENTOS',
        tipo_negocio: 'LOJA_FISICA',
        faturamento_estimado: 70000,
        created_at: new Date('2022-05-15'),
        updated_at: new Date('2024-11-20')
      },
      {
        nome: 'Carlos Eduardo Ferreira',
        cpf_cnpj: '567.890.123-45',
        tipo: 'PF',
        email: 'cadu.ferreira@gmail.com',
        telefone: '(51) 98877-6655',
        endereco: 'Rua Voluntarios da Patria, 600 - Centro, Porto Alegre - RS',
        limite_credito: 25000,
        status: 'ATIVO',
        segmento_textil: 'MODA_MASCULINA',
        tipo_negocio: 'LOJA_FISICA',
        faturamento_estimado: 45000,
        created_at: new Date('2023-07-01'),
        updated_at: new Date('2024-12-01')
      },
      {
        nome: 'Textil Sul Catarinense LTDA',
        cpf_cnpj: '67.890.123/0001-56',
        tipo: 'PJ',
        email: 'contato@textilsul.com.br',
        telefone: '(47) 3344-5566',
        endereco: 'Rua XV de Novembro, 1200 - Blumenau - SC',
        limite_credito: 100000,
        status: 'ATIVO',
        segmento_textil: 'TECIDOS',
        tipo_negocio: 'MISTO',
        faturamento_estimado: 180000,
        created_at: new Date('2021-12-01'),
        updated_at: new Date('2024-11-10')
      },
      {
        nome: 'Fernanda Costa Moda Praia',
        cpf_cnpj: '678.901.234-56',
        tipo: 'PF',
        email: 'fernanda.praia@gmail.com',
        telefone: '(71) 99765-4433',
        endereco: 'Av. Sete de Setembro, 300 - Barra, Salvador - BA',
        limite_credito: 18000,
        status: 'ATIVO',
        segmento_textil: 'MODA_FEMININA',
        tipo_negocio: 'ONLINE',
        faturamento_estimado: 30000,
        created_at: new Date('2024-02-15'),
        updated_at: new Date('2024-12-08')
      },
      {
        nome: 'Mega Tecidos Atacado SA',
        cpf_cnpj: '78.901.234/0001-67',
        tipo: 'PJ',
        email: 'vendas@megatecidos.com.br',
        telefone: '(11) 4444-5555',
        endereco: 'Rua Miller, 100 - Bras, Sao Paulo - SP',
        limite_credito: 150000,
        status: 'ATIVO',
        segmento_textil: 'TECIDOS',
        tipo_negocio: 'LOJA_FISICA',
        faturamento_estimado: 500000,
        created_at: new Date('2021-06-01'),
        updated_at: new Date('2024-12-12')
      },
      {
        nome: 'Lucas Nascimento',
        cpf_cnpj: '789.012.345-67',
        tipo: 'PF',
        email: 'lucas.nasc@gmail.com',
        telefone: '(27) 98888-1122',
        endereco: 'Av. Princesa Isabel, 200 - Centro, Vitoria - ES',
        limite_credito: 5000,
        status: 'INATIVO',
        segmento_textil: 'MODA_MASCULINA',
        tipo_negocio: 'AMBULANTE',
        faturamento_estimado: 5000,
        created_at: new Date('2024-06-01'),
        updated_at: new Date('2024-09-01')
      },
      {
        nome: 'Confeccoes Minas Gerais EIRELI',
        cpf_cnpj: '89.012.345/0001-78',
        tipo: 'PJ',
        email: 'contato@confeccoesmg.com.br',
        telefone: '(31) 3211-4455',
        endereco: 'Rua Curitiba, 500 - Centro, Belo Horizonte - MG',
        limite_credito: 70000,
        status: 'ATIVO',
        segmento_textil: 'MODA_FEMININA',
        tipo_negocio: 'MISTO',
        faturamento_estimado: 160000,
        created_at: new Date('2022-09-10'),
        updated_at: new Date('2024-11-25')
      },
      {
        nome: 'Sandra Almeida Enxovais',
        cpf_cnpj: '890.123.456-78',
        tipo: 'PF',
        email: 'sandra.enxovais@hotmail.com',
        telefone: '(67) 99654-3322',
        endereco: 'Rua 14 de Julho, 800 - Centro, Campo Grande - MS',
        limite_credito: 12000,
        status: 'ATIVO',
        segmento_textil: 'CAMA_MESA_BANHO',
        tipo_negocio: 'LOJA_FISICA',
        faturamento_estimado: 20000,
        created_at: new Date('2023-11-01'),
        updated_at: new Date('2024-10-15')
      },
      {
        nome: 'Textil Amazonia LTDA',
        cpf_cnpj: '90.123.456/0001-89',
        tipo: 'PJ',
        email: 'contato@textilamazonia.com.br',
        telefone: '(92) 3322-1100',
        endereco: 'Av. Eduardo Ribeiro, 150 - Centro, Manaus - AM',
        limite_credito: 40000,
        status: 'ATIVO',
        segmento_textil: 'TECIDOS',
        tipo_negocio: 'MISTO',
        faturamento_estimado: 85000,
        created_at: new Date('2023-04-01'),
        updated_at: new Date('2024-11-05')
      },
      {
        nome: 'Diego Souza Malhas',
        cpf_cnpj: '901.234.567-89',
        tipo: 'PF',
        email: 'diego.malhas@gmail.com',
        telefone: '(48) 99776-5544',
        endereco: 'Rua Felipe Schmidt, 250 - Centro, Florianopolis - SC',
        limite_credito: 22000,
        status: 'ATIVO',
        segmento_textil: 'MODA_MASCULINA',
        tipo_negocio: 'ONLINE',
        faturamento_estimado: 38000,
        created_at: new Date('2023-05-20'),
        updated_at: new Date('2024-12-02')
      }
    ];

    for (const c of clientesData) {
      this.insert('clientes', c);
    }
  }

  // ===================================================================
  // SEED: Duplicatas and Pagamentos
  // ===================================================================
  private seedDuplicatasAndPagamentos(): void {
    const clientes = this.getAll('clientes');
    const formasPagamento: FPagamento['forma_pagamento'][] = ['DINHEIRO', 'PIX', 'TRANSFERENCIA', 'CARTAO', 'BOLETO'];

    // Helper to create random date between two dates
    const randomDate = (start: Date, end: Date): Date => {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    const now = new Date();
    let dupCounter = 0;

    for (const cliente of clientes) {
      // Each client gets 5-20 invoices
      const numDuplicatas = 5 + Math.floor(Math.random() * 16);
      const clienteStart = new Date(cliente.created_at);

      for (let i = 0; i < numDuplicatas; i++) {
        dupCounter++;
        const dataEmissao = randomDate(clienteStart, now);
        const vencimentoDias = 15 + Math.floor(Math.random() * 46); // 15-60 days
        const dataVencimento = new Date(dataEmissao.getTime() + vencimentoDias * 86400000);

        // Valor based on client's estimated revenue
        const baseValor = (cliente.faturamento_estimado || 10000) * 0.05;
        const valor = Math.round((baseValor * (0.3 + Math.random() * 1.4)) * 100) / 100;

        // Determine status
        let status: FDuplicata['status'];
        const isInFuture = dataVencimento > now;

        if (isInFuture) {
          status = 'ABERTA';
        } else {
          // Past due date: decide if paid, overdue, or cancelled
          const roll = Math.random();
          if (cliente.status === 'BLOQUEADO') {
            status = roll < 0.3 ? 'PAGA' : roll < 0.85 ? 'VENCIDA' : 'CANCELADA';
          } else if (cliente.status === 'INATIVO') {
            status = roll < 0.5 ? 'PAGA' : roll < 0.85 ? 'VENCIDA' : 'CANCELADA';
          } else {
            status = roll < 0.7 ? 'PAGA' : roll < 0.9 ? 'VENCIDA' : 'CANCELADA';
          }
        }

        const duplicata = this.insert('f_duplicatas', {
          cliente_id: cliente.id,
          numero_duplicata: `DUP-${cliente.id.toString().padStart(3, '0')}-${dupCounter.toString().padStart(5, '0')}`,
          valor,
          data_vencimento: dataVencimento,
          data_emissao: dataEmissao,
          status,
          observacoes: status === 'CANCELADA' ? 'Duplicata cancelada a pedido do cliente' : undefined,
          created_at: dataEmissao,
          updated_at: status === 'PAGA' ? dataVencimento : dataEmissao
        } as Omit<FDuplicata, 'id'>);

        // If paid, create a payment record
        if (status === 'PAGA') {
          // Payment date: sometimes early, sometimes on time, sometimes late
          const paymentVariance = Math.floor(Math.random() * 20) - 5; // -5 to +14 days from due
          const dataPagamento = new Date(dataVencimento.getTime() + paymentVariance * 86400000);
          // Make sure payment is not in the future
          const finalPayDate = dataPagamento > now ? new Date(now.getTime() - Math.random() * 86400000 * 5) : dataPagamento;

          this.insert('f_pagamentos', {
            duplicata_id: duplicata.id,
            valor_pago: valor, // Full payment
            data_pagamento: finalPayDate,
            forma_pagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)],
            observacoes: paymentVariance < 0 ? 'Pagamento antecipado' : paymentVariance === 0 ? 'Pagamento no prazo' : undefined,
            created_at: finalPayDate,
            updated_at: finalPayDate
          } as Omit<FPagamento, 'id'>);
        }
      }
    }
  }

  // ===================================================================
  // SEED: Limites de Credito
  // ===================================================================
  private seedLimitesCredito(): void {
    const clientes = this.getAll('clientes');

    // Some clients get active limits
    const clientesComLimiteAtivo = clientes.filter(c => c.status === 'ATIVO').slice(0, 10);
    for (const c of clientesComLimiteAtivo) {
      this.insert('limites_credito', {
        cliente_id: c.id,
        limite_atual: c.limite_credito,
        limite_solicitado: c.limite_credito,
        limite_aprovado: c.limite_credito,
        data_aprovacao: new Date(c.updated_at.getTime() - 30 * 86400000),
        aprovado_por: 'Administrador',
        motivo: 'Limite inicial aprovado com base no faturamento estimado',
        status: 'ATIVO',
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at)
      } as Omit<LimiteCredito, 'id'>);
    }

    // Some pending requests
    const clientesPendente = clientes.filter(c => c.status === 'ATIVO').slice(4, 8);
    for (const c of clientesPendente) {
      const solicitado = Math.round(c.limite_credito * (1.3 + Math.random() * 0.5));
      this.insert('limites_credito', {
        cliente_id: c.id,
        limite_atual: c.limite_credito,
        limite_solicitado: solicitado,
        motivo: 'Aumento de limite solicitado para expansao de compras',
        status: 'PENDENTE',
        created_at: new Date(Date.now() - Math.floor(Math.random() * 15) * 86400000),
        updated_at: new Date()
      } as Omit<LimiteCredito, 'id'>);
    }

    // Some rejected in history
    this.insert('limites_credito', {
      cliente_id: clientes[7].id, // Patricia Lima (BLOQUEADO)
      limite_atual: clientes[7].limite_credito,
      limite_solicitado: 20000,
      motivo: 'Solicitacao de aumento de limite',
      status: 'REJEITADO',
      aprovado_por: 'Joao Analista',
      data_aprovacao: new Date('2024-07-15'),
      created_at: new Date('2024-07-10'),
      updated_at: new Date('2024-07-15')
    } as Omit<LimiteCredito, 'id'>);

    this.insert('limites_credito', {
      cliente_id: clientes[13].id, // Lucas Nascimento (INATIVO)
      limite_atual: clientes[13].limite_credito,
      limite_solicitado: 15000,
      motivo: 'Necessidade de ampliar estoque para temporada',
      status: 'REJEITADO',
      aprovado_por: 'Joao Analista',
      data_aprovacao: new Date('2024-08-20'),
      created_at: new Date('2024-08-15'),
      updated_at: new Date('2024-08-20')
    } as Omit<LimiteCredito, 'id'>);
  }

  // ===================================================================
  // SEED: Score Historico
  // ===================================================================
  private seedScoreHistorico(): void {
    const clientes = this.getAll('clientes');
    const activeClients = clientes.filter(c => c.status === 'ATIVO').slice(0, 10);

    for (const c of activeClients) {
      // Generate 1-3 historical scores
      const numScores = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numScores; i++) {
        const hist = 50 + Math.floor(Math.random() * 50);
        const tempo = 30 + Math.floor(Math.random() * 70);
        const tendencia = 30 + Math.floor(Math.random() * 60);
        const prazo = 40 + Math.floor(Math.random() * 50);
        const sazon = 30 + Math.floor(Math.random() * 60);
        const ref = 40 + Math.floor(Math.random() * 50);
        const cap = 40 + Math.floor(Math.random() * 50);

        const scoreFinal = Math.round(
          hist * 0.25 + tempo * 0.15 + tendencia * 0.10 +
          prazo * 0.15 + sazon * 0.10 + ref * 0.15 + cap * 0.10
        );

        let classificacao: ScoreHistorico['classificacao'];
        if (scoreFinal >= 80) classificacao = 'EXCELENTE';
        else if (scoreFinal >= 65) classificacao = 'BOM';
        else if (scoreFinal >= 50) classificacao = 'REGULAR';
        else if (scoreFinal >= 30) classificacao = 'RUIM';
        else classificacao = 'PESSIMO';

        this.insert('score_historico', {
          cliente_id: c.id,
          score_final: scoreFinal,
          historico_pagamentos: hist,
          tempo_relacionamento: tempo,
          tendencia_volume: tendencia,
          prazo_medio_pagamento: prazo,
          indice_sazonalidade: sazon,
          referencia_comercial: ref,
          capacidade_estimada: cap,
          peso_historico_pagamentos: 0.25,
          peso_tempo_relacionamento: 0.15,
          peso_tendencia_volume: 0.10,
          peso_prazo_medio_pagamento: 0.15,
          peso_indice_sazonalidade: 0.10,
          peso_referencia_comercial: 0.15,
          peso_capacidade_estimada: 0.10,
          classificacao,
          data_calculo: new Date(Date.now() - (numScores - i) * 30 * 86400000)
        } as Omit<ScoreHistorico, 'id'>);
      }
    }
  }

  // ===================================================================
  // SEED: Configuracoes do Sistema
  // ===================================================================
  private seedConfiguracoesSistema(): void {
    const configs: Omit<ConfiguracaoSistema, 'id'>[] = [
      {
        categoria: 'SCORING',
        chave: 'peso_historico_pagamentos',
        valor: '0.25',
        descricao: 'Peso do historico de pagamentos no calculo do score',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'peso_tempo_relacionamento',
        valor: '0.15',
        descricao: 'Peso do tempo de relacionamento no calculo do score',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'peso_tendencia_volume',
        valor: '0.10',
        descricao: 'Peso da tendencia de volume no calculo do score',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'peso_prazo_medio_pagamento',
        valor: '0.15',
        descricao: 'Peso do prazo medio de pagamento no calculo do score',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'peso_indice_sazonalidade',
        valor: '0.10',
        descricao: 'Peso do indice de sazonalidade no calculo do score',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'peso_referencia_comercial',
        valor: '0.15',
        descricao: 'Peso da referencia comercial no calculo do score',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'peso_capacidade_estimada',
        valor: '0.10',
        descricao: 'Peso da capacidade estimada no calculo do score',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'score_min',
        valor: '0',
        descricao: 'Score minimo',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'SCORING',
        chave: 'score_max',
        valor: '100',
        descricao: 'Score maximo',
        tipo: 'NUMBER',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'GERAL',
        chave: 'nome_sistema',
        valor: 'WebApp Analise de Credito Textil',
        descricao: 'Nome do sistema',
        tipo: 'STRING',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        categoria: 'GERAL',
        chave: 'versao',
        valor: '2.0.0',
        descricao: 'Versao do sistema',
        tipo: 'STRING',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    ];

    for (const cfg of configs) {
      this.insert('configuracoes_sistema', cfg);
    }
  }

  // ===================================================================
  // SEED: Referencias Comerciais
  // ===================================================================
  private seedReferenciasComerciais(): void {
    const clientes = this.getAll('clientes');
    const activeClients = clientes.filter(c => c.status === 'ATIVO');

    const nomes = [
      'Distribuidora Textil Central',
      'Atacadao das Malhas',
      'Fornecedora Nacional de Tecidos',
      'Casa dos Aviamentos',
      'Textil Exportacao Brasil',
      'Confeccoes Alvorada',
      'Tecelagem Sao Paulo',
      'Malhas e Cia',
      'Atacado Moda Brasil',
      'Fios e Tramas LTDA'
    ];

    // Give 60% of active clients commercial references
    const clientsWithRefs = activeClients.slice(0, Math.ceil(activeClients.length * 0.6));

    for (const c of clientsWithRefs) {
      const numRefs = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numRefs; i++) {
        const nomeRef = nomes[Math.floor(Math.random() * nomes.length)];
        this.insert('referencias_comerciais', {
          cliente_id: c.id,
          nome_referencia: nomeRef,
          telefone_referencia: `(${10 + Math.floor(Math.random() * 90)}) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          score_referencia: 30 + Math.floor(Math.random() * 71), // 30-100
          data_consulta: new Date(Date.now() - Math.floor(Math.random() * 180) * 86400000),
          consultado_por: Math.random() > 0.5 ? 'Joao Analista' : 'Maria Consultora',
          observacoes: Math.random() > 0.6 ? 'Cliente com bom historico de pagamentos conforme referencia' : undefined
        } as Omit<ReferenciaComercial, 'id'>);
      }
    }
  }
}

// ============================
// Singleton instance
// ============================
let dbInstance: MemoryDatabase | null = null;

export function getMemoryDb(): MemoryDatabase {
  if (!dbInstance) {
    dbInstance = new MemoryDatabase();
    const loaded = dbInstance.load();
    if (!loaded) {
      dbInstance.seed();
    }
  }
  return dbInstance;
}

export function resetMemoryDb(): MemoryDatabase {
  dbInstance = new MemoryDatabase();
  dbInstance.seed();
  return dbInstance;
}
