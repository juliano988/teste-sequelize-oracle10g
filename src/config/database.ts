import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';

export const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1521'),
  sid: process.env.DB_SID || 'xe',
  username: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || 'oracle',
  entities: [Usuario],
  synchronize: false,
  logging: true,
  extra: {
    // Configurações específicas para Oracle 10g
    connectTimeout: 60000,
    requestTimeout: 60000,
  },
  // Configurar para Oracle 10g - sem FETCH NEXT
  cache: false,
});
