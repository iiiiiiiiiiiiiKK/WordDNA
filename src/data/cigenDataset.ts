// ============================================================
// 融合数据集（来源：cigen 真实词根词缀表 + 自研词缀词典）
// cigen/data/roots_affixes.json：275 个词根 + 953 个单词条目
// 每个条目含中文释义 + 拆解 components[]（词素 + 提示）。
// 本文件把真实数据映射为 WordDNA 领域模型，并导出统一的
// ROOTS_FUSED / WORDS_FUSED / MORPHEMES_FUSED 与索引。
// ============================================================
import rawData from './cigen.json';
import { getEcdictPhonetic } from './ecdict';
import cigenPhonetics from './cigenPhonetics.json';
import examBooks from './examBooks.json';
import vocabExamples from './vocabExamples.json';
import type {
  Root,
  Word,
  WordPart,
  Morpheme,
  MorphemeType,
  Reliability,
  ExamLevel,
} from '@/types/domain';

interface CigenComponent {
  morpheme: string;
  hint: string;
}
interface CigenEntry {
  id: string;
  word: string;
  meaning: string;
  decomposition: string;
  page: number;
  components: CigenComponent[];
}
interface CigenRoot {
  root: string;
  gloss: string;
  wordCount: number;
  sampleWords: string[];
}

const data = rawData as unknown as { roots: CigenRoot[]; entries: CigenEntry[] };

// ---------- 自研高频词缀词典（中文释义） ----------
const PREFIX_MEANINGS: Record<string, string> = {
  a: '无；非',
  ab: '离开；相反',
  ad: '朝向；附近',
  anti: '反对；抗',
  auto: '自己；自动',
  be: '使…；加强',
  bi: '二；双',
  co: '共同',
  com: '共同；一起',
  con: '共同；一起',
  col: '共同；一起',
  cor: '共同；一起',
  contra: '反对；相反',
  counter: '反对；相反',
  de: '向下；去除；离开',
  di: '二；双',
  dis: '分开；否定',
  dys: '坏；不良',
  e: '出；向外',
  ex: '出；向外；前任',
  em: '使…；进入',
  en: '使…；进入',
  epi: '在…上；旁',
  eu: '好；优',
  fore: '前；预先',
  hyper: '超过；过度',
  hypo: '在下；不足',
  il: '不；向内',
  im: '不；向内',
  in: '不；向内',
  ir: '不；向内',
  inter: '在…之间',
  intra: '在内',
  intro: '向内',
  iso: '相等；同',
  macro: '大；宏观',
  mal: '坏；不良',
  micro: '小；微观',
  mid: '中间',
  mis: '错误；坏',
  mono: '单；一',
  multi: '多',
  non: '不；非',
  ob: '逆；反；向前',
  oc: '逆；反；向前',
  of: '逆；反；向前',
  op: '逆；反；向前',
  out: '超过；向外',
  over: '过度；在上',
  para: '旁；类似；错误',
  per: '完全；贯穿',
  peri: '周围',
  poly: '多',
  post: '后；之后',
  pre: '前；预先',
  pro: '前；赞成；向前',
  re: '再；回',
  retro: '向后',
  semi: '半',
  sub: '在下；次；亚',
  suc: '在下；次；亚',
  suf: '在下；次；亚',
  sup: '在下；次；亚',
  sur: '在下；次；亚',
  super: '上；超过',
  syn: '共同；一起',
  sym: '共同；一起',
  tele: '远',
  trans: '横过；转移',
  ultra: '超；极端',
  un: '不；非',
  under: '不足；在下',
  uni: '一；单',
  vice: '副；代替',
  with: '向后；反对',
};

const SUFFIX_MEANINGS: Record<string, string> = {
  able: '能…的',
  ible: '能…的',
  al: '…的；具有…性质的',
  ance: '性质；状态',
  ence: '性质；状态',
  ant: '…的人；…的',
  ent: '…的人；…的',
  ar: '…的',
  ary: '与…有关的',
  ate: '使；做',
  dom: '领域；状态',
  ee: '受事者',
  eer: '从事…的人',
  er: '做…的人/物',
  or: '做…的人/物',
  esque: '似…的',
  ful: '充满…的',
  hood: '状态；身份',
  ic: '…的；与…有关',
  ice: '性质；状态',
  ics: '…学',
  ile: '能…的',
  ine: '具有…性质的',
  ion: '动作；状态',
  ish: '有点…的',
  ism: '主义；学说',
  ist: '…主义者；人',
  ity: '性质；状态',
  ive: '有…倾向的',
  ize: '使…化',
  ise: '使…化',
  less: '无…的',
  let: '小',
  like: '像…的',
  logy: '…学',
  ology: '…学',
  ly: '…地',
  ment: '结果；状态',
  ness: '性质；状态',
  ation: '动作；状态（名词化）',
  ition: '动作；状态（名词化）',
  ous: '充满…的；有…特征的',
  ship: '状态；身份',
  some: '充满…的',
  th: '状态；过程',
  tion: '动作；状态',
  sion: '动作；状态',
  ty: '性质；状态',
  ward: '向…方向',
  y: '具有…特征的；小',
  graphy: '…写法；…记录术',
  gram: '写；记录；图（记录物）',
  ography: '…志；…学',
  metric: '测量；度量',
};

// ---------- 高频拉丁/希腊词根释义（补全 frow 词根的中文，供拆词/学习页解说） ----------
const ROOT_MEANINGS: Record<string, string> = {
  ag: '做；驱动',
  act: '做；行动',
  am: '爱',
  anim: '生命；灵魂',
  ann: '年',
  enn: '年',
  anthrop: '人',
  aqu: '水',
  arch: '统治；首要',
  art: '技艺；技巧',
  aud: '听',
  audit: '听',
  bell: '战争',
  bio: '生命',
  brev: '短',
  cap: '拿；取；抓',
  capt: '拿；取',
  cept: '拿；取',
  car: '肉',
  carn: '肉',
  card: '心',
  cord: '心',
  caus: '原因；烧',
  ced: '走；去',
  ceed: '走；去',
  cess: '走；去',
  cent: '百',
  chron: '时间',
  cid: '切；杀',
  cis: '切；杀',
  circ: '圆；环',
  claim: '喊叫',
  clam: '喊叫',
  clar: '清楚；明亮',
  clin: '倾斜；弯曲',
  clud: '关闭',
  clus: '关闭',
  cogn: '知道；认知',
  corp: '身体',
  cosm: '宇宙；秩序',
  cred: '相信；信任',
  cult: '耕种；崇拜',
  cur: '跑',
  curs: '跑',
  dem: '人民',
  dent: '牙齿',
  derm: '皮肤',
  dict: '说；言',
  doc: '教；引导',
  doct: '教',
  dom: '统治；家',
  don: '给',
  donat: '给',
  dub: '双；怀疑',
  duc: '引导；领导',
  duct: '引导',
  dyn: '力量',
  dynam: '力量',
  eco: '家；经济',
  equ: '平等；马',
  err: '漫游；错',
  fac: '做',
  fact: '做',
  fect: '做',
  fer: '带来；承载',
  fid: '信任；信仰',
  fin: '结束；边界',
  flect: '弯曲',
  flex: '弯曲',
  flor: '花',
  flour: '花',
  flu: '流动',
  fluc: '流动',
  form: '形状；形式',
  fort: '强；幸运',
  frag: '破；碎',
  fract: '破；碎',
  fus: '倒；注；融化',
  gen: '产生；种类',
  geo: '地；地球',
  grad: '走；步',
  gred: '走；步',
  gress: '走；步',
  gram: '写；记录',
  graph: '写；画',
  grat: '感激；高兴',
  grav: '重',
  greg: '群；集合',
  heli: '太阳',
  her: '粘；附着',
  hes: '粘；附着',
  hetero: '异；不同',
  homo: '同；相同',
  hor: '时间；小时',
  hum: '地；土；人',
  hydr: '水',
  ject: '投掷；抛',
  join: '连接；结合',
  junct: '连接',
  jud: '判断',
  jur: '法律；发誓',
  lect: '读；选',
  leg: '读；说；法律',
  lig: '绑；束',
  lev: '轻；升',
  liber: '自由',
  lingu: '语言',
  liter: '文字；字母',
  loc: '地方；位置',
  log: '说话；学问',
  logue: '说话',
  lud: '玩；戏',
  lus: '玩；戏',
  lum: '光',
  lumin: '光',
  mag: '大',
  maj: '大',
  max: '大；最大',
  man: '手',
  mar: '海',
  matr: '母',
  mater: '母',
  med: '中；医疗',
  medi: '中',
  mem: '记忆',
  mnem: '记忆',
  ment: '心智；思考',
  merc: '商；贸易',
  metr: '测量',
  meter: '测量',
  migr: '移动；迁移',
  min: '小',
  mis: '送；放',
  miss: '送',
  mit: '送；发',
  mob: '动',
  mot: '动',
  mov: '动',
  morph: '形；形态',
  mort: '死',
  mut: '变；交换',
  nat: '出生；生',
  nasc: '出生',
  nav: '船',
  naut: '船；航海',
  nec: '死；否定',
  neg: '否定',
  neur: '神经',
  noct: '夜',
  nom: '名；法则',
  nym: '名',
  nov: '新',
  numer: '数',
  od: '气味',
  odour: '气味',
  onym: '名',
  opt: '选择；眼',
  ophthalm: '眼',
  orb: '圆；环',
  ord: '顺序；命令',
  orn: '装饰',
  pater: '父',
  patr: '父',
  path: '感受；疾病',
  ped: '脚；儿童',
  pel: '推；逐',
  puls: '推',
  pend: '挂；称；付',
  pens: '挂；称；付',
  pet: '追求；寻求',
  petit: '追求',
  phil: '爱',
  phon: '声音',
  phot: '光',
  phos: '光',
  phys: '自然；身体',
  plac: '平静；取悦',
  plic: '折叠；编',
  ple: '满；折叠',
  plex: '折叠',
  pneum: '肺；气',
  pod: '脚',
  polis: '城市',
  polit: '城市；公民',
  pon: '放；置',
  pos: '放；置',
  port: '拿；运；港',
  pot: '能；力',
  prim: '第一；首要',
  psych: '心灵；精神',
  pur: '纯；清',
  pyr: '火',
  quer: '问；寻',
  quest: '问；寻',
  rad: '刮；辐射',
  ras: '刮',
  rap: '夺；取',
  rav: '夺；取',
  reg: '直；统治；规则',
  rect: '直；统治',
  rid: '笑',
  ris: '笑',
  rod: '咬；腐蚀',
  ros: '咬；腐蚀',
  rupt: '破；裂',
  sacr: '圣；献',
  sanct: '圣',
  sal: '跳；健康',
  sil: '跳',
  sault: '跳',
  salut: '健康',
  salv: '健康；救',
  san: '健康',
  scend: '爬；升',
  scal: '爬；梯',
  sci: '知；知識',
  scrib: '写',
  script: '写',
  sect: '切；割',
  sec: '切；割',
  sed: '坐',
  sess: '坐',
  sen: '老',
  sent: '感觉',
  sens: '感觉',
  sequ: '跟；随',
  secu: '跟；随',
  sert: '插；加入',
  serv: '保；守；服务',
  sid: '坐',
  sign: '记号；信号',
  simil: '相似',
  simul: '相似',
  sist: '站；立',
  soci: '同伴；社会',
  sol: '太阳',
  solu: '松；解',
  somn: '睡',
  son: '声；音',
  soph: '智慧',
  spec: '看；观',
  spic: '看；观',
  sper: '希望',
  spur: '希望',
  sph: '球',
  spin: '刺；脊',
  spir: '呼吸；精神',
  splend: '发光',
  spons: '承诺',
  spond: '承诺',
  st: '站；立',
  stab: '站；立',
  stat: '站；立；状',
  stell: '星',
  ster: '立体',
  stereo: '立体',
  sting: '刺',
  stinct: '刺；区分',
  struct: '建；构',
  suad: '劝',
  suas: '劝',
  sum: '拿；取',
  tang: '触；碰',
  tact: '触；碰',
  techn: '技艺；技术',
  temper: '混合；调节',
  tempor: '时间',
  ten: '握；持；伸',
  tend: '伸；趋向',
  tent: '握；伸',
  termin: '结束；边界',
  terr: '地；土',
  test: '证； witness',
  text: '织；编',
  the: '神',
  theo: '神',
  therm: '热',
  tim: '怕；胆怯',
  tome: '切；卷',
  tom: '切',
  ton: '音；调',
  tor: '扭；转',
  tort: '扭；转',
  tox: '毒',
  tract: '拉；引',
  trit: '磨',
  trop: '转；向',
  tru: '信；实',
  thru: '信；实',
  turb: '乱；扰',
  ultim: '最后',
  umbr: '影；荫',
  urb: '城',
  us: '用',
  ut: '用',
  vac: '空',
  van: '空',
  vad: '走；去',
  vas: '走；去',
  val: '强；值',
  vail: '强；值',
  ven: '来',
  vent: '来',
  verb: '词；言',
  vers: '转；变',
  vert: '转；变',
  vi: '生命',
  vit: '生命',
  viv: '生命',
  vic: '胜',
  vin: '胜',
  vid: '看',
  vis: '看',
  vinc: '胜',
  vict: '胜',
  voc: '声；叫',
  vok: '声；叫',
  vol: '意愿；飞',
  volv: '滚；转',
  volut: '滚；转',
  vuln: '伤',
  zo: '动物',
  scope: '看；观察',
  phob: '恐惧',
  lith: '石',
  nephr: '肾',
  osteo: '骨',
  cephal: '头',
  derma: '皮肤',
  gastr: '胃',
  hepat: '肝',
  cardi: '心',
  phone: '声音',
  photo: '光',
  thesis: '论文；命题；放置',
  pathy: '感情；疾病',
  phan: '显示；显现',
  liev: '相信；减轻',
  tain: '握；保持',
  norm: '规则；标准',
  solv: '松；解',
  fess: '说；承认',
  forc: '强；力量',
};

const PREFIX_WORDS = Object.keys(PREFIX_MEANINGS);
const SUFFIX_WORDS = Object.keys(SUFFIX_MEANINGS);

// ---------- 构建索引 ----------
const ROOT_SET = new Set(data.roots.map((r) => r.root.toLowerCase()));
const ROOT_GLOSS = new Map<string, string>(data.roots.map((r) => [r.root.toLowerCase(), r.gloss]));

function classify(morpheme: string): { type: MorphemeType; meaning: string } {
  const m = morpheme.toLowerCase();
  if (PREFIX_WORDS.includes(m)) return { type: 'prefix', meaning: PREFIX_MEANINGS[m] };
  if (SUFFIX_WORDS.includes(m)) return { type: 'suffix', meaning: SUFFIX_MEANINGS[m] };
  if (ROOT_SET.has(m)) return { type: 'root', meaning: ROOT_GLOSS.get(m) ?? ROOT_MEANINGS[m] ?? '' };
  // 词根型前缀（cigen 中以词根形式存放的前缀，如 ad/trans）：回退到前缀释义
  if (PREFIX_MEANINGS[m]) return { type: 'prefix', meaning: PREFIX_MEANINGS[m] };
  if (SUFFIX_MEANINGS[m]) return { type: 'suffix', meaning: SUFFIX_MEANINGS[m] };
  return { type: 'root', meaning: ROOT_MEANINGS[m] ?? '' };
}

// ---------- Word 融合 ----------
// 考试词书分类：spelling（小写）-> 考试等级标签（来自 examBooks.json）
const EXAM_LEVEL_BY_WORD = (() => {
  const map = new Map<string, ExamLevel[]>();
  const catToLevel: Record<string, ExamLevel> = {
    cet4: 'CET-4',
    cet6: 'CET-6',
    kaoyan: '考研',
    ielts: 'IELTS',
    toefl: 'TOEFL',
    gre: 'GRE',
  };
  const books = examBooks as Record<string, { name: string; words: string[] }>;
  for (const [cat, info] of Object.entries(books)) {
    const level = catToLevel[cat];
    if (!level) continue;
    for (const w of info.words) {
      const arr = map.get(w) ?? [];
      arr.push(level);
      map.set(w, arr);
    }
  }
  return map;
})();

const words: Word[] = [];
const wordById = new Map<string, Word>();
const wordByLower = new Map<string, Word>();

for (const e of data.entries) {
  const lowerWord = e.word.toLowerCase();
  if (!lowerWord || wordByLower.has(lowerWord)) continue;

  const parts: WordPart[] = [];
  const rootIds: string[] = [];
  const seenRoot = new Set<string>();

  for (const c of e.components) {
    if (!c.morpheme) continue;
    const { type, meaning } = classify(c.morpheme);
    const morphemeId = `${type === 'prefix' ? 'm' : type === 'suffix' ? 'm' : 'r'}-${c.morpheme.toLowerCase()}`;
    if (type === 'root') {
      const rid = morphemeId;
      if (!seenRoot.has(rid)) {
        rootIds.push(rid);
        seenRoot.add(rid);
      }
    }
    parts.push({
      text: c.morpheme,
      type,
      meaning: meaning || c.hint || '',
      morphemeId,
      reliability: 'etymological' as Reliability,
      isInferred: false,
    });
  }

  const w: Word = {
    id: `w-${lowerWord}`,
    word: e.word,
    phonetic: (cigenPhonetics as Record<string, string>)[lowerWord] ?? getEcdictPhonetic(e.word) ?? '',
    meanings: [{ pos: '', cn: e.meaning }],
    parts,
    etymParts: undefined,
    rootIds,
    prefixIds: parts.filter((p) => p.type === 'prefix').map((p) => p.morphemeId!).filter(Boolean),
    suffixIds: parts.filter((p) => p.type === 'suffix').map((p) => p.morphemeId!).filter(Boolean),
    etymology: e.decomposition,
    evolution: undefined,
    examples: (vocabExamples as Record<string, { en: string; cn: string }[]>)[lowerWord] ?? [],
    difficulty: 2,
    frequency: e.page ? e.page : 50,
    examLevels: EXAM_LEVEL_BY_WORD.get(lowerWord) ?? ['日常' as ExamLevel],
    mnemonic: undefined,
  };
  words.push(w);
  wordById.set(w.id, w);
  wordByLower.set(lowerWord, w);
}

// ---------- Root 融合 ----------
const rootWordMap = new Map<string, string[]>();
for (const w of words) {
  for (const rid of w.rootIds) {
    const arr = rootWordMap.get(rid) ?? [];
    arr.push(w.id);
    rootWordMap.set(rid, arr);
  }
}

const wordToId = new Map<string, string>();
for (const w of words) wordToId.set(w.word.toLowerCase(), w.id);

const roots: Root[] = data.roots.map((r) => {
  const id = `r-${r.root.toLowerCase()}`;
  const fromEntries = rootWordMap.get(id) ?? [];
  const fromSamples = r.sampleWords
    .map((sw) => wordToId.get(sw.toLowerCase()))
    .filter((x): x is string => Boolean(x));
  const all = Array.from(new Set([...fromEntries, ...fromSamples]));
  // 词根型前缀（如 ad/trans/com，cigen 中无中文释义）：回退到前缀/词根词典
  const fallback =
    PREFIX_MEANINGS[r.root.toLowerCase()] ||
    SUFFIX_MEANINGS[r.root.toLowerCase()] ||
    ROOT_MEANINGS[r.root.toLowerCase()] ||
    '';
  const meaning = r.gloss || fallback;
  const isPrefixType = !r.gloss;
  // description 只作为「记忆提示」补充：有 gloss 的词根若再写一遍 gloss 就会和
  // meaning 完全重复（页面出现两行一样的「掷 掷出」），因此有 gloss 时留空。
  const description = r.gloss
    ? ''
    : fallback
      ? `前缀「${r.root}」，${fallback}。常用于构成动词/形容词。`
      : '';
  return {
    id,
    root: r.root,
    meaning,
    language: isPrefixType ? '前缀' : '词源',
    etymology: isPrefixType && fallback ? `来自拉丁前缀「${r.root}」：${fallback}` : '',
    description,
    words: all,
  };
});
// 去重：cigen.json 源数据存在个别重复词根（如 pose），按 id 去重保留首个，
// 否则 Roots / 词根页会出现两张相同卡片。
{
  const seen = new Set<string>();
  const deduped: Root[] = [];
  for (const r of roots) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    deduped.push(r);
  }
  roots.length = 0;
  roots.push(...deduped);
}

// ---------- Morpheme 融合 ----------
const morphemes: Morpheme[] = [];
for (const m of PREFIX_WORDS) {
  morphemes.push({ id: `m-${m}`, text: m, type: 'prefix', meaning: PREFIX_MEANINGS[m], language: '', etymology: '' });
}
for (const m of SUFFIX_WORDS) {
  morphemes.push({ id: `m-${m}`, text: m, type: 'suffix', meaning: SUFFIX_MEANINGS[m], language: '', etymology: '' });
}
for (const r of data.roots) {
  const rk = r.root.toLowerCase();
  const fallback = PREFIX_MEANINGS[rk] || SUFFIX_MEANINGS[rk] || ROOT_MEANINGS[rk] || '';
  morphemes.push({
    id: `r-${rk}`,
    text: r.root,
    type: 'root',
    meaning: r.gloss || fallback,
    language: '',
    etymology: '',
  });
}

export const ROOTS_FUSED = roots;
export const WORDS_FUSED = words;
export const MORPHEMES_FUSED = morphemes;
export { ROOT_MEANINGS };

export const ROOT_BY_TEXT = new Map<string, Root>(roots.map((r) => [r.root.toLowerCase(), r]));
export { wordById as WORD_BY_ID, wordByLower as WORD_BY_LOWER };
