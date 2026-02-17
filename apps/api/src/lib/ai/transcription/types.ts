/**
 * Transcription Provider Types
 * 
 * This module defines the interface for transcription providers.
 * Providers can transcribe audio from a Buffer or URL.
 */

// ============================================
// Core Types
// ============================================

/**
 * A segment of transcribed audio with timing information
 */
export interface TranscriptSegment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Transcribed text for this segment */
  text: string;
  /** Speaker identifier (if diarization is enabled) */
  speaker?: string;
  /** Confidence score (0-1) */
  confidence?: number;
}

/**
 * Result from a transcription operation
 */
export interface TranscriptionResult {
  /** Full transcribed text */
  text: string;
  /** Segments with timing information (optional) */
  segments?: TranscriptSegment[];
  /** Detected language code (e.g., 'en', 'es') */
  language: string;
  /** Audio duration in seconds */
  duration?: number;
  /** Provider-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options for transcription
 */
export interface TranscriptionOptions {
  /** Expected language (helps accuracy) */
  language?: string;
  /** Enable speaker diarization */
  diarize?: boolean;
  /** Enable punctuation */
  punctuate?: boolean;
  /** Model to use (provider-specific) */
  model?: string;
}

/**
 * Input for transcription - either a Buffer or URL
 */
export type TranscriptionInput = 
  | { type: 'buffer'; data: Buffer; mimeType: string }
  | { type: 'url'; url: string; mimeType?: string };

// ============================================
// Provider Interface
// ============================================

/**
 * Interface for transcription providers
 * 
 * Implementations should handle both buffer and URL inputs.
 */
export interface TranscriptionProvider {
  /** Provider name for logging/debugging */
  readonly name: string;

  /**
   * Transcribe audio from a buffer or URL
   * 
   * @param input - Audio input (buffer or URL)
   * @param options - Transcription options
   * @returns Transcription result
   */
  transcribe(
    input: TranscriptionInput,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult>;

  /**
   * Check if the provider is properly configured
   * 
   * @returns true if API keys and config are valid
   */
  isConfigured(): boolean;
}

// ============================================
// Provider Configuration
// ============================================

export type ProviderName = 'deepgram' | 'openai' | 'whisper-local' | 'mock';

export interface ProviderConfig {
  /** Which provider to use */
  provider: ProviderName;
  /** Provider-specific options */
  options?: Record<string, unknown>;
}
