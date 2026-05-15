import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { AiGreetingDailyService } from './ai-greeting-daily.service';

dayjs.extend(utc);
dayjs.extend(timezone);
const TZ = 'Asia/Shanghai';

@Injectable()
export class AiGreetingCronService {
  private readonly logger = new Logger(AiGreetingCronService.name);

  constructor(private readonly greetings: AiGreetingDailyService) {}

  /** 每日上海时间 04:00 生成「当天」全时段问候缓存 */
  @Cron('0 4 * * *', { timeZone: TZ })
  async handleDailyGreetings() {
    const target = dayjs().tz(TZ).startOf('day').toDate();
    this.logger.log(`[AiGreeting] cron start date=${this.greetings.shanghaiTodayYmd(target)}`);
    const { users, errors } = await this.greetings.runBatchForShanghaiDate(target);
    this.logger.log(`[AiGreeting] cron done users=${users} errors=${errors}`);
  }
}
