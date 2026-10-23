// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { bridgeBuildOptions } from '../bridge-build';

describe('bridge build', () => {
  it('is a standalone script with no import/export, since executeScript runs it as a classic script', async () => {
    const { outputFiles } = await build({ ...bridgeBuildOptions, write: false, outfile: 'bridge.js' });
    const code = outputFiles[0].text;
    expect(code).not.toMatch(/^\s*(import|export)\b/m);
    expect(() => new Function(code)).not.toThrow();
  });
});
