import type { TranscriptionProvider, ProviderName } from './types.js';
import { DeepgramProvider } from './deepgram.provider.js';
import { OpenAIWhisperProvider } from './openai.provider.js';
import { WhisperLocalProvider } from './whisper-local.provider.js';
import { mockProvider } from './mock.provider.js';

// ============================================
// Provider Registry
// ============================================

const providers: Record<ProviderName, () => TranscriptionProvider> = {
  deepgram: () => new DeepgramProvider(),
  openai: () => new OpenAIWhisperProvider(),
  'whisper-local': () => new WhisperLocalProvider(),
  mock: () => mockProvider,
};

// ============================================
// Singleton Management
// ============================================

let currentProvider: TranscriptionProvider | null = null;
let currentProviderName: ProviderName | null = null;

/**
 * Get the configured transcription provider
 * 
 * Provider is selected via TRANSCRIPTION_PROVIDER env var:
 * - 'deepgram' (default, recommended for production)
 * - 'openai' (good fallback)
 * - 'whisper-local' (for on-premise, not yet implemented)
 * - 'mock' (for testing)
 */
export function getTranscriptionProvider(): TranscriptionProvider {
  const requestedProvider = (process.env.TRANSCRIPTION_PROVIDER || 'deepgram') as ProviderName;

  // Return cached provider if same type
  if (currentProvider && currentProviderName === requestedProvider) {
    return currentProvider;
  }

  // Validate provider name
  if (!providers[requestedProvider]) {
    throw new Error(
      `Unknown transcription provider: ${requestedProvider}. ` +
      `Valid options: ${Object.keys(providers).join(', ')}`
    );
  }

  // Create new provider
  const provider = providers[requestedProvider]();

  // Check if provider is configured (skip for mock)
  if (requestedProvider !== 'mock' && !provider.isConfigured()) {
    throw new Error(
      `Transcription provider '${requestedProvider}' is not configured. ` +
      `Please set the required environment variables.`
    );
  }

  // Cache and return
  currentProvider = provider;
  currentProviderName = requestedProvider;

  console.log(`✅ Using transcription provider: ${provider.name}`);

  return provider;
}

/**
 * Create a specific provider instance (useful for testing)
 */
export function createProvider(name: ProviderName): TranscriptionProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return factory();
}

/**
 * Reset the cached provider (useful for testing)
 */
export function resetProvider(): void {
  currentProvider = null;
  currentProviderName = null;
}

/**
 * Get the current provider name
 */
export function getCurrentProviderName(): ProviderName | null {
  return currentProviderName;
}

/**
 * Check if a provider is available and configured
 */
export function isProviderAvailable(name: ProviderName): boolean {
  try {
    const provider = createProvider(name);
    return provider.isConfigured();
  } catch {
    return false;
  }
}

/**
 * Get list of available (configured) providers
 */
export function getAvailableProviders(): ProviderName[] {
  return (Object.keys(providers) as ProviderName[]).filter(isProviderAvailable);
}
