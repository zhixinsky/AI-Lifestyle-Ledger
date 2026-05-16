import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AdminPayload = { sub: string; username: string; role: string };

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
