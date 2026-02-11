import type {
  TranscriptionProvider,
  TranscriptionInput,
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptSegment,
} from './types.js';

/**
 * Mock Transcription Provider
 * 
 * Used for testing and development without making API calls.
 * Returns predictable responses that can be configured.
 */
export class MockTranscriptionProvider implements TranscriptionProvider {
  readonly name = 'mock';

  // Configurable mock responses
  private mockText: string = 'This is a mock transcription result.';
  private mockSegments: TranscriptSegment[] = [
    { start: 0, end: 2, text: 'This is a mock', speaker: 'Speaker 1' },
    { start: 2, end: 4, text: 'transcription result.', speaker: 'Speaker 1' },
  ];
  private mockLanguage: string = 'en';
  private mockDuration: number = 4;
  private shouldFail: boolean = false;
  private failureMessage: string = 'Mock transcription failure';
  private delayMs: number = 0;

  // Track calls for testing
  public calls: Array<{
    input: TranscriptionInput;
    options?: TranscriptionOptions;
  }> = [];

  isConfigured(): boolean {
    return true; // Always configured
  }

  async transcribe(
    input: TranscriptionInput,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    // Record the call
    this.calls.push({ input, options });

    // Simulate processing delay
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    // Simulate failure if configured
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    return {
      text: this.mockText,
      segments: this.mockSegments,
      language: options.language || this.mockLanguage,
      duration: this.mockDuration,
      metadata: {
        provider: 'mock',
        inputType: input.type,
      },
    };
  }

  // ============================================
  // Configuration Methods for Testing
  // ============================================

  /**
   * Set the mock transcription text
   */
  setMockText(text: string): this {
    this.mockText = text;
    return this;
  }

  /**
   * Set mock segments
   */
  setMockSegments(segments: TranscriptSegment[]): this {
    this.mockSegments = segments;
    return this;
  }

  /**
   * Set mock language
   */
  setMockLanguage(language: string): this {
    this.mockLanguage = language;
    return this;
  }

  /**
   * Set mock duration
   */
  setMockDuration(duration: number): this {
    this.mockDuration = duration;
    return this;
  }

  /**
   * Configure the provider to fail on next call
   */
  setFailure(message: string = 'Mock transcription failure'): this {
    this.shouldFail = true;
    this.failureMessage = message;
    return this;
  }

  /**
   * Configure the provider to succeed
   */
  setSuccess(): this {
    this.shouldFail = false;
    return this;
  }

  /**
   * Set processing delay
   */
  setDelay(ms: number): this {
    this.delayMs = ms;
    return this;
  }

  /**
   * Reset to default state
   */
  reset(): this {
    this.mockText = 'This is a mock transcription result.';
    this.mockSegments = [
      { start: 0, end: 2, text: 'This is a mock', speaker: 'Speaker 1' },
      { start: 2, end: 4, text: 'transcription result.', speaker: 'Speaker 1' },
    ];
    this.mockLanguage = 'en';
    this.mockDuration = 4;
    this.shouldFail = false;
    this.failureMessage = 'Mock transcription failure';
    this.delayMs = 0;
    this.calls = [];
    return this;
  }

  /**
   * Get the number of times transcribe was called
   */
  getCallCount(): number {
    return this.calls.length;
  }

  /**
   * Get the last call arguments
   */
  getLastCall(): { input: TranscriptionInput; options?: TranscriptionOptions } | undefined {
    return this.calls[this.calls.length - 1];
  }
}

// Singleton mock instance for easy testing
export const mockProvider = new MockTranscriptionProvider();
