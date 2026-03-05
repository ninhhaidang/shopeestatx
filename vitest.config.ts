import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/dashboard/utils.ts', 'src/dashboard/filters.ts', 'src/dashboard/comparison.ts', 'src/content/content.js'],
    },
  },
});
