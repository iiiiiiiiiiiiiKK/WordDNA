// 重新生成 src/data/ecdictMini.json：取词频前 15000 的常用词，
// 输出为 Record<word, { tr: string; ph: string }> —— 同时保留翻译与音标。
// 数据源：data_sources/ecdict.csv (skywind3000/ECDICT)
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('data_sources/ecdict.csv');
const OUT = path.resolve('src/data/ecdictMini.json');
const PH_OUT = path.resolve('src/data/cigenPhonetics.json');
const CIGEN = path.resolve('src/data/cigen.json');
const TOP = 15000;

const text = fs.readFileSync(SRC, 'utf8');
const n = text.length;

// 标准 CSV 解析（支持双引号内逗号/换行）
function* records() {
  let i = 0;
  let field = '';
  let rec = [];
  let inQ = false;
  let started = false;
  while (i < n) {
    const c = text[i];
    if (!started) {
      // 跳过文件开头的 BOM / 空白
      if (c === '\uFEFF' || c === ' ' || c === '\r') { i++; continue; }
      started = true;
    }
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { rec.push(field); field = ''; i++; continue; }
    if (c === '\n') { rec.push(field); yield rec; rec = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (rec.length || field) { rec.push(field); yield rec; }
}

const rows = records();
const header = rows.next().value;
// 列：word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio
const COL = {};
header.forEach((h, idx) => (COL[h.trim()] = idx));

const items = [];
const phByWord = new Map(); // 全量音标索引（覆盖所有词，不受词频上限影响）
for (const r of rows) {
  const word = (r[COL.word] || '').trim().toLowerCase();
  if (!word) continue;
  const ph = (r[COL.phonetic] || '').trim();
  const tr = (r[COL.translation] || '').trim();
  if (ph) phByWord.set(word, ph);
  if (!tr && !ph) continue;
  const frq = parseInt(r[COL.frq] || '0', 10) || 0;
  const bnc = parseInt(r[COL.bnc] || '0', 10) || 0;
  // 排序键：frq 越小越常用；frq=0 用 bnc 兜底；都为 0 排末尾
  const sortKey = frq > 0 ? frq : (bnc > 0 ? 500000 + bnc : 1000000);
  items.push({ word, ph, tr, sortKey });
}

items.sort((a, b) => a.sortKey - b.sortKey);
const top = items.slice(0, TOP);

const map = {};
for (const it of top) map[it.word] = { tr: it.tr, ph: it.ph };
fs.writeFileSync(OUT, JSON.stringify(map));
console.log('total rows parsed:', items.length);
console.log('written ecdictMini top:', top.length, 'bytes:', fs.statSync(OUT).size);

// cigen 内置词音标：用全量索引补齐，确保内置词 100% 有音标（不受 15000 上限影响）
const cigen = JSON.parse(fs.readFileSync(CIGEN, 'utf8'));
const cigenWords = new Set();
for (const e of cigen.entries) if (e.word) cigenWords.add(e.word.toLowerCase());
const cigenPh = {};
let covered = 0;
for (const w of cigenWords) {
  const ph = phByWord.get(w);
  if (ph) { cigenPh[w] = ph; covered++; }
}
fs.writeFileSync(PH_OUT, JSON.stringify(cigenPh));
console.log(`cigen phonetic coverage: ${covered}/${cigenWords.size} = ${((covered / cigenWords.size) * 100).toFixed(1)}%`);
console.log('sample:', JSON.stringify(map['transport']), JSON.stringify(map['unreal']));
