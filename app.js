const oracledb = require('oracledb');

// Configuração da conexão
const dbConfig = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || 'oracle',
  connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 1521}/${process.env.DB_SID || 'xe'}`
};

async function verificarOracleClient() {
  try {
    console.log('🔍 Verificando Oracle Client...');
    console.log('ORACLE_HOME:', process.env.ORACLE_HOME);
    console.log('LD_LIBRARY_PATH:', process.env.LD_LIBRARY_PATH);
    
    // Verificar se conseguimos inicializar o oracledb
    const clientVersion = oracledb.oracleClientVersionString;
    console.log('✅ Oracle Client Version:', clientVersion);
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar Oracle Client:', error.message);
    return false;
  }
}

async function iniciarAplicacao() {
  let connection;

  try {
    console.log('Iniciando aplicação Node.js...');
    
    // Verificar Oracle Client antes de tentar conectar
    const clientOk = await verificarOracleClient();
    if (!clientOk) {
      console.error('❌ Oracle Client não configurado corretamente');
      process.exit(1);
    }
    
    console.log('Tentando conectar ao Oracle Database...');
    
    // Aguardar um pouco para o banco estar pronto
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Conectar ao banco
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado ao Oracle Database com sucesso!');

    // Testar a conexão com uma query simples
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('📅 Data atual do banco:', result.rows[0][0]);

    // Criar uma tabela de exemplo
    await criarTabelaExemplo(connection);

    // Inserir dados de exemplo
    await inserirDadosExemplo(connection);

    // Consultar dados
    await consultarDados(connection);

    console.log('🚀 Aplicação iniciada com sucesso na porta 3000');
    
    // Manter a aplicação rodando
    setInterval(() => {
      console.log('💓 Aplicação rodando...');
    }, 30000);

  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

async function criarTabelaExemplo(connection) {
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
      await connection.execute(createSequenceSQL);
      console.log('✅ Sequência "usuarios_seq" criada com sucesso');
    } catch (seqError) {
      if (seqError.errorNum === 955) { // Sequência já existe
        console.log('ℹ️ Sequência "usuarios_seq" já existe');
      } else {
        console.error('❌ Erro ao criar sequência:', seqError.message);
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
    
    await connection.execute(createTableSQL);
    console.log('✅ Tabela "usuarios" criada com sucesso');
  } catch (error) {
    if (error.errorNum === 955) { // Tabela já existe
      console.log('ℹ️ Tabela "usuarios" já existe');
    } else {
      console.error('❌ Erro ao criar tabela:', error.message);
    }
  }
}

async function inserirDadosExemplo(connection) {
  try {
    const insertSQL = `
      INSERT INTO usuarios (id, nome, email) 
      VALUES (usuarios_seq.NEXTVAL, :nome, :email)
    `;
    
    const usuarios = [
      { nome: 'João Silva', email: 'joao@example.com' },
      { nome: 'Maria Santos', email: 'maria@example.com' },
      { nome: 'Pedro Oliveira', email: 'pedro@example.com' }
    ];

    for (const usuario of usuarios) {
      try {
        await connection.execute(insertSQL, usuario, { autoCommit: true });
        console.log(`✅ Usuário "${usuario.nome}" inserido com sucesso`);
      } catch (error) {
        if (error.errorNum === 1) { // Violação de unique constraint
          console.log(`ℹ️ Usuário "${usuario.nome}" já existe`);
        } else {
          console.error('❌ Erro ao inserir usuário:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error.message);
  }
}

async function consultarDados(connection) {
  try {
    const result = await connection.execute(
      'SELECT id, nome, email, data_criacao FROM usuarios ORDER BY id'
    );
    
    console.log('\n📊 Dados da tabela usuarios:');
    console.log('ID | Nome | Email | Data Criação');
    console.log('---|------|-------|-------------');
    
    result.rows.forEach(row => {
      console.log(`${row[0]} | ${row[1]} | ${row[2]} | ${row[3]}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro ao consultar dados:', error.message);
  }
}

// Tratamento de sinais para fechar conexão adequadamente
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando aplicação...');
  try {
    await oracledb.getPool().close();
  } catch (error) {
    // Pool pode não existir
  }
  process.exit(0);
});

// Iniciar aplicação
iniciarAplicacao();
