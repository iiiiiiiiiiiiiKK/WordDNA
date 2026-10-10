import { Link } from 'react-router-dom';
import type { Root, Word } from '@/types/domain';
import { Card } from '@/components/common/Card';
import { Chip } from '@/components/common/Chip';
import { getFamilyWords } from '@/data';

interface RootCardProps {
  root: Root;
  className?: string;
}

/** 音标统一成 /…/ 形式，读起来更像词典 */
function fmtPhonetic(p?: string): string {
  const t = (p ?? '').trim();
  if (!t) return '';
  return t.startsWith('/') || t.endsWith('/') ? t : `/${t}/`;
}

/** 词素拆解：un+real */
function morphemeChain(w: Word): string {
  if (!w.parts || w.parts.length === 0) return '';
  return w.parts.map((p) => p.text).join('+');
}

/** 拆解里最关键的那个语素的含义（通常就是词根本身） */
function morphemeGloss(w: Word): string {
  if (!w.parts || w.parts.length === 0) return '';
  return (w.parts.find((p) => p.type === 'root') ?? w.parts[w.parts.length - 1]).meaning ?? '';
}

/**
 * 词根卡片：左边 1/4 是词根本体，右边 3/4 原本是大片空白，
 * 现在用来直接铺开整个家族词——一行一个：
 *   unreal /ʌn'riːəl/ 不真实 · un+real 真实的
 * 家族词多就自动缩小字号并可上下滚动；家族词少就把字号放大一档，版面不会被撑爆。
 */
export function RootCard({ root, className }: RootCardProps) {
  const words = getFamilyWords(root.id);

  // 字号自适应：词越少字越大（12 个词也不至于挤成一团）
  const size =
    words.length <= 4
      ? { row: 'text-sm', word: 'text-[15px]', meta: 'text-[12px]' }
      : words.length <= 8
        ? { row: 'text-[13px]', word: 'text-sm', meta: 'text-[11px]' }
        : { row: 'text-xs', word: 'text-[13px]', meta: 'text-[11px]' };
  const scroll = words.length > 8;

  return (
    <Card className={['h-full', className].filter(Boolean).join(' ')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {/* 左栏：词根本体 */}
        <Link
          to={`/roots/${root.id}`}
          className="shrink-0 sm:w-40 sm:border-r sm:border-border/50 sm:pr-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-2xl font-black tracking-tight text-text break-safe">
              {root.root}
            </span>
            <Chip color="muted">{root.language}</Chip>
          </div>
          <p className="mt-1 text-sm text-text break-safe">{root.meaning}</p>
          <div className="mt-1 text-[11px] text-muted">{words.length} 个家族词</div>
        </Link>

        {/* 右栏：家族词（填满空白区，不用再点进去才知道这个词根带出哪些词） */}
        {words.length > 0 && (
          <div className="min-w-0 flex-1">
            {/* 长单词（如 anthropomorphism）会把行撑出卡片——这里不给它溢出，
                而是让整个家族词区域左右可滚：横向 overflow-x-auto，词多时纵向也可滚。 */}
            <div
              className={
                'pr-1 ' + (scroll ? 'max-h-44 overflow-auto' : 'overflow-x-auto')
              }
            >
              <ol className="space-y-0.5">
                {words.map((w, i) => {
                  const chain = morphemeChain(w);
                  const gloss = morphemeGloss(w);
                  const full = `${w.word} ${fmtPhonetic(w.phonetic)} ${w.meanings[0]?.cn ?? ''}${chain ? ` · ${chain} ${gloss}` : ''}`;
                  return (
                    <li key={w.id}>
                      <Link
                        to={`/word/${w.id}`}
                        title={full}
                        className={
                          // whitespace-nowrap + 容器横向滚动：长单词宁可让你横向滑一下，
                          // 也不会把卡片右侧顶破（之前是 truncate 但词本身 shrink-0，仍然溢出）
                          'flex w-max min-w-full items-baseline gap-1.5 whitespace-nowrap border-b border-border/30 py-[2px] transition-colors hover:bg-accent/20 ' +
                          size.row
                        }
                      >
                        <span className="w-5 shrink-0 font-mono text-[9px] text-muted">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className={'shrink-0 font-display font-bold tracking-tight text-text ' + size.word}>
                          {w.word}
                        </span>
                        {w.phonetic && (
                          <span className="shrink-0 font-mono text-accent-2">{fmtPhonetic(w.phonetic)}</span>
                        )}
                        <span className="text-text">{w.meanings[0]?.cn ?? ''}</span>
                        {chain && (
                          <span className={'ml-auto text-muted ' + size.meta}>
                            {chain}
                            {gloss ? ` ${gloss}` : ''}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
