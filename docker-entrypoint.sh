#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "No pending migrations (or using db push workflow)"

echo "Running database seed..."
npx tsx prisma/seed.ts

echo "Starting application..."
exec node server.js
