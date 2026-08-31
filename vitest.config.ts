import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'drizzle'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**', 'db/**', 'features/**', 'lib/**'],
      exclude: ['**/*.test.ts', 'drizzle/**', 'e2e/**', '**/*.config.ts'],
    },
  },
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
