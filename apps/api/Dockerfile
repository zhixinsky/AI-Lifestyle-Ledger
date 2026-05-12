FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --include=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/uploads

ENV PORT=80
ENV MYSQL_DATABASE=moona
EXPOSE 80

CMD ["sh", "-c", "export DATABASE_URL=\"mysql://${MYSQL_USERNAME}:${MYSQL_PASSWORD}@${MYSQL_ADDRESS}/${MYSQL_DATABASE}\" && echo \"MYSQL_ADDRESS=$MYSQL_ADDRESS\" && echo \"MYSQL_DATABASE=$MYSQL_DATABASE\" && echo \"DATABASE_URL=$DATABASE_URL\" && echo \"PORT=$PORT\" && echo 'Starting node...' && exec node dist/main.js"]