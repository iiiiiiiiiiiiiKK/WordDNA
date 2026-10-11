import { getRoots, getWords, getMorphemes, getRootById, getWordById } from '@/data';

const roots = getRoots();
const words = getWords();
const morphs = getMorphemes();

const rootIds = new Set(roots.map((r) => r.id));
const morphIds = new Set(morphs.map((m) => m.id));
const wordIds = new Set(words.map((w) => w.id));

console.log('=== 数据集规模 ===');
console.log('roots:', roots.length, '| words:', words.length, '| morphemes:', morphs.length);

// 1) 单词引用了不存在的词根（孤儿 rootId，bundled 数据层）
const wordOrphans: { word: string; rootId: string }[] = [];
for (const w of words) {
  for (const rid of w.rootIds) if (!rootIds.has(rid)) wordOrphans.push({ word: w.word, rootId: rid });
}
console.log('\n=== 单词引用不存在的词根 (bundled) ===');
console.log('count:', wordOrphans.length);
const orphanRootIdSet = new Set(wordOrphans.map((x) => x.rootId));
console.log('distinct orphan rootId:', orphanRootIdSet.size);
if (wordOrphans.length) console.log('样例:', wordOrphans.slice(0, 10));

// 2) 单词引用的 prefix/suffix id 是否存在
const wordAffixOrphans: { word: string; affixId: string }[] = [];
for (const w of words) {
  for (const aid of [...w.prefixIds, ...w.suffixIds]) if (!morphIds.has(aid)) wordAffixOrphans.push({ word: w.word, affixId: aid });
}
console.log('\n=== 单词引用不存在的词缀 (bundled) ===');
console.log('count:', wordAffixOrphans.length);
const orphanAffixSet = new Set(wordAffixOrphans.map((x) => x.affixId));
console.log('distinct orphan affixId:', orphanAffixSet.size);
if (wordAffixOrphans.length) console.log('样例:', wordAffixOrphans.slice(0, 10));

// 3) 词根.words 里引用的单词 id 是否存在
const rootWordOrphans: { root: string; wordId: string }[] = [];
for (const r of roots) {
  for (const wid of r.words) if (!wordIds.has(wid)) rootWordOrphans.push({ root: r.root, wordId: wid });
}
console.log('\n=== 词根.words 引用不存在的单词 (bundled) ===');
console.log('count:', rootWordOrphans.length);
if (rootWordOrphans.length) console.log('样例:', rootWordOrphans.slice(0, 10));

// 4) 词缀（prefix/suffix）真实性粗检：空释义、与其他词缀重复 text+meaning
const affixes = morphs.filter((m) => m.type !== 'root');
const emptyAffix = affixes.filter((m) => !m.meaning || !m.meaning.trim());
console.log('\n=== 词缀真实性粗检 ===');
console.log('affix total:', affixes.length, '| empty meaning:', emptyAffix.length);
if (emptyAffix.length) console.log('空释义样例:', emptyAffix.slice(0, 10).map((m) => m.id));
const seen = new Map<string, number>();
for (const m of affixes) {
  const k = m.text.toLowerCase() + '|' + (m.meaning ?? '').trim().toLowerCase();
  seen.set(k, (seen.get(k) ?? 0) + 1);
}
const dupAffix = [...seen.entries()].filter(([, n]) => n > 1);
console.log('重复 (text+meaning) 词缀组:', dupAffix.length);
if (dupAffix.length) console.log('重复样例:', dupAffix.slice(0, 10));

// 5) 词根里 text 完全相同（疑似重复词根，如 r-pose 旧 bug）
const rootTexts = new Map<string, number>();
for (const r of roots) rootTexts.set(r.root.toLowerCase(), (rootTexts.get(r.root.toLowerCase()) ?? 0) + 1);
const dupRoot = [...rootTexts.entries()].filter(([, n]) => n > 1);
console.log('\n=== 重复词根 text ===');
console.log('重复组:', dupRoot.length);
if (dupRoot.length) console.log('重复样例:', dupRoot.slice(0, 10));

console.log('\n=== 小结 ===');
console.log('bundled 孤儿引用总数:', wordOrphans.length + wordAffixOrphans.length + rootWordOrphans.length);
console.log('（注：运行时 SRS/mistakes 里引用已被删除词根的 itemId 属用户数据，不在本审计范围，由 UI 层 valid.has 过滤）');
