import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { getEnv } from '../lib/env.js';
import { getRedisClient } from '../lib/redis.js';

/**
 * Rate Limiting Plugin
 * 
 * Limits requests per user to prevent abuse.
 * Uses Redis for distributed rate limiting across multiple instances.
 */
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  const env = getEnv();

  await app.register(rateLimit, {
    // Global limits
    max: env.RATE_LIMIT_MAX, // requests per window
    timeWindow: env.RATE_LIMIT_WINDOW_MS, // window in ms

    // Use Redis for distributed rate limiting
    redis: getRedisClient(),

    // Key generator - rate limit per user
    keyGenerator: (request) => {
      // Use user ID if available, otherwise use IP
      const userId = request.headers['x-user-id'];
      if (userId && typeof userId === 'string') {
        return `rate-limit:user:${userId}`;
      }
      // Fallback to IP (with forwarded header support)
      const forwarded = request.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : request.ip;
      return `rate-limit:ip:${ip}`;
    },

    // Error response
    errorResponseBuilder: (_request, context) => {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please wait ${Math.ceil(context.ttl / 1000)} seconds.`,
        statusCode: 429,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },

    // Skip rate limiting for health checks
    skipOnError: true,
    allowList: (request) => {
      const url = request.url;
      return url === '/api/health' || url === '/api/ready';
    },

    // Add headers to show rate limit status
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  app.log.info(
    `✅ Rate limiting enabled: ${env.RATE_LIMIT_MAX} requests per ${env.RATE_LIMIT_WINDOW_MS}ms`
  );
}

// ============================================
// Route-specific Rate Limits
// ============================================

/**
 * Stricter rate limit for expensive operations (e.g., file uploads)
 */
export const uploadRateLimit = {
  max: 10,
  timeWindow: '1 minute',
};

/**
 * Very strict rate limit for auth operations
 */
export const authRateLimit = {
  max: 5,
  timeWindow: '1 minute',
};

/**
 * Lenient rate limit for read operations
 */
export const readRateLimit = {
  max: 200,
  timeWindow: '1 minute',
};
