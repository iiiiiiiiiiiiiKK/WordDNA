import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { MasteryBar } from '@/components/viz/MasteryBar';
import { RootFamilyList } from '@/components/root/RootFamilyList';
import { EmptyState } from '@/components/common/EmptyState';
import { getRootById } from '@/data';
import { ROUTES } from '@/lib/routes';
import { useLearningStore } from '@/store/useLearningStore';
import { rootMastery } from '@/lib/mastery';

export function RootFamily() {
  const { rootId } = useParams<{ rootId: string }>();
  const navigate = useNavigate();
  const states = useLearningStore((s) => s.states);
  const startSession = useLearningStore((s) => s.startSession);
  const setFocusItem = useLearningStore((s) => s.setFocusItem);

  const root = rootId ? getRootById(rootId) : undefined;

  if (!root) {
    return (
      <PageContainer>
        <EmptyState icon="root" title="词根不存在" description="没有找到该词根。" action={<Button onClick={() => navigate('/roots')}>返回词根</Button>} />
      </PageContainer>
    );
  }

  const m = rootMastery(root.id, states);

  const studyThisRoot = () => {
    // 关键：把「要学的是这个词根」这个意图告诉学习页。
    // 只 startSession 不够——学习页现在是滑动流，不看 session，会停在上次浏览处。
    startSession('root', [{ itemId: root.id, type: 'root', kind: 'new' }]);
    setFocusItem(root.id);
    navigate('/study');
  };

  return (
    <PageContainer
      title={root.root}
      subtitle={root.meaning}
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.graph(root.id))}>图谱</Button>
          <Button size="sm" onClick={studyThisRoot}>学习该词根</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-2">
            <Chip color="muted">{root.language}</Chip>
            {root.etymology && <span className="text-xs text-muted">词源</span>}
          </div>
          <p className="mt-3 text-sm text-muted break-safe">{root.etymology}</p>
          <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-text break-safe">{root.description}</p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>掌握进度</span>
              <span>{m.totalWords ? Math.round(m.ratio * 100) : 0}%</span>
            </div>
            <MasteryBar mastered={m.mastered} learning={m.learning} review={m.review} newCount={m.newCount} />
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              <span className="text-success">已掌握 {m.mastered}</span>
              <span className="text-warn">学习中 {m.learning}</span>
              <span className="text-prefix">复习 {m.review}</span>
              <span>新词 {m.newCount}</span>
            </div>
          </div>
        </Card>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">家族词（{m.totalWords}）</h2>
          <RootFamilyList rootId={root.id} />
        </section>
      </div>
    </PageContainer>
  );
}
