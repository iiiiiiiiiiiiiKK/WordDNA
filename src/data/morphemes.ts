// ============================================================
// 词素库：前缀 + 后缀（拆词引擎词典 + 词法展示）
// ARCHITECTURE.md T02
// ============================================================
import type { Morpheme } from '@/types/domain';

const PREFIXES: Morpheme[] = [
  { id: 'm-un', text: 'un', type: 'prefix', meaning: '不；相反', language: 'OE', variants: ['un'] },
  { id: 'm-re', text: 're', type: 'prefix', meaning: '再；回', language: 'L', variants: ['re'] },
  { id: 'm-in', text: 'in', type: 'prefix', meaning: '不；向内', language: 'L', variants: ['in', 'im', 'il', 'ir'] },
  { id: 'm-dis', text: 'dis', type: 'prefix', meaning: '不；分开', language: 'L', variants: ['dis'] },
  { id: 'm-pre', text: 'pre', type: 'prefix', meaning: '前', language: 'L', variants: ['pre'] },
  { id: 'm-pro', text: 'pro', type: 'prefix', meaning: '向前；支持', language: 'L', variants: ['pro'] },
  { id: 'm-sub', text: 'sub', type: 'prefix', meaning: '下；副', language: 'L', variants: ['sub', 'suc', 'suf', 'sup', 'sus'] },
  { id: 'm-super', text: 'super', type: 'prefix', meaning: '上；超过', language: 'L', variants: ['super', 'sur'] },
  { id: 'm-inter', text: 'inter', type: 'prefix', meaning: '在…之间', language: 'L', variants: ['inter'] },
  { id: 'm-trans', text: 'trans', type: 'prefix', meaning: '穿过；跨越', language: 'L', variants: ['trans'] },
  { id: 'm-ex', text: 'ex', type: 'prefix', meaning: '出；前', language: 'L', variants: ['ex', 'e'] },
  { id: 'm-de', text: 'de', type: 'prefix', meaning: '下；分离', language: 'L', variants: ['de'] },
  { id: 'm-con', text: 'con', type: 'prefix', meaning: '共同；加强', language: 'L', variants: ['con', 'com', 'co', 'col', 'cor'] },
  { id: 'm-anti', text: 'anti', type: 'prefix', meaning: '反对', language: 'G', variants: ['anti'] },
  { id: 'm-auto', text: 'auto', type: 'prefix', meaning: '自我；自动', language: 'G', variants: ['auto'] },
  { id: 'm-tele', text: 'tele', type: 'prefix', meaning: '远', language: 'G', variants: ['tele'] },
  { id: 'm-micro', text: 'micro', type: 'prefix', meaning: '小', language: 'G', variants: ['micro'] },
  { id: 'm-macro', text: 'macro', type: 'prefix', meaning: '大', language: 'G', variants: ['macro'] },
  { id: 'm-multi', text: 'multi', type: 'prefix', meaning: '多', language: 'L', variants: ['multi'] },
  { id: 'm-mono', text: 'mono', type: 'prefix', meaning: '单一', language: 'G', variants: ['mono'] },
  { id: 'm-bi', text: 'bi', type: 'prefix', meaning: '双', language: 'L', variants: ['bi'] },
  { id: 'm-tri', text: 'tri', type: 'prefix', meaning: '三', language: 'L', variants: ['tri'] },
  { id: 'm-extra', text: 'extra', type: 'prefix', meaning: '超出；额外', language: 'L', variants: ['extra'] },
  { id: 'm-over', text: 'over', type: 'prefix', meaning: '过度；在上', language: 'OE', variants: ['over'] },
  { id: 'm-under', text: 'under', type: 'prefix', meaning: '不足；在下', language: 'OE', variants: ['under'] },
  { id: 'm-mis', text: 'mis', type: 'prefix', meaning: '错误；坏', language: 'OE', variants: ['mis'] },
  { id: 'm-non', text: 'non', type: 'prefix', meaning: '非；无', language: 'L', variants: ['non'] },
  { id: 'm-semi', text: 'semi', type: 'prefix', meaning: '半', language: 'L', variants: ['semi'] },
  { id: 'm-counter', text: 'counter', type: 'prefix', meaning: '反对；对应', language: 'L', variants: ['counter'] },
  { id: 'm-fore', text: 'fore', type: 'prefix', meaning: '前；预先', language: 'OE', variants: ['fore'] },
  { id: 'm-post', text: 'post', type: 'prefix', meaning: '后', language: 'L', variants: ['post'] },
  { id: 'm-en', text: 'en', type: 'prefix', meaning: '使…；进入', language: 'OE', variants: ['en', 'em'] },
  { id: 'm-ob', text: 'ob', type: 'prefix', meaning: '反；对着', language: 'L', variants: ['ob', 'oc', 'of', 'op'] },
  { id: 'm-ab', text: 'ab', type: 'prefix', meaning: '离开；偏离', language: 'L', variants: ['ab', 'a', 'abs'] },
  { id: 'm-ad', text: 'ad', type: 'prefix', meaning: '朝向；附加', language: 'L', variants: ['ad', 'ag', 'ac', 'af', 'al', 'an', 'ap', 'ar', 'as', 'at'] },
  { id: 'm-per', text: 'per', type: 'prefix', meaning: '通过；彻底', language: 'L', variants: ['per'] },
  { id: 'm-sym', text: 'sym', type: 'prefix', meaning: '共同；一起', language: 'G', variants: ['sym', 'syn', 'syl'] },
  { id: 'm-be', text: 'be', type: 'prefix', meaning: '使…；加以', language: 'OE', variants: ['be'] },
  { id: 'm-with', text: 'with', type: 'prefix', meaning: '反对；回', language: 'OE', variants: ['with'] },
];

const SUFFIXES: Morpheme[] = [
  { id: 'm-able', text: 'able', type: 'suffix', meaning: '能…的', language: 'L', variants: ['able', 'ible'] },
  { id: 'm-ation', text: 'ation', type: 'suffix', meaning: '名词后缀（动作/结果）', language: 'L', variants: ['ation', 'tion', 'sion', 'ion'] },
  { id: 'm-ize', text: 'ize', type: 'suffix', meaning: '使…化（动词）', language: 'G', variants: ['ize', 'ise'] },
  { id: 'm-ify', text: 'ify', type: 'suffix', meaning: '使…化（动词）', language: 'L', variants: ['ify'] },
  { id: 'm-ous', text: 'ous', type: 'suffix', meaning: '…的（形容词）', language: 'L', variants: ['ous', 'ious', 'eous'] },
  { id: 'm-ful', text: 'ful', type: 'suffix', meaning: '充满…的', language: 'OE', variants: ['ful'] },
  { id: 'm-less', text: 'less', type: 'suffix', meaning: '无…的', language: 'OE', variants: ['less'] },
  { id: 'm-ment', text: 'ment', type: 'suffix', meaning: '名词后缀（状态/结果）', language: 'L', variants: ['ment'] },
  { id: 'm-ness', text: 'ness', type: 'suffix', meaning: '名词后缀（性质）', language: 'OE', variants: ['ness'] },
  { id: 'm-ity', text: 'ity', type: 'suffix', meaning: '名词后缀（性质）', language: 'L', variants: ['ity', 'ty'] },
  { id: 'm-al', text: 'al', type: 'suffix', meaning: '…的（形容词）', language: 'L', variants: ['al', 'ial', 'ual'] },
  { id: 'm-er', text: 'er', type: 'suffix', meaning: '做…的人/物', language: 'OE', variants: ['er', 'or', 'ar'] },
  { id: 'm-ist', text: 'ist', type: 'suffix', meaning: '…主义者/专家', language: 'G', variants: ['ist'] },
  { id: 'm-ism', text: 'ism', type: 'suffix', meaning: '…主义/学说', language: 'G', variants: ['ism'] },
  { id: 'm-ive', text: 'ive', type: 'suffix', meaning: '…的（形容词）', language: 'L', variants: ['ive'] },
  { id: 'm-ly', text: 'ly', type: 'suffix', meaning: '…地（副词）', language: 'OE', variants: ['ly'] },
  { id: 'm-ant', text: 'ant', type: 'suffix', meaning: '…的/人（形容词/名词）', language: 'L', variants: ['ant', 'ent'] },
  { id: 'm-ship', text: 'ship', type: 'suffix', meaning: '状态/身份', language: 'OE', variants: ['ship'] },
  { id: 'm-hood', text: 'hood', type: 'suffix', meaning: '状态/时期', language: 'OE', variants: ['hood'] },
  { id: 'm-en', text: 'en', type: 'suffix', meaning: '使…；小', language: 'OE', variants: ['en'] },
  { id: 'm-ic', text: 'ic', type: 'suffix', meaning: '…的（形容词）', language: 'G', variants: ['ic', 'ical'] },
  { id: 'm-ance', text: 'ance', type: 'suffix', meaning: '名词后缀（性质）', language: 'L', variants: ['ance', 'ence'] },
  { id: 'm-ary', text: 'ary', type: 'suffix', meaning: '…的/场所', language: 'L', variants: ['ary', 'ery'] },
  { id: 'm-an', text: 'an', type: 'suffix', meaning: '…的人', language: 'L', variants: ['an', 'ian', 'ean'] },
  { id: 'm-y', text: 'y', type: 'suffix', meaning: '…的（形容词）', language: 'OE', variants: ['y'] },
  { id: 'm-age', text: 'age', type: 'suffix', meaning: '名词后缀（集合/结果）', language: 'L', variants: ['age'] },
  { id: 'm-let', text: 'let', type: 'suffix', meaning: '小', language: 'L', variants: ['let'] },
  { id: 'm-ward', text: 'ward', type: 'suffix', meaning: '朝向', language: 'OE', variants: ['ward', 'wards'] },
];

export const MORPHEMES: Morpheme[] = [...PREFIXES, ...SUFFIXES];

export function getPrefixList(): Morpheme[] {
  return PREFIXES;
}
export function getSuffixList(): Morpheme[] {
  return SUFFIXES;
}
