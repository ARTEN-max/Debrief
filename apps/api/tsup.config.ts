import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/worker.ts'],
  format: ['esm'],
  dts: false, // Disable DTS generation to avoid --incremental conflict with multiple entries
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: false,
  noExternal: [], // Don't bundle any node_modules (keep them external)
});
