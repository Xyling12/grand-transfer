#!/bin/sh
# wait-for-db.sh
# Waits for dev.db to be created by the web container before starting the bot

echo "Waiting for SQLite database to be initialized by the web container..."

while [ ! -f /app/prisma/dev.db ]; do
  sleep 2
done

echo "Database found! Running Prisma DB Push to verify schema..."
npx prisma db push --accept-data-loss

echo "Starting bot..."
exec npm run bot
