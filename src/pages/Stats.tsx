import { useRef, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ProgressRing } from '@/components/viz/ProgressRing';
import { StreakBadge } from '@/components/viz/StreakBadge';
import { MasteryBar } from '@/components/viz/MasteryBar';
import { MasteryChart } from '@/components/viz/MasteryChart';
import { Dialog } from '@/components/common/Dialog';
import { Icon } from '@/components/common/Icon';
import { useLearningStore } from '@/store/useLearningStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCollectionStore } from '@/store/useCollectionStore';
import { overallMastery, rootMastery } from '@/lib/mastery';
import { getRoots, getWords } from '@/data';

export function Stats() {
  const states = useLearningStore((s) => s.states);
  const dailyLogs = useSettingsStore((s) => s.dailyLogs);
  const getStreak = useSettingsStore((s) => s.getStreak);
  const exportData = useSettingsStore((s) => s.exportData);
  const importData = useSettingsStore((s) => s.importData);
  const resetAll = useSettingsStore((s) => s.resetAll);
  const hydrateLearning = useLearningStore((s) => s.hydrate);
  const hydrateCollection = useCollectionStore((s) => s.hydrate);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const pct = Math.round(overallMastery(states) * 100);
  const streak = getStreak();
  const ids = Object.keys(states);
  const byStatus = (s: string) => ids.filter((id) => states[id].status === s).length;

  const rootRows = getRoots()
    .map((r) => ({ root: r, m: rootMastery(r.id, states) }))
    .sort((a, b) => b.m.ratio - a.m.ratio);

  const doExport = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worddna-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      await importData(text);
      await hydrateLearning();
      await hydrateCollection();
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    setBusy(true);
    try {
      await resetAll();
      await hydrateLearning();
      await hydrateCollection();
      setConfirmReset(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    // 顶栏已经显示「我的」，这里不再重复，直接把这一页是什么说清楚
    <PageContainer title="学习数据与掌握度总览">
      <div className="space-y-4">
        <Card className="flex items-center gap-4">
          <ProgressRing value={pct / 100} size={96} stroke={9} label={`${pct}%`} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-text">总体掌握度</div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
              <span className="text-success">已掌握 {byStatus('mastered')}</span>
              <span className="text-warn">学习中 {byStatus('learning')}</span>
              <span className="text-prefix">复习 {byStatus('review')}</span>
              <span>新词 {byStatus('new')}</span>
            </div>
            {/* 与上方「总体掌握度」左对齐，字号也放大一档 */}
            <div className="mt-1.5">
              <StreakBadge streak={streak} plain />
            </div>
            {/* 掌握度到底怎么算的：写出来，别让用户猜那个百分比是什么意思 */}
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              掌握度 = 已接触 {ids.length} 项的加权平均（已掌握 100% / 复习 70% / 学习中 40% /
              未接触不计入）；词库共 {getWords().length} 个单词。
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-text">近 7 天学习量</h3>
          <MasteryChart logs={dailyLogs} />
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-text">词根掌握度</h3>
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {rootRows.map(({ root, m }) => (
              <div key={root.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-text">{root.root}</span>
                  <span className="text-muted">{m.totalWords ? Math.round(m.ratio * 100) : 0}%</span>
                </div>
                <MasteryBar mastered={m.mastered} learning={m.learning} review={m.review} newCount={m.newCount} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-text">数据管理</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" size="sm" onClick={doExport}>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="bookmark" size={16} /> 导出备份
              </span>
            </Button>
            <Button variant="subtle" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="rotate" size={16} /> 导入备份
              </span>
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = '';
              }}
            />
            <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)} disabled={busy}>
              清空数据
            </Button>
          </div>
        </Card>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="确认清空？"
        footer={
          <>
            <Button variant="subtle" onClick={() => setConfirmReset(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={doReset} disabled={busy}>
              确认清空
            </Button>
          </>
        }
      >
        此操作会删除全部学习进度、收藏与错题，且无法恢复。
      </Dialog>
    </PageContainer>
  );
}
