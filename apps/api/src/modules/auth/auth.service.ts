import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    if (dto.code !== '123456') {
      throw new UnauthorizedException('验证码错误，MVP 阶段请使用 123456');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {},
      create: {
        phone: dto.phone,
        nickname: '小满',
        streakDays: 45
      }
    });

    const accessToken = await this.jwtService.signAsync({ sub: user.id, phone: user.phone });

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        streakDays: user.streakDays
      }
    };
  }
}
