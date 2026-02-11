/**
 * Load environment variables from apps/api/.env as early as possible.
 *
 * Important: this module MUST be imported before any other app modules that
 * read process.env during module initialization.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// lib/ -> src/ -> apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

