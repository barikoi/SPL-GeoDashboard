## ## ##
# Install dependencies only when needed
FROM node:20.5.0-alpine AS deps

# # Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./

ENV SKIP_HUSKY=1

RUN npm ci --force

# Rebuild the source code only when needed
FROM node:20.5.0-alpine AS builder

WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

ENV NEXT_PUBLIC_BASE_URL=NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BARIKOI_API_KEY=NEXT_PUBLIC_BARIKOI_API_KEY

RUN npm run build

# Production image, copy all the files and run next
FROM node:20.5.0-alpine AS runner

WORKDIR /app

COPY --from=builder /app/app ./app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000

RUN npx next telemetry disable

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["npm", "run", "start"]