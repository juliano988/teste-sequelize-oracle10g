import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as oracledb from 'oracledb';

async function bootstrap() {
  // Inicializar Oracle Client em Thick Mode antes do NestJS
  try {
    console.log('🔍 Inicializando Oracle Client em Thick Mode...');
    console.log('ORACLE_HOME:', process.env.ORACLE_HOME);
    console.log('LD_LIBRARY_PATH:', process.env.LD_LIBRARY_PATH);
    
    oracledb.initOracleClient({
      libDir: process.env.ORACLE_HOME || '/opt/oracle/instantclient_19_12'
    });
    
    const clientVersion = oracledb.oracleClientVersionString;
    console.log('✅ Oracle Client inicializado:', clientVersion);
  } catch (err: any) {
    if (err.message.includes('has already been initialized')) {
      console.log('ℹ️ Oracle Client já foi inicializado');
    } else {
      console.error('❌ Erro ao inicializar Oracle Client:', err.message);
      process.exit(1);
    }
  }

  // Aguardar banco de dados ficar disponível
  console.log('⏳ Aguardando banco de dados...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS se necessário
  app.enableCors();
  
  await app.listen(3000);
  console.log('🚀 Aplicação NestJS rodando na porta 3000');
}

bootstrap();
