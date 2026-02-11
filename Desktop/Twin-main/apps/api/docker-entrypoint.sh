#!/bin/sh
set -e

echo "🔧 Running database migrations..."
cd /app/apps/api
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss
echo "✅ Database ready"

cd /app

# Execute the CMD
exec "$@"
