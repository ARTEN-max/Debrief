/**
 * Transcription Module
 * 
 * Provides audio transcription with multiple provider backends.
 * 
 * @example
 * ```typescript
 * import { transcribe, getTranscriptionProvider } from './transcription';
 * 
 * // Simple transcription from buffer
 * const result = await transcribe(
 *   { type: 'buffer', data: audioBuffer, mimeType: 'audio/mpeg' }
 * );
 * 
 * // Transcription from URL with options
 * const result = await transcribe(
 *   { type: 'url', url: 'https://example.com/audio.mp3' },
 *   { language: 'en', diarize: true }
 * );
 * 
 * // Get provider directly
 * const provider = getTranscriptionProvider();
 * console.log(`Using provider: ${provider.name}`);
 * ```
 */

// Re-export types
export type {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionInput,
  TranscriptionOptions,
  TranscriptSegment,
  ProviderName,
  ProviderConfig,
} from './types.js';

// Re-export providers
export { DeepgramProvider } from './deepgram.provider.js';
export { OpenAIWhisperProvider } from './openai.provider.js';
export { WhisperLocalProvider } from './whisper-local.provider.js';
export { MockTranscriptionProvider, mockProvider } from './mock.provider.js';

// Re-export factory functions
export {
  getTranscriptionProvider,
  createProvider,
  resetProvider,
  getCurrentProviderName,
  isProviderAvailable,
  getAvailableProviders,
} from './factory.js';

// ============================================
// Convenience Functions
// ============================================

import type { TranscriptionInput, TranscriptionOptions, TranscriptionResult } from './types.js';
import { getTranscriptionProvider } from './factory.js';

/**
 * Transcribe audio using the configured provider
 * 
 * This is the main entry point for transcription.
 * Provider is selected via TRANSCRIPTION_PROVIDER env var.
 * 
 * @param input - Audio input (buffer or URL)
 * @param options - Transcription options
 * @returns Transcription result with text and segments
 */
export async function transcribe(
  input: TranscriptionInput,
  options?: TranscriptionOptions
): Promise<TranscriptionResult> {
  const provider = getTranscriptionProvider();
  return provider.transcribe(input, options);
}

/**
 * Transcribe audio from a buffer
 * 
 * Convenience function for buffer input.
 */
export async function transcribeBuffer(
  buffer: Buffer,
  mimeType: string,
  options?: TranscriptionOptions
): Promise<TranscriptionResult> {
  return transcribe({ type: 'buffer', data: buffer, mimeType }, options);
}

/**
 * Transcribe audio from a URL
 * 
 * Convenience function for URL input.
 */
export async function transcribeUrl(
  url: string,
  options?: TranscriptionOptions
): Promise<TranscriptionResult> {
  return transcribe({ type: 'url', url }, options);
}
