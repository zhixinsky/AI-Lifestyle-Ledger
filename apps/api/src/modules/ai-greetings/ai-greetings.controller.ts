import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AiGreetingPeriod } from '@prisma/client';
import { CurrentUser, type AuthUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AiGreetingDailyService } from './ai-greeting-daily.service';
import { TodayGreetingQueryDto } from './dto/today-greeting-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai-greetings')
export class AiGreetingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly greetings: AiGreetingDailyService,
  ) {}

  @Get('today')
  async today(@CurrentUser() user: AuthUser, @Query() query: TodayGreetingQueryDto) {
    const u = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { smartGreetingEnabled: true },
    });
    if (!u?.smartGreetingEnabled) {
      return {
        enabled: false,
        title: null,
        subtitles: [],
        source: null,
      };
    }

    const dateStr = query.date || this.greetings.shanghaiTodayYmd();
    const date = this.greetings.parseYmdToDate(dateStr);
    const period = query.period as AiGreetingPeriod;

    const row = await this.greetings.findTodayRow(user.sub, date, period);
    if (!row) {
      return {
        enabled: true,
        title: null,
        subtitles: [],
        source: null,
      };
    }

    return {
      enabled: true,
      title: row.title || null,
      subtitles: Array.isArray(row.subtitles) ? (row.subtitles as string[]) : [],
      source: row.source,
    };
  }
}
