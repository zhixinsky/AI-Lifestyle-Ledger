# 微信云托管：目标目录填 apps，Dockerfile 填 Dockerfile
# 本地：cd apps && docker build -t moona .

FROM node:18-alpine AS admin-builder

WORKDIR /app/admin

COPY admin/package.json ./
RUN npm install --include=dev

COPY admin/ ./
RUN npm run build

FROM node:18-alpine AS api-builder

WORKDIR /app/api

COPY api/package.json api/.npmrc ./
RUN npm install --include=dev

COPY api/prisma ./prisma
RUN npx prisma generate

COPY api/tsconfig.json api/tsconfig.build.json api/nest-cli.json ./
COPY api/src ./src
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache ca-certificates && update-ca-certificates

COPY --from=api-builder /app/api/dist ./dist
COPY --from=api-builder /app/api/node_modules ./node_modules
COPY --from=api-builder /app/api/package.json ./
COPY --from=api-builder /app/api/prisma ./prisma
COPY api/scripts ./scripts
COPY --from=admin-builder /app/admin/dist ./admin-dist

RUN test -f /app/admin-dist/index.html || (echo "ERROR: admin-dist/index.html missing" && exit 1)

RUN mkdir -p /app/uploads

ENV PORT=80
ENV MYSQL_DATABASE=moona
ENV NODE_EXTRA_CA_CERTS=/app/cert/certificate.crt
EXPOSE 80

CMD ["sh", "-c", "export DATABASE_URL=\"mysql://${MYSQL_USERNAME}:${MYSQL_PASSWORD}@${MYSQL_ADDRESS}/${MYSQL_DATABASE}\" && echo \"DATABASE_URL=$DATABASE_URL\" && echo 'Running migrate deploy...' && npx prisma migrate deploy && echo 'Starting node...' && exec node dist/main.js"]
