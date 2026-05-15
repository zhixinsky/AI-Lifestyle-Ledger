import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookType } from '@prisma/client';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { LifeSpacesService } from './life-spaces.service';

@Controller('life-spaces')
@UseGuards(AuthGuard('jwt'))
export class LifeSpacesController {
  constructor(private readonly lifeSpacesService: LifeSpacesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.lifeSpacesService.list(user.sub);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body('type') type: BookType) {
    return this.lifeSpacesService.create(user.sub, type);
  }

  @Post('settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body('items') items: Array<{ id: string; sort?: number; isVisible?: boolean }> = [],
  ) {
    return this.lifeSpacesService.updateSettings(user.sub, items);
  }

  @Get('home-cards')
  listHomeCards(@CurrentUser() user: AuthUser) {
    return this.lifeSpacesService.listHomeCards(user.sub);
  }

  @Post('home-cards')
  updateHomeCards(
    @CurrentUser() user: AuthUser,
    @Body('items') items: Array<{ key: string; sort?: number; isVisible?: boolean }> = [],
  ) {
    return this.lifeSpacesService.updateHomeCards(user.sub, items);
  }
}
