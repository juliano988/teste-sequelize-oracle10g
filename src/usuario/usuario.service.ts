import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';

@Injectable()
export class UsuarioService implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Criar estrutura do banco quando o módulo inicializar
    await this.verificarConexao();
    // await this.criarEstruturaBanco();
    // await this.inserirDadosExemplo();
  }

  private async criarEstruturaBanco(): Promise<void> {
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
        await this.dataSource.query(createSequenceSQL);
        console.log('✅ Sequência "usuarios_seq" criada com sucesso');
      } catch (error: any) {
        if (error.code === 955) {
          // Sequência já existe
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
        await this.dataSource.query(createTableSQL);
        console.log('✅ Tabela "usuarios" criada com sucesso');
      } catch (error: any) {
        if (error.code === 955) {
          // Tabela já existe
          console.log('ℹ️ Tabela "usuarios" já existe');
        } else {
          console.error('❌ Erro ao criar tabela:', error.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar estrutura do banco:', error.message);
    }
  }

  private async inserirDadosExemplo(): Promise<void> {
    try {
      const usuariosExemplo = [
        { nome: 'João Silva', email: 'joao@example.com' },
        { nome: 'Maria Santos', email: 'maria@example.com' },
        { nome: 'Pedro Oliveira', email: 'pedro@example.com' },
      ];

      for (const dadosUsuario of usuariosExemplo) {
        try {
          // Verificar se usuário já existe usando query raw para Oracle 10g
          const existeResult = await this.dataSource.query(
            'SELECT COUNT(*) as count FROM usuarios WHERE email = :1',
            [dadosUsuario.email],
          );

          const usuarioExiste = existeResult[0].COUNT > 0;

          if (!usuarioExiste) {
            // Inserir usando query raw com placeholders Oracle
            await this.dataSource.query(
              'INSERT INTO usuarios (id, nome, email) VALUES (usuarios_seq.NEXTVAL, :1, :2)',
              [dadosUsuario.nome, dadosUsuario.email],
            );
            console.log(
              `✅ Usuário "${dadosUsuario.nome}" inserido com sucesso`,
            );
          } else {
            console.log(`ℹ️ Usuário "${dadosUsuario.nome}" já existe`);
          }
        } catch (error: any) {
          console.error(
            `❌ Erro ao inserir usuário "${dadosUsuario.nome}":`,
            error.message,
          );
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao inserir dados:', error.message);
    }
  }

  async findAll(): Promise<any[]> {
    try {
      // Usar query raw para Oracle 10g em vez do repository
      const usuarios = await this.dataSource.query(
        'SELECT id, nome, email, data_criacao FROM usuarios ORDER BY id',
      );

      return usuarios.map((usuario: any) => ({
        id: usuario.ID,
        nome: usuario.NOME,
        email: usuario.EMAIL,
        dataCriacao: usuario.DATA_CRIACAO,
      }));
    } catch (error: any) {
      console.error('❌ Erro ao consultar dados:', error.message);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<any> {
    try {
      const resultado = await this.dataSource.query(
        'SELECT id, nome, email, data_criacao FROM usuarios WHERE email = :1',
        [email],
      );

      if (resultado.length > 0) {
        const usuario = resultado[0];
        return {
          id: usuario.ID,
          nome: usuario.NOME,
          email: usuario.EMAIL,
          dataCriacao: usuario.DATA_CRIACAO,
        };
      }

      return null;
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuário por email:', error.message);
      throw error;
    }
  }

  async create(dadosUsuario: { nome: string; email: string }): Promise<any> {
    try {
      // Verificar se usuário já existe
      const usuarioExistente = await this.findByEmail(dadosUsuario.email);

      if (usuarioExistente) {
        throw new Error('Usuário já existe com este email');
      }

      // Inserir novo usuário
      await this.dataSource.query(
        'INSERT INTO usuarios (id, nome, email) VALUES (usuarios_seq.NEXTVAL, :1, :2)',
        [dadosUsuario.nome, dadosUsuario.email],
      );

      // Retornar o usuário criado
      return await this.findByEmail(dadosUsuario.email);
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error.message);
      throw error;
    }
  }

  async getStatus(): Promise<any> {
    try {
      // Testar conexão com query raw
      const result = await this.dataSource.query('SELECT SYSDATE FROM DUAL');
      const totalUsuarios = await this.dataSource.query(
        'SELECT COUNT(*) as total FROM usuarios',
      );

      return {
        status: 'OK',
        dataAtual: result[0].SYSDATE,
        totalUsuarios: totalUsuarios[0].TOTAL,
        conexao: 'TypeORM + Oracle 10g',
        modo: 'Thick Mode',
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter status:', error.message);
      throw error;
    }
  }

  async verificarConexao(): Promise<{
    conectado: boolean;
    detalhes?: any;
    erro?: string;
  }> {
    try {
      // Query simples que não altera dados - apenas verifica conexão
      const resultado = await this.dataSource.query('SELECT 1 FROM DUAL');

      console.log('Conexão com o banco bem sucedida');

      return {
        conectado: true,
        detalhes: {
          resultado: resultado[0],
          timestamp: new Date().toISOString(),
          banco: 'Oracle 10g',
          status: 'Conexão ativa',
        },
      };
    } catch (error: any) {
      console.error('❌ Erro ao verificar conexão:', error.message);

      return {
        conectado: false,
        erro: error.message,
      };
    }
  }
}
