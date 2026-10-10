import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const entry = `
import { getRoots, getWords } from './src/data/index.ts';
const roots = getRoots();
const rids = roots.map(r => r.id);
const rdup = rids.filter((id,i)=> rids.indexOf(id)!==i);
console.log('roots total='+roots.length+' unique='+new Set(rids).size+' dupIds='+JSON.stringify([...new Set(rdup)]));
const rlabels = roots.map(r=>r.root);
const rldup = rlabels.filter((l,i)=> rlabels.indexOf(l)!==i);
console.log('root labels dup='+JSON.stringify([...new Set(rldup)]));
const words = getWords();
const wids = words.map(w=>w.id);
const wdup = wids.filter((id,i)=> wids.indexOf(id)!==i);
console.log('words total='+words.length+' unique='+new Set(wids).size+' dupIds='+JSON.stringify([...new Set(wdup)].slice(0,20)));
`;

const tmp = path.join(root, 'scripts', '_check_tmp.mjs');
await build({
  stdin: { contents: entry, resolveDir: root, loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: tmp,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'silent',
});
await import('file://' + tmp);
