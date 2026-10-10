import 'fake-indexeddb/auto';

// 最小化 localStorage polyfill（Node 环境无 localStorage）
const _ls = new Map();
globalThis.localStorage = {
  get length(){ return _ls.size; },
  key(i){ return [..._ls.keys()][i] ?? null; },
  getItem(k){ return _ls.has(k) ? _ls.get(k) : null; },
  setItem(k,v){ _ls.set(k,String(v)); },
  removeItem(k){ _ls.delete(k); },
};

const DB_NAME = 'worddna';
const DB_VERSION = 1;
const STORE_NAMES = ['learningState','favorites','mistakes','settings','dailyLogs','meta'];
const LS_PREFIX = 'wd:';

function lsKey(store, key){ return `${LS_PREFIX}${store}:${key}`; }
function lsGetAll(store){
  const out=[]; const prefix=`${LS_PREFIX}${store}:`;
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.startsWith(prefix)){try{out.push(JSON.parse(localStorage.getItem(k)));}catch{}}}
  return out;
}
function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;for(const n of STORE_NAMES){if(!db.objectStoreNames.contains(n))db.createObjectStore(n,{keyPath:n==='settings'||n==='meta'?'key':'id'});}};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
function idbRequest(fn){return openDB().then(db=>new Promise((res,rej)=>{const r=fn(db);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));}
async function put(store,key,value){
  const idbKey = store==='settings'||store==='meta'?'app':key;
  const record = (typeof value==='object'&&value!==null)?{...(value),id:idbKey}:value;
  // 注入 id 后不再传显式 key，由内联 keyPath 派生（避免 keyPath 存储 + 显式 key 冲突）
  await idbRequest(d=>d.transaction(store,'readwrite').objectStore(store).put(record));
}
async function getAll(store){
  const fromIdb = await idbRequest(d=>d.transaction(store,'readonly').objectStore(store).getAll());
  const fromLs = lsGetAll(store);
  if(fromLs.length===0) return fromIdb;
  const seen=new Set(fromIdb.map(r=>String(r?.id??r?.itemId??r?.date??'')));
  const merged=[...fromIdb];
  for(const rec of fromLs){const k=String(rec?.id??rec?.itemId??rec?.date??''); if(!seen.has(k)){seen.add(k);merged.push(rec);}}
  return merged;
}

// 1) Fresh write + refresh
const rec={itemId:'w-123',type:'word',status:'learning',due:'2026-10-11'};
await put('learningState','w-123',rec);
let all=await getAll('learningState');
console.log('TEST1 after put -> count', all.length, 'itemId', all[0]&&all[0].itemId);

// 2) Simulate orphan: pre-fix era wrote only to localStorage (put threw -> fallback)
localStorage.setItem(lsKey('learningState','w-orphan'), JSON.stringify({itemId:'w-orphan',type:'word',status:'learning'}));
all=await getAll('learningState');
console.log('TEST2 with orphan in LS -> count', all.length, 'ids', all.map(a=>a.itemId).sort());

// 3) mistakes + dailyLogs use different key field
await put('mistakes','m-9',{itemId:'m-9',type:'word',wrongCount:1});
await put('dailyLogs','2026-10-10',{date:'2026-10-10',total:5});
const m=await getAll('mistakes'); const dl=await getAll('dailyLogs');
console.log('TEST3 mistakes', m.length, m[0]&&m[0].itemId, '| dailyLogs', dl.length, dl[0]&&dl[0].date);

// 4) favorites already had id field -> still works
await put('favorites','f-1',{id:'f-1',kind:'word',refId:'w-x'});
const f=await getAll('favorites');
console.log('TEST4 favorites', f.length, f[0]&&f[0].id);
console.log('ALL TESTS PASSED');
