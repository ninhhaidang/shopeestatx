import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  root: 'src',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Dashboard (main results page)
        results: resolve(__dirname, 'src/dashboard/results.html'),
        // Popup
        popup: resolve(__dirname, 'src/popup/popup.html'),
        // Welcome/onboarding page
        welcome: resolve(__dirname, 'src/welcome/welcome.html'),
        // Background service worker
        background: resolve(__dirname, 'src/background.ts'),
        // Bridge script (ISOLATED world)
        bridge: resolve(__dirname, 'src/bridge/bridge.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep background.js and bridge.js at root level for manifest references
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'bridge') return 'bridge.js';
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
    {
      // Copy static assets (manifest, icons, content.js, privacy.html) to dist after build
      name: 'copy-extension-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');

        // Copy manifest.json
        const manifest = JSON.parse(readFileSync(resolve(__dirname, 'src/manifest.json'), 'utf-8'));
        writeFileSync(resolve(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

        // Copy content.js (IIFE, MAIN world)
        copyFileSync(resolve(__dirname, 'src/content/content.js'), resolve(distDir, 'content.js'));

        // Copy privacy.html
        copyFileSync(resolve(__dirname, 'src/privacy.html'), resolve(distDir, 'privacy.html'));

        // Copy icons
        const iconsDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
        for (const size of ['16', '48', '128']) {
          copyFileSync(
            resolve(__dirname, 'ShopeeStatX/icons/icon' + size + '.png'),
            resolve(iconsDir, 'icon' + size + '.png')
          );
        }
      },
    },
  ],
});
