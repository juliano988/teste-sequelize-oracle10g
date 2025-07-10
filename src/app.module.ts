import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioModule } from './usuario/usuario.module';
import { Usuario } from './entities/Usuario';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'oracle',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1521'),
      sid: process.env.DB_SID || 'xe',
      username: process.env.DB_USER || 'system',
      password: process.env.DB_PASSWORD || 'oracle',
      entities: [Usuario],
      synchronize: false, // Importante: false para Oracle 10g
      logging: true,
      extra: {
        // Configurações específicas para Oracle 10g
        connectTimeout: 60000,
        requestTimeout: 60000,
      },
      // Configurar para Oracle 10g - sem FETCH NEXT
      cache: false,
    }),
    UsuarioModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
