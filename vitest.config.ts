import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/dashboard/utils.ts',
        'src/dashboard/filters.ts',
        'src/dashboard/comparison.ts',
        'src/dashboard/range.ts',
        'src/dashboard/overview.ts',
        'src/dashboard/merge.ts',
        'src/content/content.js',
        'src/ui/**/*.{ts,tsx}',
        'src/popup/**/*.{ts,tsx}',
        'src/dashboard-app/**/*.{ts,tsx}',
      ],
      // Entry glue that only runs inside Chrome.
      exclude: [
        'src/popup/main.tsx',
        'src/popup/chrome-host.ts',
        'src/dashboard-app/main.tsx',
        'src/dashboard-app/chrome-host.ts',
        'src/dashboard-app/mock-host.ts',
      ],
    },
  },
});
