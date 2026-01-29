import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getEnv } from '../lib/env.js';

/**
 * Upload Guard Plugin
 * 
 * Enforces upload size limits and validates content types.
 */

// Allowed audio MIME types
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/flac',
]);

export async function registerUploadGuard(app: FastifyInstance): Promise<void> {
  const env = getEnv();
  const maxSizeBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

  // Pre-handler to check content-length
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only check for upload routes
    if (!isUploadRoute(request)) {
      return;
    }

    // Check Content-Length header
    const contentLength = request.headers['content-length'];
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSizeBytes) {
        return reply.status(413).send({
          error: 'Payload Too Large',
          message: `File size exceeds maximum allowed size of ${env.MAX_UPLOAD_SIZE_MB}MB`,
          statusCode: 413,
          maxSize: maxSizeBytes,
        });
      }
    }
  });

  app.log.info(`✅ Upload guard enabled: max ${env.MAX_UPLOAD_SIZE_MB}MB`);
}

/**
 * Check if request is an upload route
 */
function isUploadRoute(request: FastifyRequest): boolean {
  // Check for multipart content type
  const contentType = request.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return true;
  }

  // Check for direct file upload (PUT to presigned URL goes to S3, not here)
  // This is mainly for any future direct upload endpoints
  return false;
}

/**
 * Validate audio MIME type
 */
export function isValidAudioType(mimeType: string): boolean {
  return ALLOWED_AUDIO_TYPES.has(mimeType.toLowerCase());
}

/**
 * Get maximum upload size in bytes
 */
export function getMaxUploadSize(): number {
  return getEnv().MAX_UPLOAD_SIZE_MB * 1024 * 1024;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
