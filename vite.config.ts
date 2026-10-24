import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import { build as esbuild } from 'esbuild';
import { bridgeBuildOptions } from './bridge-build.ts';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';

// ESM config: __dirname does not exist here.
const projectRoot = import.meta.dirname;

export default defineConfig({
  root: 'src',
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      // Radix ships "use client" directives that mean nothing in an extension bundle.
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      input: {
        // Dashboard (opened in a tab; see ADR-0002)
        dashboard: resolve(projectRoot, 'src/dashboard-app/dashboard.html'),
        // Popup
        popup: resolve(projectRoot, 'src/popup/popup.html'),
        // Privacy policy (stays at the dist root: privacy.html)
        privacy: resolve(projectRoot, 'src/privacy.html'),
        // Welcome/onboarding page
        welcome: resolve(projectRoot, 'src/welcome/welcome.html'),
        // Background service worker
        background: resolve(projectRoot, 'src/background.ts'),
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
        const distDir = resolve(projectRoot, 'dist');

        // Bridge script (ISOLATED world), built separately as a standalone IIFE
        await esbuild({ ...bridgeBuildOptions, outfile: resolve(distDir, 'bridge.js') });

        // Copy manifest.json
        const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'src/manifest.json'), 'utf-8'));
        writeFileSync(resolve(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

        // Copy content.js (IIFE, MAIN world)
        copyFileSync(resolve(projectRoot, 'src/content/content.js'), resolve(distDir, 'content.js'));

        // Copy icons
        const iconsDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
        for (const size of ['16', '48', '128']) {
          copyFileSync(
            resolve(projectRoot, 'src/icons/icon' + size + '.png'),
            resolve(iconsDir, 'icon' + size + '.png')
          );
        }
      },
    },
  ],
});
