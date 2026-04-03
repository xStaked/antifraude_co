import { Injectable } from '@nestjs/common';
import { prisma } from '@sn8/database';

@Injectable()
export class UsersService {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        documentNumber: true,
        phone: true,
        email: true,
        phoneVerified: true,
        trustScore: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
