import { Redis } from 'ioredis';

// ============================================
// Redis Connection
// ============================================

let redisClient: Redis | null = null;

/**
 * Whether Redis is configured (REDIS_URL set). When false, API runs without
 * Redis (Chat works; recording jobs and Redis-based rate limiting are disabled).
 */
export function isRedisAvailable(): boolean {
  const url = process.env.REDIS_URL;
  return typeof url === 'string' && url.length > 0;
}

/**
 * Get Redis client singleton. Throws if Redis is not configured.
 */
export function getRedisClient(): Redis {
  if (!isRedisAvailable()) {
    throw new Error(
      'Redis is not configured (REDIS_URL empty). Set REDIS_URL to use job queues and Redis rate limiting, or run without it for Chat only.'
    );
  }
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL!;

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  return redisClient;
}

/**
 * Get Redis connection options for BullMQ
 */
export function getRedisConnection() {
  return getRedisClient();
}

/**
 * Disconnect Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Check Redis connection health. Returns false if Redis is not configured.
 */
export async function checkRedisConnection(): Promise<boolean> {
  if (!isRedisAvailable()) return false;
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
