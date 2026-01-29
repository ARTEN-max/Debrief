'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecordings,
  getRecording,
  getRecordingJobs,
  createRecording,
  completeUpload,
  uploadToS3,
  retryDebrief,
  type Recording,
  type RecordingWithRelations,
  type Job,
} from '@/lib/api';
import { useUserId } from '@/lib/auth';

// ============================================
// Query Keys
// ============================================

export const recordingKeys = {
  all: ['recordings'] as const,
  lists: () => [...recordingKeys.all, 'list'] as const,
  list: (page: number) => [...recordingKeys.lists(), page] as const,
  details: () => [...recordingKeys.all, 'detail'] as const,
  detail: (id: string) => [...recordingKeys.details(), id] as const,
  jobs: (id: string) => [...recordingKeys.all, 'jobs', id] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Fetch paginated recordings list
 */
export function useRecordings(page = 1) {
  const userId = useUserId();

  return useQuery({
    queryKey: recordingKeys.list(page),
    queryFn: () => getRecordings(userId, page),
  });
}

/**
 * Fetch single recording with relations
 */
export function useRecording(recordingId: string, enabled = true) {
  const userId = useUserId();

  return useQuery({
    queryKey: recordingKeys.detail(recordingId),
    queryFn: () => getRecording(userId, recordingId, true),
    enabled,
  });
}

/**
 * Fetch recording with polling until complete/failed
 */
export function useRecordingWithPolling(recordingId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: recordingKeys.detail(recordingId),
    queryFn: () => getRecording(userId, recordingId, true),
    refetchInterval: (query) => {
      const data = query.state.data as RecordingWithRelations | undefined;
      // Stop polling only when complete AND we have the debrief,
      // or when failed
      if (data?.status === 'failed') {
        return false;
      }
      if (data?.status === 'complete' && data?.debrief) {
        return false;
      }
      // Poll every 2 seconds while processing or waiting for debrief
      return 2000;
    },
  });
}

/**
 * Fetch jobs for a recording
 */
export function useRecordingJobs(recordingId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: recordingKeys.jobs(recordingId),
    queryFn: () => getRecordingJobs(userId, recordingId),
    refetchInterval: (query) => {
      const data = query.state.data as Job[] | undefined;
      // Stop polling when all jobs are done
      const hasActiveJob = data?.some(
        (job) => job.status === 'pending' || job.status === 'running'
      );
      return hasActiveJob ? 3000 : false;
    },
  });
}

/**
 * Upload recording mutation
 */
export function useUploadRecording() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      title,
      mode,
      onProgress,
    }: {
      file: File;
      title: string;
      mode: string;
      onProgress?: (progress: number) => void;
    }) => {
      // Step 1: Create recording and get presigned URL
      const { recordingId, uploadUrl } = await createRecording(userId, {
        title,
        mode,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      // Step 2: Upload to S3
      await uploadToS3(uploadUrl, file, onProgress);

      // Step 3: Complete upload
      await completeUpload(userId, recordingId, file.size);

      return { recordingId };
    },
    onSuccess: () => {
      // Invalidate recordings list
      queryClient.invalidateQueries({ queryKey: recordingKeys.lists() });
    },
  });
}

/**
 * Retry debrief mutation
 */
export function useRetryDebrief() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordingId: string) => retryDebrief(userId, recordingId),
    onSuccess: (_, recordingId) => {
      // Invalidate the specific recording
      queryClient.invalidateQueries({
        queryKey: recordingKeys.detail(recordingId),
      });
      queryClient.invalidateQueries({
        queryKey: recordingKeys.jobs(recordingId),
      });
    },
  });
}
