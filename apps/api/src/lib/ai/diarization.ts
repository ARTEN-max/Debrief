import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

// ============================================
// Types
// ============================================

export interface SpeakerSegment {
  start: number;
  end: number;
  speaker: string;
  text?: string;
}

export interface DiarizationResult {
  speakers: string[];
  segments: SpeakerSegment[];
  num_speakers: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

// ============================================
// Configuration
// ============================================

const DIARIZATION_SERVICE_URL = process.env.DIARIZATION_SERVICE_URL || 'http://localhost:8001';

// ============================================
// Main Diarization Function
// ============================================

/**
 * Perform speaker diarization on an audio file
 * @param audioPath Local path to audio file
 * @param transcriptSegments Optional transcript segments with timestamps
 * @param userEmbedding Optional user voice embedding for personalized labeling
 * @returns Diarization result with speaker labels
 */
export async function diarizeAudio(
  audioPath: string,
  transcriptSegments?: TranscriptSegment[],
  userEmbedding?: number[]
): Promise<DiarizationResult> {
  console.log(`🎤 Starting diarization for: ${audioPath}`);
  console.log(`📊 Transcript segments: ${transcriptSegments?.length || 0}`);
  console.log(`👤 User embedding provided: ${userEmbedding ? 'yes' : 'no'}`);

  // Check if diarization service is available
  try {
    const healthCheck = await fetch(`${DIARIZATION_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });

    if (!healthCheck.ok) {
      throw new Error('Diarization service not healthy');
    }
  } catch {
    console.warn('⚠️  Diarization service not available, skipping diarization');
    // Return single speaker fallback
    return createFallbackResult(transcriptSegments);
  }

  // Create form data
  const form = new FormData();

  // Add audio file
  form.append('audio', fs.createReadStream(audioPath));

  // Add transcript segments if provided
  if (transcriptSegments && transcriptSegments.length > 0) {
    form.append('segments', JSON.stringify(transcriptSegments));
  }

  // Add user embedding if provided
  if (userEmbedding && userEmbedding.length === 512) {
    form.append('user_embedding', JSON.stringify(userEmbedding));
  }

  try {
    // Call diarization service
    const response = await fetch(`${DIARIZATION_SERVICE_URL}/diarize`, {
      method: 'POST',
      body: form as any,
      headers: form.getHeaders(),
      timeout: 300000, // 5 minutes timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Diarization service error: ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as DiarizationResult;
    console.log(`✅ Diarization complete: ${result.num_speakers} speakers detected`);

    return result;
  } catch (error) {
    console.error('❌ Diarization failed:', error);
    // Return fallback result
    return createFallbackResult(transcriptSegments);
  }
}

/**
 * Create fallback result with single speaker
 */
function createFallbackResult(transcriptSegments?: TranscriptSegment[]): DiarizationResult {
  const segments: SpeakerSegment[] = transcriptSegments
    ? transcriptSegments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        speaker: 'speaker_0',
        text: seg.text,
      }))
    : [];

  return {
    speakers: ['speaker_0'],
    segments,
    num_speakers: 1,
  };
}

/**
 * Merge diarization results with transcript segments
 */
export function mergeDiarizationWithTranscript(
  transcriptSegments: TranscriptSegment[],
  diarizationSegments: SpeakerSegment[]
): SpeakerSegment[] {
  // Match transcript segments with diarization speakers
  const merged: SpeakerSegment[] = [];

  for (let i = 0; i < transcriptSegments.length; i++) {
    const tSeg = transcriptSegments[i];
    const dSeg = diarizationSegments[i] || { speaker: 'speaker_0' };

    merged.push({
      start: tSeg.start,
      end: tSeg.end,
      text: tSeg.text,
      speaker: dSeg.speaker,
    });
  }

  return merged;
}
