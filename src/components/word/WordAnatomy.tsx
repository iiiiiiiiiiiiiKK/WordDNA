import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WordPart, MorphemeType } from '@/types/domain';
import { getWords } from '@/data';
import { classNames } from '@/lib/utils';

interface WordAnatomyProps {
  word: string;
  parts: WordPart[];
}

const TYPE_LABEL: Record<MorphemeType, string> = {
  prefix: '前缀',
  root: '词根',
  suffix: '后缀',
};

/** 实心色块：与 MorphemeChip 保持同一套三色语言 */
const CHUNK_COLOR: Record<MorphemeType, string> = {
  prefix: 'bg-accent-2 text-white',
  root: 'bg-accent text-onaccent',
  suffix: 'bg-ink text-paper',
};

/**
 * 方案 D：交互式单词解剖
 * 单词本身就是交互对象——每个词素是一个可点击分块，
 * 点击后高亮该块、其余淡出，并展示类型 / 含义 / 同词素相关词，可返回完整单词。
 */
export function WordAnatomy({ word, parts }: WordAnatomyProps) {
  const [active, setActive] = useState<number | null>(null);

  // 与当前选中词素同形同类的其它单词（“点击 BELIEVE 展开相关词汇”）
  const related = useMemo(() => {
    if (active === null) return [];
    const target = parts[active];
    if (!target) return [];
    const t = target.text.toLowerCase();
    const seen = new Set<string>();
    const out: { id: string; word: string; cn: string }[] = [];
    for (const w of getWords()) {
      if (w.word.toLowerCase() === word.toLowerCase()) continue;
      const hit = w.parts.some(
        (p) => p.type === target.type && p.text.toLowerCase() === t,
      );
      if (!hit || seen.has(w.word)) continue;
      seen.add(w.word);
      out.push({ id: w.id, word: w.word, cn: w.meanings[0]?.cn ?? '' });
      if (out.length >= 6) break;
    }
    return out;
  }, [active, parts, word]);

  const activePart = active === null ? null : parts[active];

  return (
    <div>
      {/* 解剖台：每个词素一个可点击分块 */}
      <div className="flex flex-wrap items-stretch gap-2">
        {parts.map((p, i) => {
          const isActive = active === i;
          const dimmed = active !== null && !isActive;
          return (
            <button
              key={`${p.text}-${i}`}
              onClick={() => setActive(isActive ? null : i)}
              aria-pressed={isActive}
              className={classNames(
                'anatomy-chunk flex flex-col items-center px-3 py-2 sm:px-5 sm:py-3',
                CHUNK_COLOR[p.type],
                dimmed && 'anatomy-dim',
              )}
            >
              <span className="word-huge text-[clamp(1.5rem,7vw,2.6rem)]">{p.text}</span>
              <span className="mt-1 h-[3px] w-full bg-current opacity-70" />
              <span className="mt-1 text-[11px] font-medium tracking-widest">
                {TYPE_LABEL[p.type]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 提示 / 返回完整单词 */}
      <div className="mt-3 flex items-center gap-3">
        {active === null ? (
          <span className="tag-edit">TAP A CHUNK TO INSPECT →</span>
        ) : (
          <button
            onClick={() => setActive(null)}
            className="tag-edit border-b-2 border-ink text-ink hover:text-accent-2"
          >
            ← 返回完整单词
          </button>
        )}
      </div>

      {/* 选中词素详情：含义 + 相关词 */}
      {activePart && (
        <div className="mt-3 border-t-2 border-ink pt-3">
          <div className="flex items-baseline gap-2">
            <span className="tag-edit">{TYPE_LABEL[activePart.type].toUpperCase()}</span>
            {activePart.isInferred && (
              <span className="tag-edit text-warn">INFERRED ⚠</span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-black tracking-tight text-text">
              {activePart.text}
            </span>
            <span className="text-sm text-muted">
              {activePart.meaning || '（该词素暂无中文释义）'}
            </span>
          </div>

          {related.length > 0 ? (
            <>
              <div className="tag-edit mt-3">RELATED WORDS · {related.length}</div>
              <ul className="mt-1 border-t border-ink">
                {related.map((r) => (
                  <li key={r.id} className="border-b border-border/50">
                    <Link
                      to={`/word/${r.id}`}
                      className="flex items-baseline gap-3 py-2 hover:bg-accent/20"
                    >
                      <span className="font-display text-sm font-bold tracking-tight text-text">
                        {r.word}
                      </span>
                      <span className="text-xs text-muted">{r.cn}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted">
              暂无其它内置单词使用该{TYPE_LABEL[activePart.type]}。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
