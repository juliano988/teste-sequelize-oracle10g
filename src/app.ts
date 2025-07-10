import 'reflect-metadata';
import * as oracledb from 'oracledb';
import { AppDataSource } from './config/database';
import { Usuario } from './entities/Usuario';

async function verificarOracleClient(): Promise<boolean> {
  try {
    console.log('🔍 Verificando Oracle Client...');
    console.log('ORACLE_HOME:', process.env.ORACLE_HOME);
    console.log('LD_LIBRARY_PATH:', process.env.LD_LIBRARY_PATH);
    
    // Inicializar Oracle Client em Thick Mode
    try {
      oracledb.initOracleClient({
        libDir: process.env.ORACLE_HOME || '/opt/oracle/instantclient_19_12'
      });
      console.log('✅ Oracle Client inicializado em Thick Mode');
    } catch (err: any) {
      if (err.message.includes('has already been initialized')) {
        console.log('ℹ️ Oracle Client já foi inicializado');
      } else {
        throw err;
      }
    }
    
    const clientVersion = oracledb.oracleClientVersionString;
    console.log('✅ Oracle Client Version:', clientVersion);
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao verificar Oracle Client:', error.message);
    return false;
  }
}

async function iniciarAplicacao(): Promise<void> {
  try {
    console.log('Iniciando aplicação Node.js com TypeORM...');
    
    // Verificar Oracle Client antes de tentar conectar
    const clientOk = await verificarOracleClient();
    if (!clientOk) {
      console.error('❌ Oracle Client não configurado corretamente');
      process.exit(1);
    }
    
    console.log('Aguardando banco de dados ficar disponível...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log('Conectando ao Oracle Database com TypeORM...');
    await AppDataSource.initialize();
    console.log('✅ Conectado ao Oracle Database com TypeORM!');

    // Testar conexão com query raw
    const result = await AppDataSource.query('SELECT SYSDATE FROM DUAL');
    console.log('📅 Data atual do banco:', result[0].SYSDATE);

    // Criar estrutura do banco
    await criarEstruturaBanco();

    // Inserir dados de exemplo
    await inserirDadosExemplo();

    // Consultar dados usando TypeORM
    await consultarDados();

    console.log('🚀 Aplicação iniciada com sucesso!');
    
    // Manter a aplicação rodando
    setInterval(() => {
      console.log('💓 Aplicação rodando...');
    }, 30000);

  } catch (error: any) {
    console.error('❌ Erro ao iniciar aplicação:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

async function criarEstruturaBanco(): Promise<void> {
  try {
    // Criar sequência para IDs
    const createSequenceSQL = `
      CREATE SEQUENCE usuarios_seq
      START WITH 1
      INCREMENT BY 1
      NOCACHE
      NOCYCLE
    `;
    
    try {
      await AppDataSource.query(createSequenceSQL);
      console.log('✅ Sequência "usuarios_seq" criada com sucesso');
    } catch (error: any) {
      if (error.code === 955) { // Sequência já existe
        console.log('ℹ️ Sequência "usuarios_seq" já existe');
      } else {
        console.error('❌ Erro ao criar sequência:', error.message);
      }
    }
    
    // Criar tabela
    const createTableSQL = `
      CREATE TABLE usuarios (
        id NUMBER PRIMARY KEY,
        nome VARCHAR2(100) NOT NULL,
        email VARCHAR2(200) UNIQUE,
        data_criacao DATE DEFAULT SYSDATE
      )
    `;
    
    try {
      await AppDataSource.query(createTableSQL);
      console.log('✅ Tabela "usuarios" criada com sucesso');
    } catch (error: any) {
      if (error.code === 955) { // Tabela já existe
        console.log('ℹ️ Tabela "usuarios" já existe');
      } else {
        console.error('❌ Erro ao criar tabela:', error.message);
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar estrutura do banco:', error.message);
  }
}

async function inserirDadosExemplo(): Promise<void> {
  try {
    const usuariosExemplo = [
      { nome: 'João Silva', email: 'joao@example.com' },
      { nome: 'Maria Santos', email: 'maria@example.com' },
      { nome: 'Pedro Oliveira', email: 'pedro@example.com' }
    ];

    for (const dadosUsuario of usuariosExemplo) {
      try {
        // Verificar se usuário já existe usando query raw para Oracle 10g
        const existeResult = await AppDataSource.query(
          'SELECT COUNT(*) as count FROM usuarios WHERE email = :1',
          [dadosUsuario.email]
        );

        const usuarioExiste = existeResult[0].COUNT > 0;

        if (!usuarioExiste) {
          // Inserir usando query raw com placeholders Oracle
          await AppDataSource.query(
            'INSERT INTO usuarios (id, nome, email) VALUES (usuarios_seq.NEXTVAL, :1, :2)',
            [dadosUsuario.nome, dadosUsuario.email]
          );
          console.log(`✅ Usuário "${dadosUsuario.nome}" inserido com sucesso`);
        } else {
          console.log(`ℹ️ Usuário "${dadosUsuario.nome}" já existe`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao inserir usuário "${dadosUsuario.nome}":`, error.message);
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao inserir dados:', error.message);
  }
}

async function consultarDados(): Promise<void> {
  try {
    // Usar query raw para Oracle 10g em vez do repository
    const usuarios = await AppDataSource.query(
      'SELECT id, nome, email, data_criacao FROM usuarios ORDER BY id'
    );
    
    console.log('\n📊 Dados da tabela usuarios (via TypeORM):');
    console.log('ID | Nome | Email | Data Criação');
    console.log('---|------|-------|-------------');
    
    usuarios.forEach((usuario: any) => {
      console.log(`${usuario.ID} | ${usuario.NOME} | ${usuario.EMAIL} | ${usuario.DATA_CRIACAO}`);
    });
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Erro ao consultar dados:', error.message);
  }
}

// Tratamento de sinais para fechar conexão adequadamente
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando aplicação...');
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Conexão TypeORM fechada');
    }
  } catch (error: any) {
    console.error('❌ Erro ao fechar conexão:', error.message);
  }
  process.exit(0);
});

// Iniciar aplicação
iniciarAplicacao();
