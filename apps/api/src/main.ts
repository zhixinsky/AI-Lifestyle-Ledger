import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';

function mountAdminUi(app: NestExpressApplication) {
  const adminDist = join(process.cwd(), 'admin-dist');
  const adminIndex = join(adminDist, 'index.html');
  if (!existsSync(adminIndex)) {
    console.warn(`[admin] 未找到 ${adminIndex}，/admin 不可用（请确认镜像已构建 admin 前端）`);
    return;
  }
  // 不做 /admin → /admin/ 重定向，避免与云托管网关「去尾斜杠」形成死循环
  const staticAdmin = express.static(adminDist, { index: 'index.html', redirect: false });
  const spaFallback = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const rel = req.path.replace(/^\/admin\/?/, '') || '';
    if (rel && /\.[a-z0-9]+$/i.test(rel) && !rel.endsWith('.html')) return next();
    res.sendFile(adminIndex, (err) => (err ? next(err) : undefined));
  };
  app.use('/admin', staticAdmin);
  app.use('/admin', spaFallback);
  console.log(`[admin] 已挂载运营后台: /admin → ${adminDist}`);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  mountAdminUi(app);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true
  }));

  const port = Number(process.env.PORT || 80);
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
