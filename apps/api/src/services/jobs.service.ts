import type { Job, JobStatus, JobType } from '@prisma/client';
import { db } from '../lib/db.js';

// ============================================
// Types
// ============================================

export interface CreateJobInput {
  recordingId: string;
  type: JobType;
}

// ============================================
// Service Functions
// ============================================

/**
 * Create a new job
 */
export async function createJob(data: CreateJobInput): Promise<Job> {
  return db.job.create({
    data: {
      recordingId: data.recordingId,
      type: data.type,
      status: 'pending',
    },
  });
}

/**
 * Get a job by ID
 */
export async function getJob(id: string): Promise<Job | null> {
  return db.job.findUnique({
    where: { id },
  });
}

/**
 * Get jobs for a recording
 */
export async function getJobsByRecording(recordingId: string): Promise<Job[]> {
  return db.job.findMany({
    where: { recordingId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get pending jobs (for job queue processing)
 */
export async function getPendingJobs(
  type?: JobType,
  limit = 10
): Promise<Job[]> {
  return db.job.findMany({
    where: {
      status: 'pending',
      ...(type && { type }),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Update job status
 */
export async function updateJobStatus(
  id: string,
  status: JobStatus,
  error?: string
): Promise<Job> {
  const data: { status: JobStatus; error?: string; startedAt?: Date; completedAt?: Date } = {
    status,
  };

  if (status === 'running') {
    data.startedAt = new Date();
  }

  if (status === 'complete' || status === 'failed') {
    data.completedAt = new Date();
  }

  if (error) {
    data.error = error;
  }

  return db.job.update({
    where: { id },
    data,
  });
}

/**
 * Mark job as started
 */
export async function startJob(id: string): Promise<Job> {
  return updateJobStatus(id, 'running');
}

/**
 * Mark job as completed
 */
export async function completeJob(id: string): Promise<Job> {
  return updateJobStatus(id, 'complete');
}

/**
 * Mark job as failed
 */
export async function failJob(id: string, error: string): Promise<Job> {
  return updateJobStatus(id, 'failed', error);
}

/**
 * Check if there's already a pending/running job of this type for the recording
 */
export async function hasActiveJob(
  recordingId: string,
  type: JobType
): Promise<boolean> {
  const count = await db.job.count({
    where: {
      recordingId,
      type,
      status: { in: ['pending', 'running'] },
    },
  });
  return count > 0;
}
