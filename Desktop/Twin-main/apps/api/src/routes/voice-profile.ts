import type { FastifyPluginAsync } from 'fastify';
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { db } from '../lib/db.js';

const DIARIZATION_SERVICE_URL = process.env.DIARIZATION_SERVICE_URL || 'http://localhost:8001';

// ============================================
// Routes
// ============================================

export const voiceProfileRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/voice-profile/enroll
  // Upload voice sample to create user's voice profile
  fastify.post('/api/voice-profile/enroll', async (request, reply) => {
    try {
      // Get user ID from header (same pattern as recordings routes)
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // Get uploaded file
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No audio file provided' });
      }

      // Save to temp file
      const tmpPath = path.join(os.tmpdir(), `voice-${userId}-${Date.now()}.wav`);
      const buffer = await data.toBuffer();
      fs.writeFileSync(tmpPath, buffer);

      try {
        // Check audio duration (should be 10-30 seconds)
        // For simplicity, we'll accept any duration >= 5 seconds
        // TODO: Add actual duration check if needed

        // Extract speaker embedding using diarization service
        console.log(`👤 Extracting voice embedding for user ${userId}`);

        const form = new FormData();
        form.append('audio', fs.createReadStream(tmpPath));
        // Don't send segments - we just want the whole file embedding

        const response = await fetch(`${DIARIZATION_SERVICE_URL}/enroll`, {
          method: 'POST',
          body: form as any,
          headers: form.getHeaders(),
          timeout: 300000, // 5 minute timeout (model loading can be slow on first run)
        });

        if (!response.ok) {
          throw new Error(`Diarization service error: ${response.status}`);
        }

        const result = (await response.json()) as { embedding: number[] };

        // Save embedding to database
        await db.user.update({
          where: { id: userId },
          data: {
            voiceEmbedding: result.embedding,
            hasVoiceProfile: true,
          },
        });

        console.log(`✅ Voice profile enrolled for user ${userId}`);

        return {
          success: true,
          message: 'Voice profile enrolled successfully',
          hasVoiceProfile: true,
        };
      } finally {
        // Clean up temp file
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }
      }
    } catch (error) {
      console.error('❌ Voice enrollment failed:', error);
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Voice enrollment failed',
      });
    }
  });

  // DELETE /api/voice-profile
  // Remove user's voice profile
  fastify.delete('/api/voice-profile', async (request, reply) => {
    const userId = request.headers['x-user-id'] as string;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    await db.user.update({
      where: { id: userId },
      data: {
        voiceEmbedding: undefined,
        hasVoiceProfile: false,
      },
    });

    return {
      success: true,
      message: 'Voice profile deleted successfully',
    };
  });

  // GET /api/voice-profile/status
  // Check if user has a voice profile
  fastify.get('/api/voice-profile/status', async (request, reply) => {
    const userId = request.headers['x-user-id'] as string;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { hasVoiceProfile: true },
    });

    return {
      hasVoiceProfile: user?.hasVoiceProfile || false,
    };
  });
};
