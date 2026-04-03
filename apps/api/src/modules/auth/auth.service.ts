import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { prisma, AdminRole } from '@sn8/database';
import { OtpService } from './otp.service';

export interface JwtPayload {
  sub: string;
  role: 'user' | 'moderator' | 'admin';
  phoneVerified?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async adminLogin(email: string, password: string) {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await compare(password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: admin.id,
      role: admin.role,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwtSecret'),
    });

    return {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async registerUser(dto: { fullName: string; documentNumber: string; phone: string; email: string; password: string }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone: dto.phone }, { email: dto.email }, { documentNumber: dto.documentNumber }],
      },
    });

    if (existing) {
      throw new ConflictException('El teléfono, correo o documento ya están registrados');
    }

    const passwordHash = await hash(dto.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        documentNumber: dto.documentNumber,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        phoneVerified: false,
      },
    });

    const code = await this.otpService.generateOtp(user.phone, user.id);

    const nodeEnv = this.configService.get<string>('nodeEnv') ?? 'development';
    const exposeCode = nodeEnv === 'development';

    return {
      userId: user.id,
      phone: user.phone,
      message: 'Usuario registrado. Verifica tu teléfono con el código OTP.',
      ...(exposeCode ? { code } : {}),
    };
  }

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const code = await this.otpService.generateOtp(user.phone, user.id);

    const nodeEnv = this.configService.get<string>('nodeEnv') ?? 'development';
    const exposeCode = nodeEnv === 'development';

    return {
      phone: user.phone,
      message: 'Código OTP enviado.',
      ...(exposeCode ? { code } : {}),
    };
  }

  async verifyOtp(phone: string, code: string) {
    const result = await this.otpService.verifyOtp(phone, code);
    if (!result.valid || !result.userId) {
      throw new BadRequestException('Código OTP inválido o expirado');
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.phoneVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
      user.phoneVerified = true;
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: 'user',
      phoneVerified: user.phoneVerified,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwtSecret'),
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        documentNumber: user.documentNumber,
        phone: user.phone,
        email: user.email,
        phoneVerified: user.phoneVerified,
      },
    };
  }

  async validateJwtPayload(payload: JwtPayload) {
    if (payload.role === 'admin' || payload.role === 'moderator') {
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });
      if (!admin) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      return { ...admin, type: 'admin' as const };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, fullName: true, documentNumber: true, phone: true, email: true, phoneVerified: true, trustScore: true, status: true },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return { ...user, type: 'user' as const };
  }
}
