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
