import { buildSync } from 'esbuild';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = process.argv[2];
const out = join(mkdtempSync(join(tmpdir(), 'diag-')), 'out.cjs');
buildSync({
  entryPoints: [entry],
  bundle: true,
  outfile: out,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  alias: { '@': new URL('../src', import.meta.url).pathname },
  loader: { '.json': 'json' },
  logLevel: 'error',
});
writeFileSync(out + '.txt', out);
await import(pathToFileURL(out).href);
