// Export all services
export * as recordingsService from './recordings.service.js';
export * as jobsService from './jobs.service.js';
export * as usersService from './users.service.js';

// Export individual functions for convenience
export {
  createRecording,
  setRecordingObjectKey,
  completeUpload,
  getRecording,
  getRecordingByUser,
  listRecordingsByUser,
  updateRecordingStatus,
  updateRecording,
  saveTranscript,
  saveDebrief,
  deleteRecording,
  recordingBelongsToUser,
  getPendingRecordings,
} from './recordings.service.js';

export type {
  CreateRecordingInput,
  RecordingWithRelations,
  ListRecordingsOptions,
  PaginatedRecordings,
} from './recordings.service.js';

export {
  createJob,
  getJob,
  getJobsByRecording,
  getPendingJobs,
  updateJobStatus,
  startJob,
  completeJob,
  failJob,
  hasActiveJob,
} from './jobs.service.js';

export type { CreateJobInput } from './jobs.service.js';

export {
  createUser,
  getUser,
  getUserByEmail,
  getOrCreateUser,
  deleteUser,
} from './users.service.js';
