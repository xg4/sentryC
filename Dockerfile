FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN corepack enable pnpm && pnpm i --frozen-lockfile

WORKDIR /app/client
RUN corepack enable pnpm && pnpm i --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app .

WORKDIR /app/client
RUN npm run build


FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 8970

ENV PORT=8970
ENV DATABASE_URL=file:/app/db.sqlite3
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
