import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

export class CreateUsuarioDto {
  nome!: string;
  email!: string;
}

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  async findAll() {
    try {
      const usuarios = await this.usuarioService.findAll();
      return {
        success: true,
        data: usuarios,
        total: usuarios.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('status')
  async getStatus() {
    try {
      const status = await this.usuarioService.getStatus();
      return {
        success: true,
        data: status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get(':email')
  async findByEmail(@Param('email') email: string) {
    try {
      const usuario = await this.usuarioService.findByEmail(email);
      
      if (!usuario) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      return {
        success: true,
        data: usuario
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post()
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    try {
      const usuario = await this.usuarioService.create(createUsuarioDto);
      return {
        success: true,
        data: usuario,
        message: 'Usuário criado com sucesso'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
