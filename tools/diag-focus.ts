import { getRoots, getWordById, getWords, getFamilyWords } from '@/data';

const deck = [...getRoots()].sort((a, b) => b.words.length - a.words.length);
console.log('deck size', deck.length, '| words', getWords().length);
console.log('sample word ids:', getWords().slice(0, 3).map((w) => w.id).join(', '));

const targets = ['unequal', 'unreal', 'bilingual', 'astral'];
for (const t of targets) {
  const w = getWords().find((x) => x.word === t);
  if (!w) {
    console.log(`${t}: NOT IN DATASET`);
    continue;
  }
  const own = w.rootIds.map((rid) => {
    const at = deck.findIndex((r) => r.id === rid);
    return `${rid}${at >= 0 ? '@' + at : '(invalid)'}`;
  });
  const owner = getRoots().find((r) => r.words.includes(w.id));
  const ownerAt = owner ? deck.findIndex((r) => r.id === owner.id) : -1;
  console.log(`${t} (${w.id}): rootIds=[${own.join(', ')}] → owner=${owner ? owner.root + '@' + ownerAt : 'NONE'}`);
}

console.log('--- deck head ---');
deck.slice(0, 8).forEach((r, i) => console.log(`#${i} ${r.root} (${r.id}) family=${r.words.length}`));
console.log('un family:', getFamilyWords('r-un').map((w) => w.word).join(', '));
