import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRootById, getFamilyWords, getRoots } from '@/data';

type NodeType = 'root' | 'word' | 'affix';
interface GNode {
  id: string;
  label: string;
  type: NodeType;
  meaning: string;
  refId: string;
}
interface GLink {
  source: string;
  target: string;
}
interface Pos {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const PAD = 36;

// compact=true 时（移动端）大幅缩减节点数，避免“全部”视图过密过乱
function buildGraph(seedRootId?: string, compact = false): { nodes: GNode[]; links: GLink[] } {
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  const see = new Set<string>();

  const addNode = (n: GNode) => {
    if (!see.has(n.id)) {
      see.add(n.id);
      nodes.push(n);
    }
  };

  if (seedRootId) {
    const root = getRootById(seedRootId);
    if (!root) return { nodes, links };
    addNode({ id: `r-${root.id}`, label: root.root, type: 'root', meaning: root.meaning, refId: root.id });
    const fam = getFamilyWords(seedRootId).slice(0, compact ? 18 : 40);
    for (const w of fam) {
      addNode({ id: `w-${w.id}`, label: w.word, type: 'word', meaning: w.meanings[0]?.cn ?? '', refId: w.id });
      links.push({ source: `r-${root.id}`, target: `w-${w.id}` });
      for (const p of w.parts) {
        if (p.type !== 'root' && p.morphemeId) {
          addNode({ id: `a-${p.morphemeId}`, label: p.text, type: 'affix', meaning: p.meaning, refId: p.morphemeId });
          links.push({ source: `w-${w.id}`, target: `a-${p.morphemeId}` });
        }
      }
    }
    return { nodes, links };
  }

  const topRoots = [...getRoots()]
    .sort((a, b) => b.words.length - a.words.length)
    .slice(0, compact ? 8 : 22);
  let wordBudget = compact ? 30 : 90;
  for (const r of topRoots) {
    addNode({ id: `r-${r.id}`, label: r.root, type: 'root', meaning: r.meaning, refId: r.id });
    const fam = getFamilyWords(r.id);
    for (const w of fam) {
      if (wordBudget <= 0) break;
      wordBudget--;
      addNode({ id: `w-${w.id}`, label: w.word, type: 'word', meaning: w.meanings[0]?.cn ?? '', refId: w.id });
      links.push({ source: `r-${r.id}`, target: `w-${w.id}` });
      for (const p of w.parts) {
        if (p.type !== 'root' && p.morphemeId) {
          addNode({ id: `a-${p.morphemeId}`, label: p.text, type: 'affix', meaning: p.meaning, refId: p.morphemeId });
          links.push({ source: `w-${w.id}`, target: `a-${p.morphemeId}` });
        }
      }
    }
  }
  return { nodes, links };
}

const COLOR: Record<NodeType, string> = {
  root: 'var(--color-danger)',
  affix: 'var(--color-prefix)',
  word: 'var(--color-success)',
};

export function GraphExplorer({ rootId }: { rootId?: string }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const posRef = useRef<Pos[]>([]);
  const [size, setSize] = useState({ w: 360, h: 520 });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const dragRef = useRef<{ mode: 'node' | 'pan'; id?: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [, forceRender] = useState(0);

  // 视口状态：是否已结算完成 / 用户是否手动平移缩放过
  const settledRef = useRef(false);
  const userMovedRef = useRef(false);
  const fitKeyRef = useRef('');

  const isNarrow = size.w < 560;
  const compact = isNarrow;

  const { nodes, links } = useMemo(() => buildGraph(rootId, compact), [rootId, compact]);

  // 自动适配：把整张图缩放到刚好填满视口（解决“全部”视图显示不全/过密）
  const fitView = useCallback(() => {
    const pos = posRef.current;
    if (pos.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pos) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const { w, h } = sizeRef.current;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const pad = 56;
    const k = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh, 1.5);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setTransform({ x: w / 2 - cx * k, y: h / 2 - cy * k, k });
  }, []);

  // 测量容器尺寸（移动端全幅铺满）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = Math.max(420, Math.min(640, Math.round((window.innerHeight || 700) * 0.62)));
      setSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // 初始化布局（按容器像素尺寸铺满）；图变化时重置交互态
  useEffect(() => {
    const { w, h } = size;
    const cx = w / 2;
    const cy = h / 2;
    posRef.current = nodes.map((_, i) => {
      const ang = (i / Math.max(1, nodes.length)) * Math.PI * 2;
      const r = 30 + (i % 9) * 14;
      return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, vx: 0, vy: 0 };
    });
    settledRef.current = false;
    userMovedRef.current = false;
    setSelected(null);
    setTransform({ x: 0, y: 0, k: 1 });
  }, [rootId, compact, size.w, size.h, nodes]);

  // 视口尺寸变化后，若用户未手动操作过则重新适配
  useEffect(() => {
    if (settledRef.current && !userMovedRef.current) fitView();
  }, [size.w, size.h, fitView]);

  // 力导向模拟
  useEffect(() => {
    if (nodes.length === 0) return;
    let raf = 0;
    let ticks = 0;
    const maxTicks = 220;
    const { w, h } = size;
    const index = new Map(nodes.map((n, i) => [n.id, i]));
    const k = Math.sqrt((w * h) / Math.max(1, nodes.length)) * 0.5;
    const repK = k * k;
    const key = `${rootId ?? 'all'}|${compact}`;

    const step = () => {
      const pos = posRef.current;
      const n = pos.length;
      for (let i = 0; i < n; i++) {
        let fx = 0;
        let fy = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          let dx = pos[i].x - pos[j].x;
          let dy = pos[i].y - pos[j].y;
          let d = Math.hypot(dx, dy) || 0.01;
          const f = repK / d;
          fx += (dx / d) * f;
          fy += (dy / d) * f;
        }
        fx += (w / 2 - pos[i].x) * 0.01;
        fy += (h / 2 - pos[i].y) * 0.01;
        pos[i].vx = (pos[i].vx + fx * 0.02) * 0.82;
        pos[i].vy = (pos[i].vy + fy * 0.02) * 0.82;
      }
      for (const l of links) {
        const a = index.get(l.source);
        const b = index.get(l.target);
        if (a == null || b == null) continue;
        let dx = pos[b].x - pos[a].x;
        let dy = pos[b].y - pos[a].y;
        let d = Math.hypot(dx, dy) || 0.01;
        const desired = k * 1.15;
        const f = (d - desired) * 0.04;
        const ux = (dx / d) * f;
        const uy = (dy / d) * f;
        pos[a].vx += ux;
        pos[a].vy += uy;
        pos[b].vx -= ux;
        pos[b].vy -= uy;
      }
      for (let i = 0; i < n; i++) {
        const p = pos[i];
        if (dragRef.current?.mode === 'node' && dragRef.current.id === nodes[i].id) continue;
        p.x = Math.max(PAD, Math.min(w - PAD, p.x + p.vx));
        p.y = Math.max(PAD, Math.min(h - PAD, p.y + p.vy));
      }
      ticks++;
      forceRender((t) => t + 1);
      if (ticks < maxTicks) {
        raf = requestAnimationFrame(step);
      } else {
        // 模拟完成：冻结并自动适配到视口
        settledRef.current = true;
        if (fitKeyRef.current !== key) {
          fitKeyRef.current = key;
          fitView();
        }
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rootId, compact, size.w, size.h, nodes, links, fitView]);

  const toLocal = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - t.x) / t.k,
      y: (clientY - rect.top - t.y) / t.k,
    };
  };

  const onPointerDownNode = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    userMovedRef.current = true;
    const p = toLocal(e.clientX, e.clientY);
    dragRef.current = { mode: 'node', id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerDownBg = (e: React.PointerEvent) => {
    userMovedRef.current = true;
    const t = transformRef.current;
    dragRef.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (d.mode === 'node') {
      const p = toLocal(e.clientX, e.clientY);
      const idx = nodes.findIndex((n) => n.id === d.id);
      if (idx >= 0) {
        posRef.current[idx].x = Math.max(PAD, Math.min(size.w - PAD, p.x));
        posRef.current[idx].y = Math.max(PAD, Math.min(size.h - PAD, p.y));
        posRef.current[idx].vx = 0;
        posRef.current[idx].vy = 0;
      }
    } else {
      setTransform((t) => ({ ...t, x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) }));
    }
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const zoomBy = (factor: number) => {
    userMovedRef.current = true;
    setTransform((t) => {
      const nk = Math.max(0.35, Math.min(3, t.k * factor));
      const cx = size.w / 2;
      const cy = size.h / 2;
      const lx = (cx - t.x) / t.k;
      const ly = (cy - t.y) / t.k;
      return { k: nk, x: cx - lx * nk, y: cy - ly * nk };
    });
  };
  const resetView = () => {
    userMovedRef.current = false;
    fitView();
  };

  const pos = posRef.current;
  const radius = (t: NodeType) => (t === 'root' ? 13 : t === 'affix' ? 7 : 6) * (isNarrow ? 1.1 : 1);
  // 词根与单词始终显示标签（含简短释义），词缀仅在较宽屏幕显示，避免文字重叠
  const showLabel = (t: NodeType) => t === 'root' || t === 'word' || !isNarrow;
  const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);
  const t = transform;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block w-full touch-none select-none"
        style={{ height: size.h }}
        onPointerDown={onPointerDownBg}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={(e) => zoomBy(e.deltaY < 0 ? 1.1 : 0.9)}
      >
        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
          {links.map((l, i) => {
            const a = nodes.findIndex((n) => n.id === l.source);
            const b = nodes.findIndex((n) => n.id === l.target);
            if (a < 0 || b < 0 || !pos[a] || !pos[b]) return null;
            return (
              <line
                key={i}
                x1={pos[a].x}
                y1={pos[a].y}
                x2={pos[b].x}
                y2={pos[b].y}
                stroke="var(--border)"
                strokeWidth={1}
              />
            );
          })}
          {nodes.map((n, i) => {
            const p = pos[i];
            if (!p) return null;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => onPointerDownNode(e, n.id)}
                onClick={() => setSelected(n)}
              >
                <circle r={radius(n.type)} fill={COLOR[n.type]} fillOpacity={0.92} stroke="var(--surface)" strokeWidth={1.5} />
                {showLabel(n.type) && (
                  <text x={radius(n.type) + 3} y={4} fontSize={n.type === 'root' ? 14 : 11} fill="var(--text)" className="break-safe">
                    {n.label}
                  </text>
                )}
                {isNarrow && showLabel(n.type) && n.type === 'word' && n.meaning && (
                  <text x={radius(n.type) + 3} y={15} fontSize={9} fill="var(--text-muted)" className="break-safe">
                    {truncate(n.meaning, 10)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 图例 */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: 'var(--color-danger)' }} />词根</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: 'var(--color-prefix)' }} />词缀</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: 'var(--color-success)' }} />单词</span>
      </div>

      {/* 缩放控制 */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button onClick={() => zoomBy(1.25)} aria-label="放大" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/90 text-text shadow-sm">＋</button>
        <button onClick={() => zoomBy(0.8)} aria-label="缩小" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/90 text-text shadow-sm">－</button>
        <button onClick={resetView} aria-label="复位" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/90 text-[11px] text-muted shadow-sm">适配</button>
      </div>

      {/* 用法提示 */}
      <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-center text-[11px] text-muted">
        拖拽节点整理 · 拖动空白处平移 · 用右上角按钮或滚轮缩放 · 点击节点看释义
      </div>

      {/* 选中信息面板：移动端底部抽屉，桌面右上卡片 */}
      {selected && (
        <div
          className={
            isNarrow
              ? 'absolute inset-x-2 bottom-9 rounded-2xl border border-border bg-surface/97 p-3 text-sm shadow-lg backdrop-blur'
              : 'absolute right-3 top-14 w-56 rounded-2xl border border-border bg-surface/95 p-3 text-sm shadow-lg backdrop-blur'
          }
        >
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: COLOR[selected.type] }} />
            <span className="font-semibold text-text break-safe">{selected.label}</span>
            <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
              {selected.type === 'root' ? '词根' : selected.type === 'word' ? '单词' : '词缀'}
            </span>
          </div>
          <p className="mt-1 text-muted break-safe">{selected.meaning || '（该节点暂无释义）'}</p>
          {/* 按钮用 ink/paper 成对色：原来的 bg-root + text-white 在浅色主题下是白底白字，看不清 */}
          <button
            className="mt-2 w-full rounded-lg bg-ink py-1.5 text-xs font-medium text-paper"
            onClick={() => navigate(selected.type === 'root' ? `/roots/${selected.refId}` : selected.type === 'word' ? `/word/${selected.refId}` : '/roots')}
          >
            {selected.type === 'root' ? '查看词根家族' : selected.type === 'word' ? '查看单词详情' : '浏览词根'}
          </button>
        </div>
      )}
    </div>
  );
}
