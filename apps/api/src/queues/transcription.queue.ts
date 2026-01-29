import { Worker, type Job } from 'bullmq';
import {
  QUEUE_NAMES,
  getWorkerOptions,
  type TranscriptionJobData,
  type TranscriptionResult,
  type DebriefJobData,
} from './config.js';
import { getPresignedDownloadUrl } from '../lib/storage.js';
import { transcribe } from '../lib/ai/index.js';
import { db } from '../lib/db.js';
import { transcriptionQueue, debriefQueue } from './queues.js';

// Re-export queue for convenience
export { transcriptionQueue };

// ============================================
// Worker
// ============================================

let transcriptionWorker: Worker<TranscriptionJobData, TranscriptionResult> | null = null;

export function startTranscriptionWorker(): Worker<TranscriptionJobData, TranscriptionResult> {
  if (transcriptionWorker) {
    return transcriptionWorker;
  }

  transcriptionWorker = new Worker<TranscriptionJobData, TranscriptionResult>(
    QUEUE_NAMES.TRANSCRIPTION,
    async (job: Job<TranscriptionJobData, TranscriptionResult>) => {
      const { recordingId, jobId, objectKey, mimeType, userId } = job.data;
      const log = (msg: string) => console.log(`[Transcription:${job.id}] ${msg}`);

      try {
        log(`Starting transcription for recording ${recordingId}`);

        // Step 1: Update job status to running
        await updateJobStatus(jobId, 'running');
        await job.updateProgress(10);

        // Step 2: Get presigned download URL
        log('Getting download URL from S3');
        const { downloadUrl } = await getPresignedDownloadUrl(objectKey);
        await job.updateProgress(20);

        // Step 3: Transcribe audio (provider handles download internally if using URL)
        // For better performance with large files, pass the URL directly
        log('Transcribing audio');
        const transcriptionResult = await transcribe(
          { type: 'url', url: downloadUrl, mimeType },
          { punctuate: true, diarize: false }
        );
        log(`Transcription complete: ${transcriptionResult.text.length} chars, ${transcriptionResult.segments?.length ?? 0} segments`);
        await job.updateProgress(70);

        // Step 4: Save transcript to database
        log('Saving transcript to database');
        const transcript = await db.transcript.create({
          data: {
            recordingId,
            text: transcriptionResult.text,
            segments: transcriptionResult.segments as unknown as Parameters<typeof db.transcript.create>[0]['data']['segments'],
            language: transcriptionResult.language,
          },
        });

        // Update recording duration if available
        if (transcriptionResult.duration) {
          await db.recording.update({
            where: { id: recordingId },
            data: { duration: Math.round(transcriptionResult.duration) },
          });
        }
        await job.updateProgress(80);

        // Step 5: Mark transcription job as complete
        await updateJobStatus(jobId, 'complete');

        // Step 6: Get recording details and enqueue debrief job
        log('Enqueueing debrief job');
        const recording = await db.recording.findUnique({
          where: { id: recordingId },
        });

        if (recording) {
          // Create debrief job in database
          const debriefDbJob = await db.job.create({
            data: {
              recordingId,
              type: 'DEBRIEF',
              status: 'pending',
            },
          });

          // Enqueue debrief job
          const debriefJobData: DebriefJobData = {
            recordingId,
            jobId: debriefDbJob.id,
            transcriptId: transcript.id,
            transcriptText: transcriptionResult.text,
            recordingMode: recording.mode,
            recordingTitle: recording.title,
            userId,
          };

          await debriefQueue.add(`debrief-${recordingId}`, debriefJobData, {
            delay: 1000, // Small delay to ensure DB transaction is committed
          });
        }

        await job.updateProgress(100);
        log('Transcription job complete');

        return {
          transcriptId: transcript.id,
          text: transcriptionResult.text,
          segmentCount: transcriptionResult.segments?.length ?? 0,
          language: transcriptionResult.language,
        };
      } catch (error) {
        log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Update job status to failed
        await updateJobStatus(
          jobId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );

        // Update recording status to failed
        await db.recording.update({
          where: { id: recordingId },
          data: { status: 'failed' },
        });

        throw error;
      }
    },
    getWorkerOptions()
  );

  // Event handlers
  transcriptionWorker.on('completed', (job) => {
    console.log(`[Transcription:${job.id}] Completed successfully`);
  });

  transcriptionWorker.on('failed', (job, error) => {
    console.error(`[Transcription:${job?.id}] Failed:`, error.message);
  });

  transcriptionWorker.on('progress', (job, progress) => {
    console.log(`[Transcription:${job.id}] Progress: ${progress}%`);
  });

  return transcriptionWorker;
}

export async function stopTranscriptionWorker(): Promise<void> {
  if (transcriptionWorker) {
    await transcriptionWorker.close();
    transcriptionWorker = null;
  }
}

// ============================================
// Helper Functions
// ============================================

async function updateJobStatus(
  jobId: string,
  status: 'pending' | 'running' | 'complete' | 'failed',
  error?: string
): Promise<void> {
  const data: {
    status: typeof status;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status };

  if (status === 'running') {
    data.startedAt = new Date();
  }

  if (status === 'complete' || status === 'failed') {
    data.completedAt = new Date();
  }

  if (error) {
    data.error = error;
  }

  await db.job.update({
    where: { id: jobId },
    data,
  });
}

// ============================================
// Queue Helper
// ============================================

/**
 * Add a transcription job to the queue
 */
export async function enqueueTranscriptionJob(
  data: TranscriptionJobData
): Promise<string> {
  const job = await transcriptionQueue.add(
    `transcribe-${data.recordingId}`,
    data,
    {
      jobId: `transcribe-${data.recordingId}-${Date.now()}`,
    }
  );
  return job.id!;
}
