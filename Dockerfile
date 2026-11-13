# Production image, for hosting on FAMU-managed infrastructure (or any container host).
#   docker build -t famuseohub .
#   docker run -p 3000:3000 --env-file .env.production famuseohub
# Required env: DATABASE_URL, SESSION_SECRET, LTI_PRIVATE_KEY, APP_URL (see .env.example).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx next build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/.next ./.next
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build /app/next.config.ts ./next.config.ts
USER node
EXPOSE 3000
# Apply pending migrations, then start. Migrations are idempotent and safe to re-run.
CMD ["sh", "-c", "node scripts/migrate.mjs && npx next start -p 3000"]
