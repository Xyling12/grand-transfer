#!/bin/sh
# wait-for-db.sh
# Waits for dev.db to be created by the web container before starting the bot

echo "Waiting for SQLite database to be initialized by the web container..."

while [ ! -f /app/prisma/dev.db ]; do
  sleep 2
done

echo "Database found! Waiting 5 seconds to let web container finish its DB push..."
sleep 5

echo "Restoring latest schema.prisma to the mounted volume..."
cp -f /app/prisma_backup/schema.prisma /app/prisma/schema.prisma

echo "Pushing schema (fail-safe for bot container)..."
npx prisma db push --accept-data-loss

echo "Starting bot..."
exec npm run bot
