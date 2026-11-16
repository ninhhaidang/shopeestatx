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
        'src/dashboard/**/*.ts',
        'src/content/content.js',
        'src/ui/**/*.{ts,tsx}',
        'src/popup/**/*.{ts,tsx}',
        'src/dashboard-app/**/*.{ts,tsx}',
        'src/welcome/**/*.{ts,tsx}',
        'src/privacy/**/*.{ts,tsx}',
      ],
      // Entry glue that only runs inside Chrome (or on the demo page).
      exclude: ['src/*/main.tsx', 'src/*/chrome-host.ts', 'src/dashboard-app/mock-host.ts', 'src/dashboard/mock-data.ts'],
    },
  },
});
