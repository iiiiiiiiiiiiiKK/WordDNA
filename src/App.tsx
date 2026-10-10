import { useState } from 'react';
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
import type { PlanMinutes } from '@/types/domain';
import { classNames } from '@/lib/utils';

function Onboarding() {
  const complete = useSettingsStore((s) => s.completeOnboarding);
  const [plan, setPlan] = useState<PlanMinutes>(10);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/95 p-4 backdrop-blur">
      <Card className="w-full max-w-sm animate-pop-in text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-root text-2xl font-bold text-white">
          W
        </div>
        <h1 className="text-xl font-bold text-text">WordDNA 单词DNA</h1>
        <p className="mt-1 text-sm text-muted">拆开一个单词，记住一整个词族</p>
        <p className="mt-4 text-sm text-text">选择你的每日学习计划</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([10, 20, 30] as PlanMinutes[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={classNames(
                'rounded-xl border-2 py-3 text-sm font-medium transition-colors',
                plan === p ? 'border-root bg-root/10 text-root' : 'border-border text-muted',
              )}
            >
              {p} 分钟
              <div className="mt-0.5 text-[11px] opacity-80">
                新 {p === 10 ? 5 : p === 20 ? 10 : 15} · 复习 {p === 10 ? 10 : p === 20 ? 20 : 30}
              </div>
            </button>
          ))}
        </div>
        <Button block className="mt-5" onClick={() => complete(plan)}>
          开始学习
        </Button>
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
