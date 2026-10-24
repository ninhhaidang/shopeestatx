import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import { build as esbuild } from 'esbuild';
import { bridgeBuildOptions } from './bridge-build';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  root: 'src',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      // Radix ships "use client" directives that mean nothing in an extension bundle.
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      input: {
        // Dashboard (main results page)
        results: resolve(__dirname, 'src/dashboard/results.html'),
        // Popup
        popup: resolve(__dirname, 'src/popup/popup.html'),
        // Privacy policy (stays at the dist root: privacy.html)
        privacy: resolve(__dirname, 'src/privacy.html'),
        // Welcome/onboarding page
        welcome: resolve(__dirname, 'src/welcome/welcome.html'),
        // Background service worker
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep background.js at root level for manifest references
          if (chunkInfo.name === 'background') return 'background.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Disable minification for easier debugging during development
    minify: false,
  },
  plugins: [
    tailwindcss(),
    {
      // Copy static assets (manifest, icons, content.js) to dist after build
      name: 'copy-extension-files',
      async closeBundle() {
        const distDir = resolve(__dirname, 'dist');

        // Bridge script (ISOLATED world), built separately as a standalone IIFE
        await esbuild({ ...bridgeBuildOptions, outfile: resolve(distDir, 'bridge.js') });

        // Copy manifest.json
        const manifest = JSON.parse(readFileSync(resolve(__dirname, 'src/manifest.json'), 'utf-8'));
        writeFileSync(resolve(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

        // Copy content.js (IIFE, MAIN world)
        copyFileSync(resolve(__dirname, 'src/content/content.js'), resolve(distDir, 'content.js'));

        // Copy icons
        const iconsDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
        for (const size of ['16', '48', '128']) {
          copyFileSync(
            resolve(__dirname, 'src/icons/icon' + size + '.png'),
            resolve(iconsDir, 'icon' + size + '.png')
          );
        }
      },
    },
  ],
});
