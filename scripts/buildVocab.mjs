// 整合 zhenghaoyang24/english-vocabulary：
//  - 从 tb_book / tb_voc_book / tb_vocabulary 提取考试词书分类（四级/考研/雅思/托福），输出 examBooks.json
//  - 从 tb_voc_examples 提取 cigen 内置词的例句，输出 vocabExamples.json
// 数据源：data_sources/vocab/*.json
import fs from 'fs';
import path from 'path';

const DIR = path.resolve('data_sources/vocab');
const OUT_BOOKS = path.resolve('src/data/examBooks.json');
const OUT_EXAMPLES = path.resolve('src/data/vocabExamples.json');

// 1) wordid -> spelling
const vocab = JSON.parse(fs.readFileSync(path.join(DIR, 'tb_vocabulary.json'), 'utf8'));
const spell = new Map();
for (const v of vocab) spell.set(v.wordid, String(v.spelling || '').toLowerCase());
console.log('vocab words:', vocab.length);

// 2) 词书 -> 考试分类
const books = JSON.parse(fs.readFileSync(path.join(DIR, 'tb_book.json'), 'utf8'));
function catOf(name) {
  const n = name.toLowerCase();
  if (n.includes('六级')) return 'cet6';
  if (n.includes('四级')) return 'cet4';
  if (n.includes('考研')) return 'kaoyan';
  if (n.includes('雅思')) return 'ielts';
  if (n.includes('托福')) return 'toefl';
  if (n.includes('gre')) return 'gre';
  return null;
}
const CAT_NAMES = {
  cet4: '四级 CET4',
  cet6: '六级 CET6',
  kaoyan: '考研 KAOYAN',
  ielts: '雅思 IELTS',
  toefl: '托福 TOEFL',
  gre: 'GRE',
};
const catBooks = {};
for (const b of books) {
  const c = catOf(b.bookname);
  if (!c) continue;
  (catBooks[c] ||= new Set()).add(b.bookid);
}
console.log('categories:', Object.fromEntries(Object.entries(catBooks).map(([k, v]) => [k, [...v]])));

// 3) word-book 关联 -> 每类的单词集合
const vb = JSON.parse(fs.readFileSync(path.join(DIR, 'tb_voc_book.json'), 'utf8'));
const catWords = {};
for (const c of Object.keys(catBooks)) catWords[c] = new Set();
for (const row of vb) {
  for (const c of Object.keys(catBooks)) {
    if (catBooks[c].has(row.bookid)) {
      const s = spell.get(row.wordid);
      if (s) catWords[c].add(s);
    }
  }
}

const examBooks = {};
for (const c of Object.keys(catBooks)) {
  examBooks[c] = { name: CAT_NAMES[c], words: [...catWords[c]].sort() };
}
fs.writeFileSync(OUT_BOOKS, JSON.stringify(examBooks));
console.log('examBooks written:', Object.fromEntries(Object.entries(examBooks).map(([k, v]) => [k, v.words.length])));

// 4) cigen 内置词例句
const cigen = JSON.parse(fs.readFileSync(path.resolve('src/data/cigen.json'), 'utf8'));
const cigenSpell = new Set(cigen.entries.map((e) => e.word.toLowerCase()).filter(Boolean));
const examples = JSON.parse(fs.readFileSync(path.join(DIR, 'tb_voc_examples.json'), 'utf8'));
const exByWord = {};
for (const ex of examples) {
  const s = spell.get(ex.wordid);
  if (!s || !cigenSpell.has(s)) continue;
  (exByWord[s] ||= []);
  if (exByWord[s].length < 2) exByWord[s].push({ en: ex.en || '', cn: ex.cn || '' });
}
fs.writeFileSync(OUT_EXAMPLES, JSON.stringify(exByWord));
console.log('vocabExamples written for', Object.keys(exByWord).length, 'cigen words');
