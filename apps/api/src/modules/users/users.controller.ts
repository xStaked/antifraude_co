import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UserJwtAuthGuard } from '../auth/user-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(UserJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(
    @CurrentUser() user: { id: string; fullName: string; documentNumber: string; phone: string; email: string; phoneVerified: boolean; trustScore: number; status: string },
  ) {
    return { user };
  }
}
