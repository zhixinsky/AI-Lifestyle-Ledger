import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookType, BookRole } from '@prisma/client';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { SharedBookService } from './shared-book.service';

@Controller('shared-book')
@UseGuards(AuthGuard('jwt'))
export class SharedBookController {
  constructor(private readonly sharedBookService: SharedBookService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; type?: string },
  ) {
    const type = body.type === 'couple' ? BookType.couple : BookType.family;
    return this.sharedBookService.create(user.sub, body.name, type);
  }

  @Post('join')
  async join(@CurrentUser() user: AuthUser, @Body('inviteCode') inviteCode: string) {
    return this.sharedBookService.join(user.sub, inviteCode);
  }

  @Get()
  async listMyBooks(@CurrentUser() user: AuthUser) {
    return this.sharedBookService.listMyBooks(user.sub);
  }

  @Get(':id')
  async getDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sharedBookService.getBookDetail(user.sub, id);
  }

  @Get(':id/transactions')
  async listTransactions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('page') page?: string,
  ) {
    return this.sharedBookService.listTransactions(
      user.sub, id, page ? parseInt(page) : 1,
    );
  }

  @Get(':id/aa-stats')
  async getAAStats(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sharedBookService.getAAStats(user.sub, id);
  }

  @Post(':id/members/:userId/role')
  async setRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: string,
  ) {
    const bookRole = role === 'admin' ? BookRole.admin : BookRole.member;
    return this.sharedBookService.setRole(user.sub, id, targetUserId, bookRole);
  }

  @Post(':id/leave')
  async leave(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sharedBookService.leave(user.sub, id);
  }

  @Delete(':id')
  async deleteBook(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sharedBookService.deleteBook(user.sub, id);
  }
}
