// Config exports
export { QUEUE_NAMES, type QueueName } from './config.js';
export type {
  TranscriptionJobData,
  DebriefJobData,
  TranscriptionResult,
  DebriefResult,
} from './config.js';

// Queue instances
export { transcriptionQueue, debriefQueue } from './queues.js';

// Transcription queue exports
export {
  startTranscriptionWorker,
  stopTranscriptionWorker,
  enqueueTranscriptionJob,
  retryTranscriptionJob,
} from './transcription.queue.js';

// Debrief queue exports
export {
  startDebriefWorker,
  stopDebriefWorker,
  enqueueDebriefJob,
  retryDebriefJob,
} from './debrief.queue.js';

// Import for internal use
import { startTranscriptionWorker, stopTranscriptionWorker } from './transcription.queue.js';
import { startDebriefWorker, stopDebriefWorker } from './debrief.queue.js';
import { transcriptionQueue, debriefQueue } from './queues.js';

// ============================================
// Worker Management
// ============================================

/**
 * Start all workers (no-op when Redis is not configured)
 */
export function startAllWorkers(): void {
  if (!transcriptionQueue && !debriefQueue) {
    console.log('⏭️  Skipping job workers (Redis not configured)');
    return;
  }
  console.log('🚀 Starting job workers...');
  startTranscriptionWorker();
  startDebriefWorker();
  console.log('✅ All workers started');
}

/**
 * Stop all workers gracefully
 */
export async function stopAllWorkers(): Promise<void> {
  await Promise.all([stopTranscriptionWorker(), stopDebriefWorker()]);
}

/**
 * Close all queue connections (no-op when Redis is not configured)
 */
export async function closeAllQueues(): Promise<void> {
  if (!transcriptionQueue && !debriefQueue) return;
  console.log('🛑 Closing queue connections...');
  await Promise.all([
    ...(transcriptionQueue ? [transcriptionQueue.close()] : []),
    ...(debriefQueue ? [debriefQueue.close()] : []),
  ]);
  console.log('✅ All queues closed');
}
