import { PrismaClient } from '@prisma/client';

// Declare global type for Prisma client singleton
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Prisma client singleton with safe connection handling
 * - In development: reuses client across hot reloads
 * - In production: creates single instance
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  return client;
}

// Use global variable in development to prevent multiple instances during hot reload
export const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}

/**
 * Gracefully disconnect from database
 * Call this in shutdown handlers
 */
export async function disconnectDb(): Promise<void> {
  await db.$disconnect();
}

/**
 * Health check for database connection
 * Returns true if connected, false otherwise
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute a function within a transaction
 */
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return db.$transaction(fn);
}
