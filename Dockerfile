FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN corepack enable pnpm && pnpm i --frozen-lockfile

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/drizzle ./drizzle
COPY --from=deps /app/src ./src
COPY --from=deps /app/package.json ./package.json

EXPOSE 8970

ENV PORT=8970

CMD ["npm", "start"]
