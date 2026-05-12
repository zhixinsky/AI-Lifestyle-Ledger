# Moona AI 财务生活助手

按 `开发文档.txt` 分阶段开发。

## 第一阶段 MVP

- 前端：uni-app + Vue3 + TypeScript + Pinia
- 后端：NestJS + Prisma + MySQL + JWT
- 功能：登录、基础记账、账单列表、基础统计、AI 聊天 UI、我的页面

## 目录

```text
apps/
  mobile/  小程序/H5/App 前端
  api/     NestJS REST API
```

## 本地运行

```bash
npm install
npm run dev:api
npm run dev:mobile
```

后端默认读取 `apps/api/.env`，可参考 `apps/api/.env.example`。
