#!/bin/sh
# Container entrypoint: ensure the database schema is up to date, then start.
set -e

echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."

attempt=0
max_attempts=10
until npx prisma migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "[entrypoint] ERROR: migrations failed after ${attempt} attempts." >&2
    exit 1
  fi
  echo "[entrypoint] Database not ready yet — retrying in 3s (${attempt}/${max_attempts})..."
  sleep 3
done

echo "[entrypoint] Migrations applied. Starting the bot..."
exec node dist/main.js
