#!/bin/sh
set -e

# Ensure the database schema is in place. If no migrations exist yet, fall back to db push.
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy
else
  npx prisma db push --accept-data-loss
fi

exec node dist/index.js
