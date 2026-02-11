// Transcription module
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
  // Types
  type TranscriptionProvider,
  type TranscriptionResult,
  type TranscriptionInput,
  type TranscriptionOptions,
  type TranscriptSegment,
  type ProviderName,
} from './transcription/index.js';

// Debrief generation
export {
  generateDebrief,
  type DebriefResult,
} from './debrief.js';
