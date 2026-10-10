import type { DailyLog } from '@/types/domain';
import { todayKey, addDays } from '@/lib/utils';

interface MasteryChartProps {
  logs: DailyLog[];
  height?: number;
  className?: string;
}

export function MasteryChart({ logs, height = 120, className }: MasteryChartProps) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));
  const data = days.map((d) => {
    const key = todayKey(d);
    const log = logs.find((l) => l.date === key);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, value: log?.total ?? 0 };
  });
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100;
  const gap = 3;
  const barW = (w - gap * (data.length - 1)) / data.length;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 16);
          const x = i * (barW + gap);
          const y = height - h - 14;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(2, h)} rx={1.5} fill="var(--color-root)" opacity={d.value > 0 ? 1 : 0.25} />
              <text x={x + barW / 2} y={height - 3} textAnchor="middle" fontSize="3.4" fill="var(--text-muted)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
