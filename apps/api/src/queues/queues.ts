/**
 * Queue instances
 * 
 * Separate file to avoid circular dependencies between workers
 */
import { Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  getQueueOptions,
  type TranscriptionJobData,
  type TranscriptionResult,
  type DebriefJobData,
  type DebriefResult,
} from './config.js';

// ============================================
// Queue Instances
// ============================================

export const transcriptionQueue = new Queue<TranscriptionJobData, TranscriptionResult>(
  QUEUE_NAMES.TRANSCRIPTION,
  getQueueOptions()
);

export const debriefQueue = new Queue<DebriefJobData, DebriefResult>(
  QUEUE_NAMES.DEBRIEF,
  getQueueOptions()
);
