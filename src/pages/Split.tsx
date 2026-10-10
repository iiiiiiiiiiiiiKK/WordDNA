import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { WordParts } from '@/components/word/WordParts';
import { WordAnatomy } from '@/components/word/WordAnatomy';
import { WordBuildingBoard } from '@/components/word/WordBuildingBoard';
import { WordbookPanel } from '@/components/word/WordbookPanel';
import { Icon } from '@/components/common/Icon';
import { splitWord } from '@/lib/splitter';
import { getWordById, getEcdict, getEcdictPhonetic, firstLineOf } from '@/data';
import { useSettingsStore } from '@/store/useSettingsStore';
import { classNames } from '@/lib/utils';

const RELIABILITY_LABEL: Record<string, string> = {
  etymological: '词源拆解（可靠）',
  morphological: '形态拆解（可靠）',
  mnemonic: '记忆辅助拆分',
};

export function Split() {
  const navigate = useNavigate();
  const splitMode = useSettingsStore((s) => s.settings.splitMode);
  const setSplitMode = useSettingsStore((s) => s.setSplitMode);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ReturnType<typeof splitWord> | null>(null);

  const run = () => {
    if (!input.trim()) return;
    setResult(splitWord(input, splitMode));
  };

  const matched = result?.matchedWordId ? getWordById(result.matchedWordId) : undefined;
  const wholeTr = result?.input ? getEcdict(result.input) : undefined;
  const wholePh = result?.input ? getEcdictPhonetic(result.input) : undefined;

  return (
    <PageContainer>
      <Card>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="例如：transport / unbelievable / internationalization"
            className="flex-1 border-2 border-ink bg-surface px-4 py-3 font-display text-base font-bold tracking-tight text-text outline-none placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:bg-accent/20"
          />
          <Button onClick={run}>拆解</Button>
        </div>
        <div className="mt-3 flex gap-2">
          <ModeToggle active={splitMode === 'learn'} onClick={() => setSplitMode('learn')} label="学习拆词" />
          <ModeToggle active={splitMode === 'etymology'} onClick={() => setSplitMode('etymology')} label="词源拆词" />
        </div>
      </Card>

      {result && (
        <div className="mt-4 space-y-4">
          {!result.success && (
            <Card className="border-danger/40">
              <div className="flex items-start gap-2 text-danger">
                <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{result.warning}</p>
                  {result.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setInput(s);
                            setResult(splitWord(s, splitMode));
                          }}
                          className="rounded-full bg-surface-2 px-3 py-1 text-sm text-word"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {wholeTr && (
                    <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-text break-safe">
                      <span className="text-muted">整词释义（ECDICT）：</span>
                      {wholePh && <span className="font-mono text-muted"> {wholePh} </span>}
                      {firstLineOf(wholeTr)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {result.success && (
            <>
              {result.warning && (
                <Card className="border-warn/40">
                  <div className="flex items-center gap-2 text-warn">
                    <Icon name="alert" size={18} className="shrink-0" />
                    <span className="text-sm">{result.warning}</span>
                  </div>
                </Card>
              )}

              <Card>
                <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-ink pb-2">
                  <span className="tag-edit">ANATOMY / {result.input.toUpperCase()}</span>
                  <Chip color="muted">{RELIABILITY_LABEL[result.reliability]}</Chip>
                </div>
                {/* 方案 D：单词本身就是可交互的视觉对象 */}
                <WordAnatomy word={result.input} parts={result.parts} />
                {/* 紧凑形态：与详情页/词库保持一致的词素序列 */}
                <div className="mt-4 border-t border-border pt-3">
                  <WordParts parts={result.parts} />
                </div>
              </Card>

              {matched ? (
                <WordBuildingBoard word={matched} />
              ) : (
                <Card>
                  <p className="text-sm text-muted break-safe">
                    已按形态规则完成拆分。点击下方可查看词根详情或继续学习。
                  </p>
                  {wholeTr && (
                    <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-text break-safe">
                      <span className="text-muted">整词释义（ECDICT）：</span>
                      {wholePh && <span className="font-mono text-muted"> {wholePh} </span>}
                      {firstLineOf(wholeTr)}
                    </div>
                  )}
                </Card>
              )}

              {matched && (
                <Button block variant="outline" onClick={() => navigate(`/word/${matched.id}`)}>
                  查看单词详情
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {!result && (
        <p className="mt-6 text-center text-sm text-muted">输入单词后，这里会显示词根词缀拆解与记忆提示。</p>
      )}

      {/* 词库浏览：词根词库 / 盈余词库 / 考试词书 */}
      <div className="mt-6">
        <WordbookPanel />
      </div>
    </PageContainer>
  );
}

function ModeToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'border-2 border-ink px-3 py-1.5 text-sm font-semibold transition-colors',
        active ? 'bg-ink text-paper' : 'bg-surface text-muted hover:text-text',
      )}
    >
      {label}
    </button>
  );
}
