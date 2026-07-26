#!/bin/sh
set -e

# Ensure the database schema is in place. If no migrations exist yet, fall back to db push.
npx prisma migrate deploy || npx prisma db push

exec node dist/index.js
