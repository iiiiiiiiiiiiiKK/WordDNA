import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/common/Switch';
import { classNames } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { ThemeMode, PlanMinutes } from '@/types/domain';

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

const PLANS: { value: PlanMinutes; label: string; desc: string }[] = [
  { value: 10, label: '10 分钟', desc: '新 5 · 复习 10' },
  { value: 20, label: '20 分钟', desc: '新 10 · 复习 20' },
  { value: 30, label: '30 分钟', desc: '新 15 · 复习 30' },
];

export function Settings() {
  const settings = useSettingsStore((s) => s.settings);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setPlan = useSettingsStore((s) => s.setPlan);
  const setSplitMode = useSettingsStore((s) => s.setSplitMode);

  return (
    <PageContainer title="设置" subtitle="个性化你的学习体验">
      <div className="space-y-4">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-text">主题</h3>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={classNames(
                  'rounded-xl border-2 py-2.5 text-sm font-medium transition-colors',
                  settings.theme === t.value ? 'border-root bg-root/10 text-root' : 'border-border text-muted hover:text-text',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-text">每日学习计划</h3>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlan(p.value)}
                className={classNames(
                  'flex flex-col items-center rounded-xl border-2 py-3 transition-colors',
                  settings.plan === p.value ? 'border-root bg-root/10 text-root' : 'border-border text-muted hover:text-text',
                )}
              >
                <span className="text-base font-semibold">{p.label}</span>
                <span className="mt-0.5 text-[11px] opacity-80">{p.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">默认拆词视图</h3>
              <p className="mt-0.5 text-xs text-muted">拆词页默认展示学习拆词还是词源拆词</p>
            </div>
            <Switch checked={settings.splitMode === 'etymology'} onChange={(v) => setSplitMode(v ? 'etymology' : 'learn')} />
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className={classNames('rounded-full px-2.5 py-1', settings.splitMode === 'learn' ? 'bg-root/10 text-root' : 'bg-surface-2 text-muted')}>
              学习拆词
            </span>
            <span className={classNames('rounded-full px-2.5 py-1', settings.splitMode === 'etymology' ? 'bg-root/10 text-root' : 'bg-surface-2 text-muted')}>
              词源拆词
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 text-sm font-semibold text-text">关于 WordDNA</h3>
          <p className="text-sm text-muted break-safe">拆开一个单词，记住一整个词族。词根驱动的英语记忆系统。</p>
          <div className="mt-3">
            <Button variant="subtle" size="sm" onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}>
              切换深浅色
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
