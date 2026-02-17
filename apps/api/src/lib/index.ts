// Environment & Configuration
export {
  validateEnv,
  getEnv,
  isProduction,
  isDevelopment,
  isTest,
} from './env.js';

export type { Env } from './env.js';

// Database
export { db, disconnectDb, checkDbConnection, withTransaction } from './db.js';

// Redis
export {
  getRedisClient,
  getRedisConnection,
  disconnectRedis,
  checkRedisConnection,
} from './redis.js';

// Storage (S3)
export {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  objectExists,
  getObjectMetadata,
  deleteObject,
  generateObjectKey,
  isAllowedMimeType,
  getExtensionFromMimeType,
} from './storage.js';

export type {
  PresignedUploadResult,
  PresignedDownloadResult,
} from './storage.js';

// Sentry (Error Tracking)
export {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  registerSentryHooks,
  flushSentry,
} from './sentry.js';

// Telemetry (OpenTelemetry)
export {
  initTelemetry,
  shutdownTelemetry,
  getTracer,
  createSpan,
  addSpanAttributes,
  addSpanEvent,
  recordSpanError,
} from './telemetry.js';

// AI Services - Transcription
export {
  // Main functions
  transcribe,
  transcribeBuffer,
  transcribeUrl,
  // Factory
  getTranscriptionProvider,
  createProvider,
  resetProvider,
  getCurrentProviderName,
  isProviderAvailable,
  getAvailableProviders,
  // Providers
  DeepgramProvider,
  OpenAIWhisperProvider,
  WhisperLocalProvider,
  MockTranscriptionProvider,
  mockProvider,
} from './ai/index.js';

export type {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionInput,
  TranscriptionOptions,
  TranscriptSegment,
  ProviderName,
} from './ai/index.js';

// AI Services - Debrief
export {
  generateDebrief,
} from './ai/index.js';

export type {
  DebriefResult,
} from './ai/index.js';
