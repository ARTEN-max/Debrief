import type { User } from '@prisma/client';
import { db } from '../lib/db.js';

// ============================================
// Service Functions
// ============================================

/**
 * Create a new user
 */
export async function createUser(email: string): Promise<User> {
  return db.user.create({
    data: { email },
  });
}

/**
 * Get user by ID
 */
export async function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({
    where: { id },
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({
    where: { email },
  });
}

/**
 * Get or create user by email (useful for auth flows)
 */
export async function getOrCreateUser(email: string): Promise<User> {
  const existing = await getUserByEmail(email);
  if (existing) return existing;

  return createUser(email);
}

/**
 * Delete user and all associated data
 */
export async function deleteUser(id: string): Promise<void> {
  await db.user.delete({
    where: { id },
  });
}
