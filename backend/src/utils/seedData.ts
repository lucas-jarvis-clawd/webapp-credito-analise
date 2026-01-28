import { getConnection } from '../database/connection';
import { logger } from './logger';
import oracledb from 'oracledb';

interface ClienteData {
  nome: string;
  cpf_cnpj: string;
  tipo: 'PF' | 'PJ';
  email: string;
  telefone: string;
  endereco: string;
  limite_credito: number;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
}

interface DuplicataData {
  cliente_id: number;
  numero_duplicata: string;
  valor: number;
  data_vencimento: Date;
  data_emissao: Date;
  status: 'ABERTA' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
  observacoes?: string;
}

interface PagamentoData {
  duplicata_id: number;
  valor_pago: number;
  data_pagamento: Date;
  forma_pagamento: 'DINHEIRO' | 'PIX' | 'TRANSFERENCIA' | 'CARTAO' | 'BOLETO';
  observacoes?: string;
}

class DataSeeder {
  
  private generateCPF(): string {
    const numbers = Array.from({length: 9}, () => Math.floor(Math.random() * 10));
    
    // Primeiro dígito verificador
    let sum = numbers.reduce((acc, num, index) => acc + num * (10 - index), 0);
    numbers.push(sum % 11 < 2 ? 0 : 11 - sum % 11);
    
    // Segundo dígito verificador
    sum = numbers.reduce((acc, num, index) => acc + num * (11 - index), 0);
    numbers.push(sum % 11 < 2 ? 0 : 11 - sum % 11);
    
    return numbers.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private generateCNPJ(): string {
    const numbers = Array.from({length: 12}, () => Math.floor(Math.random() * 10));
    
    // Primeiro dígito verificador
    const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    let sum = numbers.reduce((acc, num, index) => acc + num * weights1[index], 0);
    numbers.push(sum % 11 < 2 ? 0 : 11 - sum % 11);
    
    // Segundo dígito verificador
    const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    sum = [...numbers].reduce((acc, num, index) => acc + num * weights2[index], 0);
    numbers.push(sum % 11 < 2 ? 0 : 11 - sum % 11);
    
    return numbers.join('').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  private randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private generateClientes(count: number): ClienteData[] {
    const nomesPF = [
      'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Ferreira',
      'Luciana Souza', 'Roberto Lima', 'Fernanda Alves', 'Marcos Pereira', 'Juliana Rodrigues',
      'Rafael Mendes', 'Carolina Barbosa', 'Bruno Cardoso', 'Patrícia Nascimento', 'Diego Araújo',
      'Camila Rocha', 'Thiago Martins', 'Vanessa Castro', 'Felipe Gomes', 'Amanda Dias'
    ];

    const nomesPJ = [
      'Tech Solutions Ltda', 'Comércio Brasil S/A', 'Indústria Alpha Ltda', 'Serviços Beta ME',
      'Distribuidora Gamma Ltda', 'Construtora Delta S/A', 'Consultoria Epsilon Ltda', 'Logística Zeta ME',
      'Alimentícia Eta Ltda', 'Metalúrgica Theta S/A', 'Software Iota Ltda', 'Farmácia Kappa ME',
      'Química Lambda S/A', 'Têxtil Mu Ltda', 'Autopeças Nu ME', 'Eletrônica Xi Ltda'
    ];

    const clientes: ClienteData[] = [];

    for (let i = 0; i < count; i++) {
      const isPF = Math.random() > 0.3; // 70% PF, 30% PJ
      const nome = isPF ? 
        nomesPF[Math.floor(Math.random() * nomesPF.length)] : 
        nomesPJ[Math.floor(Math.random() * nomesPJ.length)];
      
      const cpf_cnpj = isPF ? this.generateCPF() : this.generateCNPJ();
      
      const dominio = ['gmail.com', 'outlook.com', 'empresa.com.br', 'negocio.com'][Math.floor(Math.random() * 4)];
      const email = `${nome.toLowerCase().replace(/\s+/g, '.')}@${dominio}`;
      
      const limite_credito = [1000, 2500, 5000, 10000, 15000, 25000, 50000][Math.floor(Math.random() * 7)];
      
      const status = Math.random() > 0.1 ? 'ATIVO' : (Math.random() > 0.5 ? 'INATIVO' : 'BLOQUEADO');

      clientes.push({
        nome,
        cpf_cnpj,
        tipo: isPF ? 'PF' : 'PJ',
        email,
        telefone: isPF ? '(11) 9' + Math.random().toString().substr(2, 8) : '(11) 3' + Math.random().toString().substr(2, 7),
        endereco: `Rua ${Math.floor(Math.random() * 1000)}, ${Math.floor(Math.random() * 999)} - São Paulo/SP`,
        limite_credito,
        status
      });
    }

    return clientes;
  }

  private generateDuplicatas(clientesIds: number[], count: number): DuplicataData[] {
    const duplicatas: DuplicataData[] = [];
    const hoje = new Date();
    const seisResDosAtrasMeses = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);

    for (let i = 0; i < count; i++) {
      const cliente_id = clientesIds[Math.floor(Math.random() * clientesIds.length)];
      const data_emissao = this.randomDate(seisResDosAtrasMeses, hoje);
      
      // Data de vencimento entre 30 e 90 dias após emissão
      const data_vencimento = new Date(data_emissao);
      data_vencimento.setDate(data_vencimento.getDate() + Math.floor(Math.random() * 60) + 30);
      
      const valor = Math.floor(Math.random() * 50000) + 500; // Entre 500 e 50.500
      
      // Status baseado na data de vencimento
      let status: 'ABERTA' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
      if (data_vencimento > hoje) {
        status = Math.random() > 0.2 ? 'ABERTA' : 'PAGA'; // 80% abertas, 20% pagas antecipadamente
      } else {
        status = Math.random() > 0.3 ? 'PAGA' : 'VENCIDA'; // 70% pagas, 30% vencidas
      }
      
      if (Math.random() > 0.95) status = 'CANCELADA'; // 5% canceladas

      duplicatas.push({
        cliente_id,
        numero_duplicata: `DUP${String(i + 1).padStart(6, '0')}`,
        valor,
        data_vencimento,
        data_emissao,
        status,
        observacoes: Math.random() > 0.7 ? 'Observação automatizada' : undefined
      });
    }

    return duplicatas;
  }

  private generatePagamentos(duplicatasPagas: {id: number, valor: number, data_vencimento: Date}[]): PagamentoData[] {
    const pagamentos: PagamentoData[] = [];
    const formasPagamento: ('DINHEIRO' | 'PIX' | 'TRANSFERENCIA' | 'CARTAO' | 'BOLETO')[] = 
      ['DINHEIRO', 'PIX', 'TRANSFERENCIA', 'CARTAO', 'BOLETO'];

    for (const duplicata of duplicatasPagas) {
      const forma_pagamento = formasPagamento[Math.floor(Math.random() * formasPagamento.length)];
      
      // Data de pagamento pode ser antes, no dia ou alguns dias depois do vencimento
      const diasVariacao = Math.floor(Math.random() * 21) - 10; // -10 a +10 dias
      const data_pagamento = new Date(duplicata.data_vencimento);
      data_pagamento.setDate(data_pagamento.getDate() + diasVariacao);
      
      // Valor pago pode ser exato ou com pequena variação (desconto/juros)
      const variacao = (Math.random() - 0.5) * 0.1; // -5% a +5%
      const valor_pago = Math.round(duplicata.valor * (1 + variacao));

      pagamentos.push({
        duplicata_id: duplicata.id,
        valor_pago,
        data_pagamento,
        forma_pagamento,
        observacoes: Math.random() > 0.8 ? 
          (variacao < 0 ? 'Pagamento com desconto' : variacao > 0.02 ? 'Pagamento com juros' : undefined) : 
          undefined
      });
    }

    return pagamentos;
  }

  async createTables(): Promise<void> {
    const connection = await getConnection();
    try {
      // Criar tabelas se não existirem
      const tables = [
        `CREATE TABLE clientes (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          nome VARCHAR2(200) NOT NULL,
          cpf_cnpj VARCHAR2(18) UNIQUE NOT NULL,
          tipo VARCHAR2(2) CHECK (tipo IN ('PF', 'PJ')) NOT NULL,
          email VARCHAR2(150),
          telefone VARCHAR2(20),
          endereco VARCHAR2(300),
          limite_credito NUMBER(15,2) DEFAULT 0,
          status VARCHAR2(10) CHECK (status IN ('ATIVO', 'INATIVO', 'BLOQUEADO')) DEFAULT 'ATIVO',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE f_duplicatas (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          cliente_id NUMBER NOT NULL,
          numero_duplicata VARCHAR2(20) UNIQUE NOT NULL,
          valor NUMBER(15,2) NOT NULL,
          data_vencimento DATE NOT NULL,
          data_emissao DATE NOT NULL,
          status VARCHAR2(10) CHECK (status IN ('ABERTA', 'PAGA', 'VENCIDA', 'CANCELADA')) DEFAULT 'ABERTA',
          observacoes VARCHAR2(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        )`,
        
        `CREATE TABLE f_pagamentos (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          duplicata_id NUMBER NOT NULL,
          valor_pago NUMBER(15,2) NOT NULL,
          data_pagamento DATE NOT NULL,
          forma_pagamento VARCHAR2(15) CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'TRANSFERENCIA', 'CARTAO', 'BOLETO')) NOT NULL,
          observacoes VARCHAR2(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (duplicata_id) REFERENCES f_duplicatas(id)
        )`,
        
        `CREATE TABLE limites_credito (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          cliente_id NUMBER NOT NULL,
          limite_atual NUMBER(15,2),
          limite_solicitado NUMBER(15,2),
          limite_aprovado NUMBER(15,2),
          data_aprovacao TIMESTAMP,
          aprovado_por VARCHAR2(100),
          motivo VARCHAR2(500),
          status VARCHAR2(10) CHECK (status IN ('ATIVO', 'PENDENTE', 'REJEITADO')) DEFAULT 'PENDENTE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        )`,
        
        `CREATE TABLE score_historico (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          cliente_id NUMBER NOT NULL,
          score_final NUMBER(5,2) NOT NULL,
          pontuacao_interna NUMBER(5,2) NOT NULL,
          historico_pagamentos NUMBER(5,2) NOT NULL,
          valor_medio_duplicatas NUMBER(5,2) NOT NULL,
          prazo_medio_pagamento NUMBER(5,2) NOT NULL,
          peso_pontuacao NUMBER(3,2) NOT NULL,
          peso_historico NUMBER(3,2) NOT NULL,
          peso_valor NUMBER(3,2) NOT NULL,
          peso_prazo NUMBER(3,2) NOT NULL,
          classificacao VARCHAR2(15) NOT NULL,
          data_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        )`,
        
        `CREATE TABLE configuracoes_sistema (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          categoria VARCHAR2(50) DEFAULT 'GERAL',
          chave VARCHAR2(100) UNIQUE NOT NULL,
          valor CLOB NOT NULL,
          descricao VARCHAR2(500),
          tipo VARCHAR2(10) CHECK (tipo IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')) DEFAULT 'STRING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      for (const tableSQL of tables) {
        try {
          await connection.execute(tableSQL);
          logger.info('Tabela criada com sucesso');
        } catch (error: any) {
          if (error.message && error.message.includes('ORA-00955')) {
            logger.info('Tabela já existe, continuando...');
          } else {
            throw error;
          }
        }
      }
      
    } finally {
      await connection.close();
    }
  }

  async seedDatabase(clientesCount: number = 50, duplicatasCount: number = 300): Promise<void> {
    logger.info('🌱 Iniciando seed do banco de dados...');
    
    await this.createTables();
    
    const connection = await getConnection();
    try {
      // 1. Inserir clientes
      logger.info('📊 Inserindo clientes...');
      const clientes = this.generateClientes(clientesCount);
      const clienteIds: number[] = [];

      for (const cliente of clientes) {
        const result = await connection.execute(`
          INSERT INTO clientes (nome, cpf_cnpj, tipo, email, telefone, endereco, limite_credito, status)
          VALUES (:nome, :cpf_cnpj, :tipo, :email, :telefone, :endereco, :limite_credito, :status)
          RETURNING id INTO :id
        `, {
          ...cliente,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        });
        
        clienteIds.push((result.outBinds as any)?.id?.[0]);
      }
      
      logger.info(`✅ ${clienteIds.length} clientes inseridos`);

      // 2. Inserir duplicatas
      logger.info('💳 Inserindo duplicatas...');
      const duplicatas = this.generateDuplicatas(clienteIds, duplicatasCount);
      const duplicatasPagas: {id: number, valor: number, data_vencimento: Date}[] = [];

      for (const duplicata of duplicatas) {
        const result = await connection.execute(`
          INSERT INTO f_duplicatas (cliente_id, numero_duplicata, valor, data_vencimento, data_emissao, status, observacoes)
          VALUES (:cliente_id, :numero_duplicata, :valor, :data_vencimento, :data_emissao, :status, :observacoes)
          RETURNING id INTO :id
        `, {
          ...duplicata,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        });
        
        const duplicataId = (result.outBinds as any)?.id?.[0];
        
        if (duplicata.status === 'PAGA') {
          duplicatasPagas.push({
            id: duplicataId,
            valor: duplicata.valor,
            data_vencimento: duplicata.data_vencimento
          });
        }
      }
      
      logger.info(`✅ ${duplicatas.length} duplicatas inseridas`);

      // 3. Inserir pagamentos
      logger.info('💰 Inserindo pagamentos...');
      const pagamentos = this.generatePagamentos(duplicatasPagas);

      for (const pagamento of pagamentos) {
        await connection.execute(`
          INSERT INTO f_pagamentos (duplicata_id, valor_pago, data_pagamento, forma_pagamento, observacoes)
          VALUES (:duplicata_id, :valor_pago, :data_pagamento, :forma_pagamento, :observacoes)
        `, pagamento);
      }
      
      logger.info(`✅ ${pagamentos.length} pagamentos inseridos`);

      // 4. Inserir configurações padrão
      logger.info('⚙️ Inserindo configurações...');
      const configs = [
        {categoria: 'SCORING', chave: 'peso_pontuacao', valor: '0.3', descricao: 'Peso da pontuação interna', tipo: 'NUMBER'},
        {categoria: 'SCORING', chave: 'peso_historico', valor: '0.25', descricao: 'Peso do histórico de pagamentos', tipo: 'NUMBER'},
        {categoria: 'SCORING', chave: 'peso_valor', valor: '0.25', descricao: 'Peso do valor médio', tipo: 'NUMBER'},
        {categoria: 'SCORING', chave: 'peso_prazo', valor: '0.2', descricao: 'Peso do prazo médio', tipo: 'NUMBER'},
        {categoria: 'SISTEMA', chave: 'score_min', valor: '0', descricao: 'Score mínimo', tipo: 'NUMBER'},
        {categoria: 'SISTEMA', chave: 'score_max', valor: '100', descricao: 'Score máximo', tipo: 'NUMBER'}
      ];

      for (const config of configs) {
        try {
          await connection.execute(`
            INSERT INTO configuracoes_sistema (categoria, chave, valor, descricao, tipo)
            VALUES (:categoria, :chave, :valor, :descricao, :tipo)
          `, config);
        } catch (error: any) {
          if (!error.message?.includes('ORA-00001')) { // Ignore unique constraint errors
            throw error;
          }
        }
      }

      logger.info('✅ Configurações inseridas');
      logger.info('🎉 Seed do banco de dados concluído com sucesso!');
      
    } finally {
      await connection.close();
    }
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  const seeder = new DataSeeder();
  seeder.seedDatabase()
    .then(() => {
      logger.info('✨ Processo de seed finalizado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Erro no seed:', error);
      process.exit(1);
    });
}

export { DataSeeder };