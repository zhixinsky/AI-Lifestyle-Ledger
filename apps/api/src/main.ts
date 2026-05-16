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
  const adminRouter = express.Router();
  adminRouter.use(express.static(adminDist, { index: ['index.html'], redirect: false }));
  adminRouter.get(/^(.*)$/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const sub = req.path || '';
    if (sub.includes('.') && !sub.endsWith('.html')) return next();
    res.sendFile(adminIndex, (err) => (err ? next(err) : undefined));
  });
  const http = app.getHttpAdapter().getInstance();
  http.get('/admin', (_req: express.Request, res: express.Response) => res.redirect(301, '/admin/'));
  app.use('/admin', adminRouter);
  console.log(`[admin] 已挂载运营后台: /admin/ → ${adminDist}`);
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
