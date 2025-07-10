"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const oracledb = __importStar(require("oracledb"));
const database_1 = require("./config/database");
async function verificarOracleClient() {
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
        }
        catch (err) {
            if (err.message.includes('has already been initialized')) {
                console.log('ℹ️ Oracle Client já foi inicializado');
            }
            else {
                throw err;
            }
        }
        const clientVersion = oracledb.oracleClientVersionString;
        console.log('✅ Oracle Client Version:', clientVersion);
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao verificar Oracle Client:', error.message);
        return false;
    }
}
async function iniciarAplicacao() {
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
        await database_1.AppDataSource.initialize();
        console.log('✅ Conectado ao Oracle Database com TypeORM!');
        // Testar conexão com query raw
        const result = await database_1.AppDataSource.query('SELECT SYSDATE FROM DUAL');
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
    }
    catch (error) {
        console.error('❌ Erro ao iniciar aplicação:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}
async function criarEstruturaBanco() {
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
            await database_1.AppDataSource.query(createSequenceSQL);
            console.log('✅ Sequência "usuarios_seq" criada com sucesso');
        }
        catch (error) {
            if (error.code === 955) { // Sequência já existe
                console.log('ℹ️ Sequência "usuarios_seq" já existe');
            }
            else {
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
            await database_1.AppDataSource.query(createTableSQL);
            console.log('✅ Tabela "usuarios" criada com sucesso');
        }
        catch (error) {
            if (error.code === 955) { // Tabela já existe
                console.log('ℹ️ Tabela "usuarios" já existe');
            }
            else {
                console.error('❌ Erro ao criar tabela:', error.message);
            }
        }
    }
    catch (error) {
        console.error('❌ Erro ao criar estrutura do banco:', error.message);
    }
}
async function inserirDadosExemplo() {
    try {
        const usuariosExemplo = [
            { nome: 'João Silva', email: 'joao@example.com' },
            { nome: 'Maria Santos', email: 'maria@example.com' },
            { nome: 'Pedro Oliveira', email: 'pedro@example.com' }
        ];
        for (const dadosUsuario of usuariosExemplo) {
            try {
                // Verificar se usuário já existe usando query raw para Oracle 10g
                const existeResult = await database_1.AppDataSource.query('SELECT COUNT(*) as count FROM usuarios WHERE email = :1', [dadosUsuario.email]);
                const usuarioExiste = existeResult[0].COUNT > 0;
                if (!usuarioExiste) {
                    // Inserir usando query raw com placeholders Oracle
                    await database_1.AppDataSource.query('INSERT INTO usuarios (id, nome, email) VALUES (usuarios_seq.NEXTVAL, :1, :2)', [dadosUsuario.nome, dadosUsuario.email]);
                    console.log(`✅ Usuário "${dadosUsuario.nome}" inserido com sucesso`);
                }
                else {
                    console.log(`ℹ️ Usuário "${dadosUsuario.nome}" já existe`);
                }
            }
            catch (error) {
                console.error(`❌ Erro ao inserir usuário "${dadosUsuario.nome}":`, error.message);
            }
        }
    }
    catch (error) {
        console.error('❌ Erro ao inserir dados:', error.message);
    }
}
async function consultarDados() {
    try {
        // Usar query raw para Oracle 10g em vez do repository
        const usuarios = await database_1.AppDataSource.query('SELECT id, nome, email, data_criacao FROM usuarios ORDER BY id');
        console.log('\n📊 Dados da tabela usuarios (via TypeORM):');
        console.log('ID | Nome | Email | Data Criação');
        console.log('---|------|-------|-------------');
        usuarios.forEach((usuario) => {
            console.log(`${usuario.ID} | ${usuario.NOME} | ${usuario.EMAIL} | ${usuario.DATA_CRIACAO}`);
        });
        console.log('');
    }
    catch (error) {
        console.error('❌ Erro ao consultar dados:', error.message);
    }
}
// Tratamento de sinais para fechar conexão adequadamente
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando aplicação...');
    try {
        if (database_1.AppDataSource.isInitialized) {
            await database_1.AppDataSource.destroy();
            console.log('✅ Conexão TypeORM fechada');
        }
    }
    catch (error) {
        console.error('❌ Erro ao fechar conexão:', error.message);
    }
    process.exit(0);
});
// Iniciar aplicação
iniciarAplicacao();
