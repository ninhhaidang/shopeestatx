import { resolve } from 'path';
import type { BuildOptions } from 'esbuild';

// The bridge is injected with chrome.scripting.executeScript, which runs it as a
// classic script, so it must be a self-contained IIFE with no `import`.
export const bridgeBuildOptions: BuildOptions = {
  entryPoints: [resolve(__dirname, 'src/bridge/bridge.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
};

// The category fetcher is also injected as a classic script. Its result must be the script's last
// expression (a promise executeScript awaits), so the bundle's global is called once at the end.
export const categoryFetcherBuildOptions: BuildOptions = {
  entryPoints: [resolve(__dirname, 'src/content/category-fetcher.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  globalName: 'shopeeStatXCategoryFetcher',
  footer: { js: 'shopeeStatXCategoryFetcher.run(window.shopeeStatXCategoryRequest);' },
};
