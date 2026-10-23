// Every file passed to chrome.scripting.executeScript runs as a classic script in the
// tab's shared global. Verify the built copies parse that way (no import/export).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function* sourceFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* sourceFiles(path);
    else if (path.endsWith('.ts')) yield path;
  }
}

const injected = new Set();
for (const file of sourceFiles(join(root, 'src'))) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('executeScript')) continue;
  for (const call of source.matchAll(/files:\s*\[([^\]]*)\]/g)) {
    for (const name of call[1].matchAll(/['"]([^'"]+)['"]/g)) injected.add(name[1]);
  }
}

if (injected.size === 0) {
  console.error('No executeScript files found in src; the check pattern is out of date.');
  process.exit(1);
}

let failed = false;
for (const name of injected) {
  const code = readFileSync(join(root, 'dist', name), 'utf8');
  try {
    if (/^\s*(import|export)\b/m.test(code)) throw new Error('contains import/export');
    new Function(code);
    console.log(`ok  ${name}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
