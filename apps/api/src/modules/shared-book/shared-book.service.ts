import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookRole, BookType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SharedBookService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async create(userId: string, name: string, type: BookType) {
    let inviteCode: string;
    let exists = true;
    while (exists) {
      inviteCode = this.generateInviteCode();
      exists = !!(await this.prisma.sharedBook.findUnique({ where: { inviteCode } }));
    }

    return this.prisma.$transaction(async (tx) => {
      const book = await tx.sharedBook.create({
        data: { name, type, inviteCode: inviteCode!, createdBy: userId },
      });
      await tx.bookMember.create({
        data: { bookId: book.id, userId, role: BookRole.owner },
      });
      return book;
    });
  }

  async join(userId: string, inviteCode: string) {
    const book = await this.prisma.sharedBook.findUnique({
      where: { inviteCode },
      include: { members: true },
    });
    if (!book) throw new NotFoundException('邀请码无效');

    const already = book.members.find((m) => m.userId === userId);
    if (already) throw new BadRequestException('你已经在这个账本中了');

    if ((book.type === BookType.couple || book.type === BookType.love) && book.members.length >= 2) {
      throw new BadRequestException('恋爱空间最多只能有2人');
    }

    await this.prisma.bookMember.create({
      data: { bookId: book.id, userId, role: BookRole.member },
    });

    return book;
  }

  async leave(userId: string, bookId: string) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member) throw new NotFoundException('不在此账本中');
    if (member.role === BookRole.owner) {
      throw new ForbiddenException('创建者不能离开账本，请先转让或删除账本');
    }

    await this.prisma.bookMember.delete({
      where: { bookId_userId: { bookId, userId } },
    });
    return { success: true };
  }

  async listMyBooks(userId: string) {
    const memberships = await this.prisma.bookMember.findMany({
      where: { userId },
      include: {
        book: { include: { members: { include: { user: { select: { id: true, nickname: true, avatarUrl: true } } } } } },
      },
    });
    return memberships.map((m) => ({
      ...m.book,
      myRole: m.role,
      memberCount: m.book.members.length,
    }));
  }

  async getBookDetail(userId: string, bookId: string) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member) throw new ForbiddenException('无权访问此账本');

    const book = await this.prisma.sharedBook.findUnique({
      where: { id: bookId },
      include: {
        members: {
          include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
        },
      },
    });

    return { ...book, myRole: member.role };
  }

  async listTransactions(userId: string, bookId: string, page = 1, pageSize = 20) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member) throw new ForbiddenException('无权访问此账本');

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { bookId },
        include: {
          category: true,
          user: { select: { id: true, nickname: true, avatarUrl: true } },
        },
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where: { bookId } }),
    ]);

    return { items, total, page, pageSize };
  }

  async getAAStats(userId: string, bookId: string) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member) throw new ForbiddenException('无权访问此账本');

    const members = await this.prisma.bookMember.findMany({
      where: { bookId },
      include: { user: { select: { id: true, nickname: true } } },
    });

    const stats = await Promise.all(
      members.map(async (m) => {
        const agg = await this.prisma.transaction.aggregate({
          where: { bookId, userId: m.userId, type: 'expense' },
          _sum: { amount: true },
        });
        return {
          userId: m.userId,
          nickname: m.user.nickname,
          totalExpense: Number(agg._sum.amount || 0),
        };
      }),
    );

    const grandTotal = stats.reduce((s, i) => s + i.totalExpense, 0);
    const perPerson = members.length > 0 ? grandTotal / members.length : 0;

    return {
      members: stats.map((s) => ({
        ...s,
        fairShare: perPerson,
        diff: s.totalExpense - perPerson,
      })),
      grandTotal,
      perPerson,
    };
  }

  async setRole(userId: string, bookId: string, targetUserId: string, role: BookRole) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member || member.role !== BookRole.owner) {
      throw new ForbiddenException('只有创建者才能设置角色');
    }

    return this.prisma.bookMember.update({
      where: { bookId_userId: { bookId, userId: targetUserId } },
      data: { role },
    });
  }

  async deleteBook(userId: string, bookId: string) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member || member.role !== BookRole.owner) {
      throw new ForbiddenException('只有创建者才能删除账本');
    }

    await this.prisma.sharedBook.delete({ where: { id: bookId } });
    return { success: true };
  }
}
