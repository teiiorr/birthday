# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder: install all deps, generate Prisma client, compile TS
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Prisma needs OpenSSL to detect the right query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies against the lockfile for reproducible builds.
COPY package*.json ./
RUN npm ci

# Generate the Prisma client (needs the schema).
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runner: production-only deps, non-root, compiled output
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Create an unprivileged user to run the app.
RUN groupadd --system app && useradd --system --gid app --create-home app

# Install only production dependencies (includes the Prisma CLI for migrations).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Regenerate the Prisma client for this image and bring in the compiled app.
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Fix ownership and drop privileges.
RUN chmod +x docker-entrypoint.sh && chown -R app:app /app
USER app

# Health-check endpoint port (long-polling needs no inbound port otherwise).
EXPOSE 3000

# Container-level health check using Node's global fetch (no extra tooling).
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Runs `prisma migrate deploy` (with retry) then starts the bot.
ENTRYPOINT ["./docker-entrypoint.sh"]
