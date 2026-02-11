import { describe, it, expect } from 'vitest';
import {
  generateObjectKey,
  isAllowedMimeType,
  getExtensionFromMimeType,
} from '../storage.js';

describe('Storage Utilities', () => {
  describe('generateObjectKey', () => {
    it('should generate object key with correct format', () => {
      const key = generateObjectKey('user-123', 'rec-456', 'test.mp3');

      expect(key).toMatch(/^recordings\/user-123\/rec-456\/\d+-test\.mp3$/);
    });

    it('should sanitize filename', () => {
      const key = generateObjectKey('user-123', 'rec-456', 'test file (1).mp3');

      expect(key).not.toContain(' ');
      expect(key).not.toContain('(');
      expect(key).not.toContain(')');
    });
  });

  describe('isAllowedMimeType', () => {
    it('should return true for allowed MIME types', () => {
      expect(isAllowedMimeType('audio/mpeg')).toBe(true);
      expect(isAllowedMimeType('audio/wav')).toBe(true);
      expect(isAllowedMimeType('audio/webm')).toBe(true);
      expect(isAllowedMimeType('audio/ogg')).toBe(true);
      expect(isAllowedMimeType('audio/mp4')).toBe(true);
      expect(isAllowedMimeType('audio/m4a')).toBe(true);
      expect(isAllowedMimeType('audio/flac')).toBe(true);
    });

    it('should return false for disallowed MIME types', () => {
      expect(isAllowedMimeType('video/mp4')).toBe(false);
      expect(isAllowedMimeType('image/png')).toBe(false);
      expect(isAllowedMimeType('application/json')).toBe(false);
    });
  });

  describe('getExtensionFromMimeType', () => {
    it('should return correct extension for MIME types', () => {
      expect(getExtensionFromMimeType('audio/mpeg')).toBe('mp3');
      expect(getExtensionFromMimeType('audio/wav')).toBe('wav');
      expect(getExtensionFromMimeType('audio/webm')).toBe('webm');
      expect(getExtensionFromMimeType('audio/m4a')).toBe('m4a');
      expect(getExtensionFromMimeType('audio/x-m4a')).toBe('m4a');
    });

    it('should return default extension for unknown MIME types', () => {
      expect(getExtensionFromMimeType('audio/unknown')).toBe('audio');
    });
  });
});
