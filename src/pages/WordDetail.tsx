import { useNavigate, useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { Icon } from '@/components/common/Icon';
import { WordHeader } from '@/components/word/WordHeader';
import { WordBuildingBoard } from '@/components/word/WordBuildingBoard';
import { EmptyState } from '@/components/common/EmptyState';
import { getWordById, getRootById } from '@/data';
import { useLearningStore } from '@/store/useLearningStore';

export function WordDetail() {
  const { wordId } = useParams<{ wordId: string }>();
  const navigate = useNavigate();
  const startSession = useLearningStore((s) => s.startSession);
  const setFocusItem = useLearningStore((s) => s.setFocusItem);
  const word = wordId ? getWordById(wordId) : undefined;

  if (!word) {
    return (
      <PageContainer>
        <EmptyState icon="book" title="单词不存在" description="没有找到该单词。" action={<Button onClick={() => navigate('/roots')}>浏览词根</Button>} />
      </PageContainer>
    );
  }

  // 学一个单词 = 学它所在的词族：把意图交给学习页，直接停在它的词根上并高亮该词。
  // （单词若没有可用词根，学习页会自动退回常规浏览位置，不会出现「点了却跳到别处」。）
  const studyThis = () => {
    startSession('review', [{ itemId: word.id, type: 'word', kind: 'new' }]);
    setFocusItem(word.id);
    navigate('/study');
  };

  return (
    <PageContainer actions={<Button size="sm" onClick={studyThis}>学这个词族</Button>}>
      <div className="space-y-4">
        <WordHeader word={word} />

        <WordBuildingBoard word={word} />

        {word.examples.length > 0 && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-text">例句</h3>
            <ul className="space-y-3">
              {word.examples.map((ex, i) => (
                <li key={i} className="rounded-xl bg-surface-2 p-3">
                  <div className="text-sm text-text break-safe">{ex.en}</div>
                  <div className="mt-1 text-sm text-muted break-safe">{ex.cn}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {word.evolution && word.evolution.length > 0 && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-text">词义演化</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-text">
              {word.evolution.map((e, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="break-safe">{e}</span>
                  {i < word.evolution!.length - 1 && <Icon name="chevron-right" size={14} className="text-muted" />}
                </span>
              ))}
            </div>
          </Card>
        )}

        {word.mnemonic && (
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-text">记忆提示</h3>
            <p className="text-sm text-text break-safe">{word.mnemonic}</p>
          </Card>
        )}

        {word.rootIds.length > 0 && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-text">所属词根</h3>
            <div className="flex flex-wrap gap-2">
              {word.rootIds.map((id) => {
                const r = getRootById(id);
                if (!r) return null;
                return (
                  <Link key={id} to={`/roots/${id}`}>
                    <Chip color="root" className="cursor-pointer hover:ring-2 hover:ring-root/40">
                      {r.root} · {r.meaning}
                    </Chip>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
