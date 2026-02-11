import type {
  TranscriptionProvider,
  TranscriptionInput,
  TranscriptionOptions,
  TranscriptionResult,
} from './types.js';

/**
 * Local Whisper Transcription Provider (Stub)
 * 
 * This is a stub for running Whisper locally using whisper.cpp or similar.
 * Useful for development without API costs or for on-premise deployments.
 * 
 * To implement:
 * 1. Install whisper.cpp or use a Node.js binding
 * 2. Download a Whisper model (tiny, base, small, medium, large)
 * 3. Implement the transcribe method to call the local binary
 * 
 * Example implementations:
 * - whisper.cpp: https://github.com/ggerganov/whisper.cpp
 * - whisper-node: https://github.com/arielnlee/Whisper-WebGPU
 * 
 * @see https://github.com/ggerganov/whisper.cpp
 */
export class WhisperLocalProvider implements TranscriptionProvider {
  readonly name = 'whisper-local';

  isConfigured(): boolean {
    // Check if the model file exists
    // In a real implementation, you'd check if whisper binary and model are available
    return !!process.env.WHISPER_MODEL_PATH;
  }

  async transcribe(
    _input: TranscriptionInput,
    _options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    // Stub implementation - throw with helpful message
    throw new Error(
      `WhisperLocalProvider is not yet implemented.\n\n` +
      `To use local Whisper transcription:\n` +
      `1. Install whisper.cpp: https://github.com/ggerganov/whisper.cpp\n` +
      `2. Download a model and set WHISPER_MODEL_PATH\n` +
      `3. Implement this provider or use a different provider\n\n` +
      `For now, use TRANSCRIPTION_PROVIDER=deepgram or TRANSCRIPTION_PROVIDER=openai`
    );

    // When implemented, the flow would be:
    // 1. Save buffer to temp file (if input is buffer)
    // 2. Call whisper binary with the audio file
    // 3. Parse the JSON output
    // 4. Return TranscriptionResult

    /*
    // Example implementation sketch:
    const tempFile = await this.saveToTemp(input);
    try {
      const result = await this.runWhisper(tempFile, options);
      return this.parseResult(result);
    } finally {
      await fs.unlink(tempFile);
    }
    */
  }

  // Placeholder methods for future implementation
  // @ts-expect-error - Placeholder for future implementation
  private async saveToTemp(_input: TranscriptionInput): Promise<string> {
    // Save audio to temp file and return path
    throw new Error('Not implemented');
  }

  // @ts-expect-error - Placeholder for future implementation
  private async runWhisper(_audioPath: string, _options: TranscriptionOptions): Promise<string> {
    // Run whisper binary and return JSON output
    // Example: whisper -m model.bin -f audio.wav -oj
    throw new Error('Not implemented');
  }

  // @ts-expect-error - Placeholder for future implementation
  private parseResult(_json: string): TranscriptionResult {
    // Parse whisper.cpp JSON output format
    throw new Error('Not implemented');
  }
}
