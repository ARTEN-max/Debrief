import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupDatabase,
  createTestUser,
} from '../../__tests__/helpers/test-utils.js';
import { checkDbConnection, withTransaction } from '../db.js';
import { getTestDb } from '../../__tests__/helpers/test-utils.js';

describe('Database Utilities', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('checkDbConnection', () => {
    it('should return true when database is connected', async () => {
      const isConnected = await checkDbConnection();
      expect(isConnected).toBe(true);
    });
  });

  describe('withTransaction', () => {
    it('should execute function within transaction', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await withTransaction(async (tx) => {
        await tx.user.update({
          where: { id: user1.id },
          data: { email: 'updated1@test.com' },
        });
        await tx.user.update({
          where: { id: user2.id },
          data: { email: 'updated2@test.com' },
        });
      });

      const db = getTestDb();
      const updated1 = await db.user.findUnique({ where: { id: user1.id } });
      const updated2 = await db.user.findUnique({ where: { id: user2.id } });

      expect(updated1?.email).toBe('updated1@test.com');
      expect(updated2?.email).toBe('updated2@test.com');
    });
  });
});
