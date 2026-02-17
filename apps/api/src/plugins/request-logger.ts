import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { addSpanAttributes } from '../lib/telemetry.js';

/**
 * Enhanced Request Logging Plugin
 * 
 * Adds structured logging with request context.
 */
export async function registerRequestLogger(app: FastifyInstance): Promise<void> {
  // Log all requests with structured data
  app.addHook('onRequest', async (request: FastifyRequest) => {
    // Skip logging for health checks
    if (request.url === '/api/health' || request.url === '/api/ready') {
      return;
    }

    const userId = request.headers['x-user-id'];
    
    // Add context for logging
    request.log.info({
      type: 'request',
      method: request.method,
      url: request.url,
      userId: userId || 'anonymous',
      userAgent: request.headers['user-agent'],
      ip: getClientIp(request),
    }, 'Incoming request');

    // Add to OpenTelemetry span if enabled
    addSpanAttributes({
      'http.user_id': userId?.toString() || 'anonymous',
      'http.client_ip': getClientIp(request),
    });
  });

  // Log response with timing
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip logging for health checks
    if (request.url === '/api/health' || request.url === '/api/ready') {
      return;
    }

    const responseTime = reply.elapsedTime;
    const statusCode = reply.statusCode;
    const userId = request.headers['x-user-id'];

    // Determine log level based on status code
    const logData = {
      type: 'response',
      method: request.method,
      url: request.url,
      statusCode,
      responseTime: Math.round(responseTime),
      userId: userId || 'anonymous',
    };

    if (statusCode >= 500) {
      request.log.error(logData, 'Request completed with server error');
    } else if (statusCode >= 400) {
      request.log.warn(logData, 'Request completed with client error');
    } else {
      request.log.info(logData, 'Request completed');
    }
  });

  // Log errors
  app.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    const userId = request.headers['x-user-id'];

    request.log.error({
      type: 'error',
      method: request.method,
      url: request.url,
      userId: userId || 'anonymous',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }, 'Request error');
  });
}

/**
 * Get client IP address, handling proxies
 */
function getClientIp(request: FastifyRequest): string {
  // Check X-Forwarded-For header (set by proxies)
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header (nginx)
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  // Fall back to direct connection IP
  return request.ip;
}
