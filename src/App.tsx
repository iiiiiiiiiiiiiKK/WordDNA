import { useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SearchPanel } from '@/components/search/SearchPanel';
import { Dashboard } from '@/pages/Dashboard';
import { Study } from '@/pages/Study';
import { Split } from '@/pages/Split';
import { Roots } from '@/pages/Roots';
import { RootFamily } from '@/pages/RootFamily';
import { Graph } from '@/pages/Graph';
import { WordDetail } from '@/pages/WordDetail';
import { Mistakes } from '@/pages/Mistakes';
import { Favorites } from '@/pages/Favorites';
import { Stats } from '@/pages/Stats';
import { Search } from '@/pages/Search';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getWords } from '@/data';
import type { PlanMinutes, Word } from '@/types/domain';
import { classNames } from '@/lib/utils';

// 首次诊断：轻量（≤3 分钟），只建初始画像，不宣传成等级考试
const FAMILIARITY = [
  { key: 'stranger', label: '陌生', score: 0 },
  { key: 'seen', label: '见过', score: 1 },
  { key: 'know', label: '基本认识', score: 2 },
  { key: 'familiar', label: '熟悉', score: 3 },
] as const;
const GOALS: { value: 'daily' | 'reading' | 'work' | 'tech' | 'exam' | 'overall'; label: string }[] = [
  { value: 'daily', label: '日常交流' },
  { value: 'reading', label: '阅读英文' },
  { value: 'work', label: '工作英语' },
  { value: 'tech', label: '技术英语' },
  { value: 'exam', label: '考试备考' },
  { value: 'overall', label: '综合提升' },
];
// 抽样 5 个真实单词做熟悉度自测（固定下标，保证可复现）
const SAMPLE_IDX = [15, 45, 90, 160, 300];

function Onboarding() {
  const complete = useSettingsStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<PlanMinutes>(10);
  const [goal, setGoal] = useState<(typeof GOALS)[number]['value']>('reading');
  const [picks, setPicks] = useState<(number | null)[]>([null, null, null, null, null]);

  const samples = useMemo(
    () =>
      SAMPLE_IDX.map((i) => getWords()[i])
        .filter((w): w is Word => Boolean(w))
        .map((w) => ({ word: w.word, phonetic: w.phonetic })),
    [],
  );

  const level = useMemo<'weak' | 'mid' | 'strong'>(() => {
    const answered = picks.filter((p): p is number => p !== null);
    if (answered.length === 0) return 'mid';
    const avg = answered.reduce((a, b) => a + b, 0) / answered.length;
    if (avg >= 2.2) return 'strong';
    if (avg >= 1.1) return 'mid';
    return 'weak';
  }, [picks]);

  const setPick = (i: number, score: number) =>
    setPicks((p) => {
      const next = p.slice();
      next[i] = score;
      return next;
    });

  const finish = () => complete(plan, { level, goal });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-bg/95 p-4 backdrop-blur">
      <Card className="my-6 w-full max-w-sm animate-pop-in">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-root text-2xl font-bold text-white">
          W
        </div>
        <h1 className="text-center text-xl font-bold text-text">WordDNA 单词DNA</h1>
        <p className="mt-1 text-center text-sm text-muted">拆开一个单词，记住一整个词族</p>

        {/* 进度 */}
        <div className="mt-4 flex items-center gap-2">
          {[0, 1, 2].map((s) => (
            <div key={s} className={classNames('h-1 flex-1 rounded-full', s <= step ? 'bg-root' : 'bg-border')} />
          ))}
        </div>

        {step === 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-text">这些词你认识几个？（凭直觉选，不用查）</p>
            <div className="mt-3 space-y-3">
              {samples.map((s, i) => (
                <div key={i}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-base font-bold tracking-tight text-text">{s.word}</span>
                    {s.phonetic && <span className="font-mono text-[11px] text-accent-2">{s.phonetic}</span>}
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {FAMILIARITY.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setPick(i, f.score)}
                        className={classNames(
                          'rounded-lg border-2 py-1.5 text-[11px] font-medium transition-colors',
                          picks[i] === f.score ? 'border-root bg-root/10 text-root' : 'border-border text-muted',
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button block className="mt-5" disabled={picks.some((p) => p === null)} onClick={() => setStep(1)}>
              下一步
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-text">你的学习目标？</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={classNames(
                    'rounded-xl border-2 py-3 text-sm font-medium transition-colors',
                    goal === g.value ? 'border-root bg-root/10 text-root' : 'border-border text-muted',
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                上一步
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-text">每天能拿出多少时间？</p>
            <p className="mt-1 text-xs text-muted">默认推荐 10～20 分钟；很忙时也能选 5 分钟。</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {([5, 10, 20, 30] as PlanMinutes[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={classNames(
                    'flex flex-col items-center rounded-xl border-2 py-3 transition-colors',
                    plan === p ? 'border-root bg-root/10 text-root' : 'border-border text-muted',
                  )}
                >
                  <span className="text-base font-semibold">{p}</span>
                  <span className="mt-0.5 text-[10px] opacity-80">分钟</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button className="flex-1" onClick={finish}>
                开始学习
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function App() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingDone = useSettingsStore((s) => s.settings.onboardingDone);

  if (hydrated && !onboardingDone) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study" element={<Study />} />
          <Route path="/split" element={<Split />} />
          <Route path="/roots" element={<Roots />} />
          <Route path="/roots/:rootId" element={<RootFamily />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/graph/:rootId" element={<Graph />} />
          <Route path="/word/:wordId" element={<WordDetail />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <SearchPanel />
    </BrowserRouter>
  );
}
