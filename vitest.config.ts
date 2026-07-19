import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'test/empty.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    globals: true,
  },
});
