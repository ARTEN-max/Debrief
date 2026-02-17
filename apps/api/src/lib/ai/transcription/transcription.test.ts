import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MockTranscriptionProvider,
  mockProvider,
  transcribe,
  transcribeBuffer,
  transcribeUrl,
  getTranscriptionProvider,
  resetProvider,
  createProvider,
  isProviderAvailable,
  type TranscriptionInput,
} from './index.js';

describe('TranscriptionProvider Interface', () => {
  describe('MockTranscriptionProvider', () => {
    let provider: MockTranscriptionProvider;

    beforeEach(() => {
      provider = new MockTranscriptionProvider();
      provider.reset();
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('mock');
    });

    it('should always be configured', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should transcribe buffer input', async () => {
      const input: TranscriptionInput = {
        type: 'buffer',
        data: Buffer.from('test audio'),
        mimeType: 'audio/mpeg',
      };

      const result = await provider.transcribe(input);

      expect(result.text).toBe('This is a mock transcription result.');
      expect(result.segments).toHaveLength(2);
      expect(result.language).toBe('en');
      expect(result.duration).toBe(4);
      expect(result.metadata?.inputType).toBe('buffer');
    });

    it('should transcribe URL input', async () => {
      const input: TranscriptionInput = {
        type: 'url',
        url: 'https://example.com/audio.mp3',
      };

      const result = await provider.transcribe(input);

      expect(result.text).toBe('This is a mock transcription result.');
      expect(result.metadata?.inputType).toBe('url');
    });

    it('should use provided language option', async () => {
      const input: TranscriptionInput = {
        type: 'buffer',
        data: Buffer.from('test'),
        mimeType: 'audio/mpeg',
      };

      const result = await provider.transcribe(input, { language: 'es' });

      expect(result.language).toBe('es');
    });

    it('should track calls', async () => {
      const input: TranscriptionInput = {
        type: 'buffer',
        data: Buffer.from('test'),
        mimeType: 'audio/mpeg',
      };

      await provider.transcribe(input);
      await provider.transcribe(input, { language: 'fr' });

      expect(provider.getCallCount()).toBe(2);
      expect(provider.getLastCall()?.options?.language).toBe('fr');
    });

    it('should simulate failure when configured', async () => {
      provider.setFailure('Custom error message');

      const input: TranscriptionInput = {
        type: 'buffer',
        data: Buffer.from('test'),
        mimeType: 'audio/mpeg',
      };

      await expect(provider.transcribe(input)).rejects.toThrow('Custom error message');
    });

    it('should allow custom mock text', async () => {
      provider.setMockText('Custom transcription');

      const input: TranscriptionInput = {
        type: 'buffer',
        data: Buffer.from('test'),
        mimeType: 'audio/mpeg',
      };

      const result = await provider.transcribe(input);

      expect(result.text).toBe('Custom transcription');
    });

    it('should simulate delay', async () => {
      provider.setDelay(100);

      const input: TranscriptionInput = {
        type: 'buffer',
        data: Buffer.from('test'),
        mimeType: 'audio/mpeg',
      };

      const start = Date.now();
      await provider.transcribe(input);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Factory Functions', () => {
    beforeEach(() => {
      resetProvider();
      mockProvider.reset();
      // Set env to use mock provider
      vi.stubEnv('TRANSCRIPTION_PROVIDER', 'mock');
    });

    it('should return mock provider when configured', () => {
      const provider = getTranscriptionProvider();
      expect(provider.name).toBe('mock');
    });

    it('should cache the provider', () => {
      const provider1 = getTranscriptionProvider();
      const provider2 = getTranscriptionProvider();
      expect(provider1).toBe(provider2);
    });

    it('should create specific provider', () => {
      const provider = createProvider('mock');
      expect(provider.name).toBe('mock');
    });

    it('should throw for unknown provider', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => createProvider('unknown' as any)).toThrow('Unknown provider');
    });

    it('should check provider availability', () => {
      expect(isProviderAvailable('mock')).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(() => {
      resetProvider();
      mockProvider.reset();
      vi.stubEnv('TRANSCRIPTION_PROVIDER', 'mock');
    });

    it('should transcribe with transcribe()', async () => {
      const result = await transcribe({
        type: 'buffer',
        data: Buffer.from('test'),
        mimeType: 'audio/mpeg',
      });

      expect(result.text).toBeDefined();
      expect(mockProvider.getCallCount()).toBe(1);
    });

    it('should transcribe with transcribeBuffer()', async () => {
      const result = await transcribeBuffer(
        Buffer.from('test'),
        'audio/mpeg',
        { language: 'en' }
      );

      expect(result.text).toBeDefined();
      expect(mockProvider.getLastCall()?.input.type).toBe('buffer');
    });

    it('should transcribe with transcribeUrl()', async () => {
      const result = await transcribeUrl('https://example.com/audio.mp3');

      expect(result.text).toBeDefined();
      expect(mockProvider.getLastCall()?.input.type).toBe('url');
    });
  });
});

describe('Provider Implementations', () => {
  describe('DeepgramProvider', () => {
    it('should not be configured without API key', () => {
      vi.stubEnv('DEEPGRAM_API_KEY', '');
      const provider = createProvider('deepgram');
      expect(provider.isConfigured()).toBe(false);
    });

    it('should be configured with API key', () => {
      vi.stubEnv('DEEPGRAM_API_KEY', 'test-key');
      const provider = createProvider('deepgram');
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('OpenAIWhisperProvider', () => {
    it('should not be configured without API key', () => {
      vi.stubEnv('OPENAI_API_KEY', '');
      const provider = createProvider('openai');
      expect(provider.isConfigured()).toBe(false);
    });

    it('should be configured with API key', () => {
      vi.stubEnv('OPENAI_API_KEY', 'test-key');
      const provider = createProvider('openai');
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('WhisperLocalProvider', () => {
    it('should not be configured without model path', () => {
      vi.stubEnv('WHISPER_MODEL_PATH', '');
      const provider = createProvider('whisper-local');
      expect(provider.isConfigured()).toBe(false);
    });

    it('should throw when transcribing (not implemented)', async () => {
      const provider = createProvider('whisper-local');

      await expect(
        provider.transcribe({
          type: 'buffer',
          data: Buffer.from('test'),
          mimeType: 'audio/mpeg',
        })
      ).rejects.toThrow('not yet implemented');
    });
  });
});
