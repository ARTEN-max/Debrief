import * as Sentry from '@sentry/node';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getEnv, isProduction } from './env.js';

// ============================================
// Sentry Initialization
// ============================================

let isInitialized = false;

/**
 * Initialize Sentry error tracking
 * Call this at application startup
 */
export function initSentry(): void {
  if (isInitialized) return;

  const env = getEnv();
  
  if (!env.SENTRY_DSN) {
    console.log('ℹ️  Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: isProduction() ? 0.1 : 1.0,
    
    // Only send errors in production by default
    enabled: isProduction() || !!env.SENTRY_DSN,
    
    // Integrations
    integrations: [
      // Add Node.js specific integrations
      Sentry.httpIntegration(),
      Sentry.prismaIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-api-key'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  isInitialized = true;
  console.log('✅ Sentry initialized');
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message and send to Sentry
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string }): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  Sentry.addBreadcrumb(breadcrumb);
}

// ============================================
// Fastify Integration
// ============================================

/**
 * Fastify error handler that reports to Sentry
 */
export function sentryErrorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Add request context
  Sentry.withScope((scope) => {
    scope.setTag('url', request.url);
    scope.setTag('method', request.method);
    scope.setExtra('params', request.params);
    scope.setExtra('query', request.query);
    
    // Set user if available
    const userId = request.headers['x-user-id'];
    if (userId && typeof userId === 'string') {
      scope.setUser({ id: userId });
    }

    captureException(error);
  });

  // Let Fastify handle the response
  reply.send(error);
}

/**
 * Register Sentry hooks with Fastify
 */
export function registerSentryHooks(app: FastifyInstance): void {
  // Add request context to Sentry scope
  app.addHook('onRequest', async (request) => {
    const userId = request.headers['x-user-id'];
    if (userId && typeof userId === 'string') {
      setUser({ id: userId });
    }

    addBreadcrumb({
      category: 'http',
      message: `${request.method} ${request.url}`,
      level: 'info',
    });
  });

  // Clear user on response
  app.addHook('onResponse', async () => {
    clearUser();
  });

  // Capture unhandled errors
  app.setErrorHandler(sentryErrorHandler);
}

/**
 * Flush Sentry events (call before shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<void> {
  await Sentry.flush(timeout);
}
