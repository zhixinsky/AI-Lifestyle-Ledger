import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberLevel } from '@prisma/client';
import { MembershipService } from './membership.service';

export const MEMBER_LEVEL_KEY = 'requiredMemberLevel';

export const RequirePro = () => SetMetadata(MEMBER_LEVEL_KEY, MemberLevel.pro);
export const RequirePremium = () => SetMetadata(MEMBER_LEVEL_KEY, MemberLevel.premium);

@Injectable()
export class MemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membershipService: MembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredLevel = this.reflector.getAllAndOverride<MemberLevel>(
      MEMBER_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredLevel) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.userId;
    if (!userId) throw new ForbiddenException('未登录');

    const status = await this.membershipService.getStatus(userId);

    const levelOrder = { free: 0, pro: 1, premium: 2 };
    if (levelOrder[status.level] < levelOrder[requiredLevel]) {
      throw new ForbiddenException('该功能需要升级会员才能使用');
    }

    return true;
  }
}
