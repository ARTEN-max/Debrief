import type { ChatSession, ChatMessage, ChatMessageRole } from '@prisma/client';
import { db } from '../lib/db.js';

// ============================================
// Types
// ============================================

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

/** Normalize to UTC start-of-day for session date */
export function toSessionDate(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00.000Z') : new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

// ============================================
// Service
// ============================================

/**
 * Get or create a chat session for the user for the given day.
 */
export async function getOrCreateChatSession(
  userId: string,
  date: string | Date
): Promise<ChatSession> {
  const sessionDate = toSessionDate(date);
  const existing = await db.chatSession.findUnique({
    where: {
      userId_sessionDate: { userId, sessionDate },
    },
  });
  if (existing) return existing;
  return db.chatSession.create({
    data: {
      userId,
      sessionDate,
      recordingId: null,
    },
  });
}

/**
 * Get or create a chat session for the user scoped to a specific recording.
 */
export async function getOrCreateRecordingChatSession(
  userId: string,
  recordingId: string
): Promise<ChatSession> {
  const existing = await db.chatSession.findUnique({
    where: {
      userId_recordingId: { userId, recordingId },
    },
  });
  if (existing) return existing;
  return db.chatSession.create({
    data: {
      userId,
      recordingId,
      sessionDate: null,
    },
  });
}

/**
 * Add a message to a chat session.
 */
export async function addChatMessage(
  sessionId: string,
  role: ChatMessageRole,
  content: string
): Promise<ChatMessage> {
  return db.chatMessage.create({
    data: { sessionId, role, content },
  });
}

/**
 * Get a chat session with messages ordered by createdAt.
 */
export async function getChatSessionWithMessages(
  sessionId: string,
  userId: string
): Promise<ChatSessionWithMessages | null> {
  const session = await db.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  return session;
}

/**
 * Get session for user+date with messages (for loading thread).
 */
export async function getChatSessionByUserAndDate(
  userId: string,
  date: string | Date
): Promise<ChatSessionWithMessages | null> {
  const sessionDate = toSessionDate(date);
  const session = await db.chatSession.findUnique({
    where: {
      userId_sessionDate: { userId, sessionDate },
    },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  return session;
}

/**
 * Get session for user+recording with messages (for recording-scoped chat).
 */
export async function getChatSessionByRecording(
  userId: string,
  recordingId: string
): Promise<ChatSessionWithMessages | null> {
  const session = await db.chatSession.findUnique({
    where: {
      userId_recordingId: { userId, recordingId },
    },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  return session;
}
