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
        'src/content/content.js',
        'src/ui/**/*.{ts,tsx}',
        'src/popup/**/*.{ts,tsx}',
        'src/welcome/**/*.{ts,tsx}',
        'src/privacy/**/*.{ts,tsx}',
        'src/dashboard/share-image.ts',
      ],
      // Entry glue that only runs inside Chrome.
      exclude: ['src/*/main.tsx', 'src/*/chrome-host.ts'],
    },
  },
});
