import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: { name: true, email: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
