# Moona AI 财务生活助手

Moona 是一个面向微信小程序的 AI 记账与会员服务应用。项目采用 monorepo 结构，包含 uni-app 前端和 NestJS 后端，线上主要运行在微信云托管。

## 技术栈

- 前端：uni-app、Vue 3、TypeScript、Pinia、微信小程序
- 后端：NestJS、Prisma、MySQL、JWT
- AI：OpenAI 兼容接口，当前支持小米 MiMo Token Plan
- 支付：微信小程序虚拟支付 `wx.requestVirtualPayment`
- 部署：微信云托管 CloudRun，服务名当前为 `express-z4u4`

## 目录结构

```text
apps/
  api/      NestJS REST API，Prisma 数据库模型，微信登录和虚拟支付
  mobile/   uni-app 小程序/H5 前端
wechat.txt  微信云托管/开放接口服务/虚拟支付相关文档摘录
```

## 本地开发

安装依赖：

```bash
npm install
```

生成 Prisma Client：

```bash
npm --workspace apps/api run prisma:generate
```

启动后端：

```bash
npm run dev:api
```

启动 H5 前端：

```bash
npm run dev:mobile
```

编译微信小程序：

```bash
npm --workspace apps/mobile run build:mp-weixin
```

编译产物在：

```text
apps/mobile/dist/build/mp-weixin
```

用微信开发者工具导入这个目录即可运行。

## 常用命令

```bash
npm run typecheck
npm --workspace apps/api run typecheck
npm --workspace apps/mobile run typecheck
npm --workspace apps/api run build
npm --workspace apps/mobile run build:mp-weixin
npm --workspace apps/api run prisma:migrate
npm --workspace apps/api run prisma:studio
```

## 后端环境变量

后端读取 `apps/api/.env`，可从 `apps/api/.env.example` 复制：

```bash
copy apps\api\.env.example apps\api\.env
```

### 基础服务

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 本地必填 | Prisma MySQL 连接串，例如 `mysql://root:password@localhost:3306/moona`。微信云托管 Dockerfile 会用 `MYSQL_USERNAME` 等变量自动拼接。 |
| `JWT_SECRET` | 生产必填 | JWT 签名密钥，生产环境必须改成强随机字符串。 |
| `PORT` | 否 | 本地默认可用 `3000`；云托管容器默认监听 `80`。 |

### 微信小程序登录

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `WX_APPID` | 必填 | 小程序 AppID。 |
| `WX_APP_SECRET` | 必填 | 小程序 AppSecret，用于 `code2Session` 获取虚拟支付签名需要的 `session_key`。 |
| `WX_OPENAPI_FROM_APPID` | 条件必填 | 云托管资源复用时填写实际小程序 AppID，避免接口主体错误导致 `api unauthorized`。非资源复用可留空。 |

云托管下 `/api/auth/wx-login` 会优先使用请求头 `x-wx-openid` / `x-wx-unionid` 登录；`code2Session` 只用于刷新支付 `session_key`，失败不会阻塞登录。

### 微信虚拟支付

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `WX_VIRTUAL_PAY_OFFER_ID` | 必填 | 微信虚拟支付基础配置里的 `offerid`。 |
| `WX_VIRTUAL_PAY_APP_KEY` | 现网必填 | 虚拟支付现网 AppKey。 |
| `WX_VIRTUAL_PAY_SANDBOX_APP_KEY` | 沙箱必填 | 虚拟支付沙箱 AppKey。 |
| `WX_VIRTUAL_PAY_ENV` | 必填 | `0` 为现网，`1` 为沙箱。 |
| `WX_VIRTUAL_PAY_MODE` | 否 | 默认 `short_series_goods`，用于 `wx.requestVirtualPayment` 的 `mode`。 |
| `WX_VIRTUAL_PAY_PRODUCT_MONTHLY_PRO` | 否 | 月卡道具 ID，默认 `monthly_pro`。 |
| `WX_VIRTUAL_PAY_PRODUCT_QUARTERLY_PRO` | 否 | 季卡道具 ID，默认 `quarterly_pro`。 |
| `WX_VIRTUAL_PAY_PRODUCT_YEARLY_PRO` | 否 | 年卡道具 ID，默认 `yearly_pro`。 |
| `WX_VIRTUAL_PAY_PRODUCT_YEARLY_PREMIUM` | 否 | 永久会员道具 ID，默认 `yearly_premium`。永久会员价格为 288 元。 |
| `WX_VIRTUAL_PAY_NOTIFY_SECRET` | 否 | 配置后回调地址需要带 `?secret=同值`。 |
| `WX_VIRTUAL_PAY_TRUST_CLIENT_SUCCESS` | 否 | `true` 时允许客户端支付成功后通过 sync 标记到账；生产建议依赖微信回调，默认 `false`。 |

注意：环境变量名不能带前导空格。错误示例：` WX_VIRTUAL_PAY_TRUST_CLIENT_SUCCESS`。

### AI 服务

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `XIAOMI_MIMO_API_KEY` | 推荐 | 小米 MiMo Token Plan API Key。 |
| `XIAOMI_MIMO_BASE_URL` | 推荐 | OpenAI 兼容地址，例如 `https://token-plan-cn.xiaomimimo.com/v1`。 |
| `XIAOMI_MIMO_MODEL` | 推荐 | 模型名，例如 `xiaomi/mimo-v2.5-pro`。 |
| `MIMO_API_KEY` / `MIMO_BASE_URL` / `MIMO_MODEL` | 可选 | MiMo 兼容备用变量名。 |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` | 可选 | 通用 OpenAI 兼容备用变量名。 |

### 短信登录

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `SMS_APP_ID` | 手机号登录必填 | 短信服务 App ID。 |
| `SMS_SECRET_KEY` | 手机号登录必填 | 短信服务密钥。 |
| `SMS_BASE_URL` | 手机号登录必填 | 短信服务接口地址。 |
| `SMS_TEMPLATE_ID` | 手机号登录必填 | 验证码短信模板 ID。 |

### 邮箱验证码

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `SMTP_HOST` | 邮箱绑定必填 | SMTP 服务器地址，例如 `smtp.qq.com`、`smtp.gmail.com`。 |
| `SMTP_PORT` | 邮箱绑定必填 | SMTP 端口，常用 `465` 或 `587`。 |
| `SMTP_USER` | 邮箱绑定必填 | SMTP 登录账号。 |
| `SMTP_PASS` | 邮箱绑定必填 | SMTP 密码或授权码，通常不是邮箱登录密码。 |
| `SMTP_FROM` | 邮箱绑定必填 | 发件人地址，可写成 `Moona <no-reply@example.com>`。 |

未配置 SMTP 时，邮箱验证码只会打印在后端日志中，不会真实发送邮件。

## 微信云托管配置

### 云托管服务

当前小程序前端写死的云托管配置在 `apps/mobile/src/utils/request.ts`：

```ts
const CLOUD_ENV = 'prod-d3gw02rfhd26627e8';
const CLOUD_SERVICE = 'express-z4u4';
```

如果更换云托管环境或服务名，需要同步修改这里并重新编译小程序。

### 开放接口服务

为避免 `code2Session` 在云托管内出现证书问题，后端会优先使用：

```text
http://api.weixin.qq.com/sns/jscode2session
```

需要在微信云托管控制台完成：

1. 开启「开放接口服务」。
2. 在「云调用 / 微信令牌权限 / 自定义接口」添加 `/sns/jscode2session`。
3. 如果是资源复用，配置 `WX_OPENAPI_FROM_APPID`。
4. 重新构建并发布一个新的服务版本。

成功走开放接口服务时，后端日志会出现：

```text
code2Session 命中开放接口服务 x-openapi-seqid=...
```

常见错误：

- `85107 URL不在白名单内`：没有添加 `/sns/jscode2session`，或新版本未发布。
- `access_token missing`：开放接口服务未开启或版本未重新发布。
- `api unauthorized`：调用主体不对，检查资源复用和 `WX_OPENAPI_FROM_APPID`。
- `self signed certificate`：不应走公网 HTTPS，确认已发布包含开放接口服务的新版本。

### 虚拟支付流程

1. 小程序登录，云托管请求头提供 `x-wx-openid`。
2. 后端用 `code2Session` 刷新 `User.wxSessionKey`。
3. 前端请求 `/api/payment/create-order`。
4. 后端返回 `mode/signData/paySig/signature`。
5. 前端调用 `wx.requestVirtualPayment`。
6. 微信回调 `/api/payment/notify` 后，订单变为 `paid`，会员生效。

## 数据库

本地使用 Prisma migration：

```bash
npm --workspace apps/api run prisma:migrate
```

云托管容器启动时会执行：

```bash
npx prisma migrate deploy
```

Dockerfile 会从云托管 MySQL 变量拼接 `DATABASE_URL`：

```text
MYSQL_USERNAME
MYSQL_PASSWORD
MYSQL_ADDRESS
MYSQL_DATABASE
```

## 部署检查清单

后端：

- 配置所有必填环境变量。
- 确认云托管开放接口服务已开启。
- 自定义接口包含 `/sns/jscode2session`。
- 发布新服务版本。
- 日志出现 `Nest application successfully started`。

前端：

- 确认 `CLOUD_ENV` 和 `CLOUD_SERVICE` 正确。
- 运行 `npm --workspace apps/mobile run build:mp-weixin`。
- 微信开发者工具导入 `apps/mobile/dist/build/mp-weixin`。
- 确认微信同声传译插件版本为 `0.3.7`。

支付：

- `WX_VIRTUAL_PAY_ENV` 与微信后台环境一致。
- `WX_VIRTUAL_PAY_PRODUCT_*` 与虚拟支付道具 ID 一致。
- `wx.requestVirtualPayment` 能拉起支付。
- 支付后检查 `/api/payment/notify` 或 `/api/payment/sync/:orderId`。

## 备注

- README 中不应填写真实密钥。
- `apps/api/test-sms.js` 是短信接口调试脚本，不是线上配置来源。
- 旧版微信支付 v3 商户号变量已不再用于会员支付；当前会员支付使用微信小程序虚拟支付。
