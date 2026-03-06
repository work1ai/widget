import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.types.ts', 'src/index.ts'],
      reporter: ['text', 'text-summary'],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
});
