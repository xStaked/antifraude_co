import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto, RegisterDto, LoginDto, VerifyOtpDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { RateLimit, RateLimitGuard } from '../../shared/security/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth_register',
    points: 5,
    duration: 60 * 60,
    keyExtractor: (req) => req.ip ?? 'unknown',
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerUser(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.loginUser(dto.email, dto.password);
  }

  @Post('verify-otp')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth_verify_otp',
    points: 5,
    duration: 15 * 60,
    keyExtractor: (req) => `${req.body?.phone ?? 'unknown'}:${req.ip ?? 'unknown'}`,
  })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUser() user: { id: string; type: 'admin' | 'user' }) {
    return { user };
  }
}
