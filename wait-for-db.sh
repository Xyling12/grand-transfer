#!/bin/sh
# wait-for-db.sh
# Waits for the web container to fully initialize the database before starting the bot.
# The web container creates a .db-ready marker AFTER prisma db push succeeds.

echo "Waiting for database to be initialized by the web container..."

# Wait for the marker file that signals DB schema is fully synced
while [ ! -f /app/prisma/.db-ready ]; do
  sleep 2
done

echo "Database is ready! Starting bot..."
exec npm run bot
