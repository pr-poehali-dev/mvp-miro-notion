import { useCallback, useEffect, useRef, useState } from 'react';
import AchievementNode, { NODE_W, NODE_H } from '@/components/board/AchievementNode';
import TaskNode from '@/components/board/TaskNode';
import Toolbar from '@/components/board/Toolbar';
import SpacesBar from '@/components/board/SpacesBar';
import ModeSwitch from '@/components/board/ModeSwitch';
import PropertyPanel from '@/components/board/PropertyPanel';
import ActiveTasksPanel from '@/components/board/ActiveTasksPanel';
import { useBoardStore, newSpace } from '@/hooks/useBoardStore';
import {
  Achievement,
  Task,
  Connection,
  Space,
  DEFAULT_IMAGES,
  COLORS,
  uid,
} from '@/types/board';

// ── geometry ────────────────────────────────────────────────────────────────
// 4 connector anchor points per node (top / right / bottom / left)
const ANCHORS = (n: { x: number; y: number }) => ({
  top:    { x: n.x + NODE_W / 2,  y: n.y },
  right:  { x: n.x + NODE_W,      y: n.y + NODE_H / 2 },
  bottom: { x: n.x + NODE_W / 2,  y: n.y + NODE_H },
  left:   { x: n.x,               y: n.y + NODE_H / 2 },
});

type AnchorKey = 'top' | 'right' | 'bottom' | 'left';

// Closest pair of anchors between two nodes
const bestAnchors = (a: Achievement, b: Achievement) => {
  const aa = ANCHORS(a);
  const ab = ANCHORS(b);
  let best = { from: aa.right, to: ab.left, dist: Infinity };
  for (const ka of Object.keys(aa) as AnchorKey[]) {
    for (const kb of Object.keys(ab) as AnchorKey[]) {
      const dx = aa[ka].x - ab[kb].x;
      const dy = aa[ka].y - ab[kb].y;
      const d = Math.hypot(dx, dy);
      if (d < best.dist) best = { from: aa[ka], to: ab[kb], dist: d };
    }
  }
  return best;
};

// Curved path between two points, shortened at the end to leave room for arrowhead
const curvePath = (
  from: { x: number; y: number },
  to:   { x: number; y: number },
  shorten = 12,
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return '';
  // Shorten "to" point so arrowhead sits outside node
  const ux = dx / len;
  const uy = dy / len;
  const tx = to.x - ux * shorten;
  const ty = to.y - uy * shorten;
  // Control points
  const ctrl = Math.min(Math.abs(dx) * 0.5, 120);
  return `M ${from.x} ${from.y} C ${from.x + ctrl * ux} ${from.y + ctrl * uy}, ${tx - ctrl * ux} ${ty - ctrl * uy}, ${tx} ${ty}`;
};

// ── component ────────────────────────────────────────────────────────────────
const Index = () => {
  const { state, setState } = useBoardStore();
  const { spaces, activeSpaceId, mode, camera } = state;
  const space = spaces.find((s) => s.id === activeSpaceId) || spaces[0];
  const isTask = mode === 'tasks';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // connectFrom: { id, anchor }
  const [connectFrom, setConnectFrom] = useState<{ id: string; anchor: AnchorKey } | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const camRef = useRef(camera);
  camRef.current = camera;

  const targetScaleRef = useRef(camera.scale);
  const zoomRafRef = useRef<number>();

  const smoothZoomTo = useCallback(
    (targetScale: number, cx: number, cy: number) => {
      targetScaleRef.current = Math.min(2.5, Math.max(0.25, targetScale));
      if (zoomRafRef.current) cancelAnimationFrame(zoomRafRef.current);
      const animate = () => {
        const cur = camRef.current;
        const diff = targetScaleRef.current - cur.scale;
        if (Math.abs(diff) < 0.001) {
          setState((s) => ({ ...s, camera: { ...s.camera, scale: targetScaleRef.current } }));
          return;
        }
        const next = cur.scale + diff * 0.16;
        const ratio = next / cur.scale;
        setState((s) => ({
          ...s,
          camera: {
            scale: next,
            x: cx - (cx - s.camera.x) * ratio,
            y: cy - (cy - s.camera.y) * ratio,
          },
        }));
        zoomRafRef.current = requestAnimationFrame(animate);
      };
      zoomRafRef.current = requestAnimationFrame(animate);
    },
    [setState],
  );

  const setCamera = (patch: Partial<typeof camera>) =>
    setState((s) => ({ ...s, camera: { ...s.camera, ...patch } }));

  const updateSpace = (fn: (sp: Space) => Space) =>
    setState((s) => ({
      ...s,
      spaces: s.spaces.map((sp) => (sp.id === activeSpaceId ? fn(sp) : sp)),
    }));

  const addItem = () => {
    const cam = camRef.current;
    const cx = (-cam.x + window.innerWidth / 2) / cam.scale - NODE_W / 2;
    const cy = (-cam.y + window.innerHeight / 2) / cam.scale - NODE_H / 2;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const image = DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
    const id = uid();
    if (isTask) {
      const t: Task = {
        id, x: cx, y: cy, title: 'Новое задание', description: '',
        image, color, stars: 1, repeat: 'once', customDays: [], active: false, done: false,
      };
      updateSpace((sp) => ({ ...sp, tasks: [...sp.tasks, t] }));
    } else {
      const a: Achievement = { id, x: cx, y: cy, title: 'Новая ачивка', description: '', image, color };
      updateSpace((sp) => ({ ...sp, achievements: [...sp.achievements, a] }));
    }
    setSelectedId(id);
  };

  const patchItem = (patch: Partial<Achievement & Task>) => {
    if (!selectedId) return;
    updateSpace((sp) =>
      isTask
        ? { ...sp, tasks: sp.tasks.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)) }
        : { ...sp, achievements: sp.achievements.map((a) => (a.id === selectedId ? { ...a, ...patch } : a)) },
    );
  };

  const moveItem = (id: string, x: number, y: number) => {
    updateSpace((sp) =>
      isTask
        ? { ...sp, tasks: sp.tasks.map((t) => (t.id === id ? { ...t, x, y } : t)) }
        : { ...sp, achievements: sp.achievements.map((a) => (a.id === id ? { ...a, x, y } : a)) },
    );
  };

  const deleteItem = useCallback(() => {
    setSelectedId((sel) => {
      if (!sel) return null;
      setState((s) => ({
        ...s,
        spaces: s.spaces.map((sp) =>
          sp.id === activeSpaceId
            ? isTask
              ? { ...sp, tasks: sp.tasks.filter((t) => t.id !== sel) }
              : {
                  ...sp,
                  achievements: sp.achievements.filter((a) => a.id !== sel),
                  connections: sp.connections.filter((c) => c.from !== sel && c.to !== sel),
                }
            : sp,
        ),
      }));
      return null;
    });
  }, [activeSpaceId, isTask, setState]);

  const toggleDone = (id: string) => {
    updateSpace((sp) => ({
      ...sp,
      tasks: sp.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  };

  const startConnect = (id: string, anchor: AnchorKey) => setConnectFrom({ id, anchor });
  const completeConnect = (id: string) => {
    if (connectFrom && connectFrom.id !== id) {
      updateSpace((sp) =>
        sp.connections.some((c) => c.from === connectFrom.id && c.to === id)
          ? sp
          : { ...sp, connections: [...sp.connections, { id: uid(), from: connectFrom.id, to: id }] },
      );
    }
    setConnectFrom(null);
  };

  const addSpace = () => {
    const sp = newSpace(spaces.length);
    setState((s) => ({ ...s, spaces: [...s.spaces, sp], activeSpaceId: sp.id }));
    setSelectedId(null);
  };

  // ── center-fit button ─────────────────────────────────────────────────────
  const centerOnAchievements = () => {
    const nodes = isTask ? space.tasks : space.achievements;
    if (!nodes.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W);
      maxY = Math.max(maxY, n.y + NODE_H);
    }
    const padding = 80;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const s = Math.min(W / contentW, H / contentH, 1.5);
    const cx = minX - padding;
    const cy = minY - padding;
    setState((st) => ({
      ...st,
      camera: { scale: s, x: -cx * s + (W - contentW * s) / 2, y: -cy * s + (H - contentH * s) / 2 },
    }));
  };

  // ── wheel = pan (Ctrl = zoom) ─────────────────────────────────────────────
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        smoothZoomTo(camRef.current.scale * delta, cx, cy);
      } else {
        setState((s) => ({
          ...s,
          camera: { ...s.camera, x: s.camera.x - e.deltaX, y: s.camera.y - e.deltaY },
        }));
      }
    },
    [smoothZoomTo, setState],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── pointer handlers (RMB = pan) ─────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    const onBg = e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg;
    if (e.button === 2) {
      e.preventDefault();
      panRef.current = { sx: e.clientX, sy: e.clientY, ox: camera.x, oy: camera.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (e.button === 0 && onBg) {
      setSelectedId(null);
      setConnectFrom(null);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) {
      setMouse({
        x: (e.clientX - rect.left - camera.x) / camera.scale,
        y: (e.clientY - rect.top  - camera.y) / camera.scale,
      });
    }
    if (panRef.current) {
      setCamera({
        x: panRef.current.ox + (e.clientX - panRef.current.sx),
        y: panRef.current.oy + (e.clientY - panRef.current.sy),
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    panRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteItem();
      if (e.key === 'Escape') { setConnectFrom(null); setSelectedId(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteItem]);

  // ── compute locked set ───────────────────────────────────────────────────
  // An achievement is locked if any direct "from" predecessor is not done
  const lockedIds = new Set<string>();
  if (!isTask) {
    for (const c of space.connections) {
      const fromNode = space.achievements.find((a) => a.id === c.from);
      if (fromNode && !fromNode.done) {
        lockedIds.add(c.to);
      }
    }
  }

  const selectedItem = selectedId
    ? isTask
      ? space.tasks.find((t) => t.id === selectedId)
      : space.achievements.find((a) => a.id === selectedId)
    : undefined;

  const fromAnchorPos = connectFrom
    ? (() => {
        const n = space.achievements.find((a) => a.id === connectFrom.id);
        return n ? ANCHORS(n)[connectFrom.anchor] : null;
      })()
    : null;

  return (
    <div
      ref={wrapRef}
      className="canvas-grid relative h-screen w-screen overflow-hidden"
      style={{
        backgroundSize: `${28 * camera.scale}px ${28 * camera.scale}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
        cursor: panRef.current ? 'grabbing' : 'default',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div data-bg="1" className="absolute inset-0" />

      {/* ── world ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})` }}
      >
        {/* SVG connections */}
        {!isTask && (
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="4"
                refY="4"
                orient="auto-start-reverse"
              >
                <path d="M0,1 L0,7 L7,4 Z" fill="rgba(255,255,255,0.55)" />
              </marker>
            </defs>
            {space.connections.map((c: Connection) => {
              const a = space.achievements.find((n) => n.id === c.from);
              const b = space.achievements.find((n) => n.id === c.to);
              if (!a || !b) return null;
              const { from, to } = bestAnchors(a, b);
              return (
                <path
                  key={c.id}
                  d={curvePath(from, to, 14)}
                  fill="none"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            {/* Draft line while connecting */}
            {fromAnchorPos && (
              <path
                d={curvePath(fromAnchorPos, mouse, 0)}
                fill="none"
                stroke="rgba(93,130,255,0.7)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                className="flow-line"
              />
            )}
          </svg>
        )}

        {/* Achievement nodes */}
        {!isTask &&
          space.achievements.map((n) => (
            <AchievementNode
              key={n.id}
              node={n}
              selected={selectedId === n.id}
              locked={lockedIds.has(n.id)}
              scale={camera.scale}
              connecting={!!connectFrom}
              onSelect={(id) => setSelectedId(id)}
              onMove={moveItem}
              onStartConnect={startConnect}
              onCompleteConnect={completeConnect}
              onMarkDone={(id) =>
                updateSpace((sp) => ({
                  ...sp,
                  achievements: sp.achievements.map((a) =>
                    a.id === id ? { ...a, done: true } : a,
                  ),
                }))
              }
              onMarkUndone={(id) =>
                updateSpace((sp) => ({
                  ...sp,
                  achievements: sp.achievements.map((a) =>
                    a.id === id ? { ...a, done: false } : a,
                  ),
                }))
              }
            />
          ))}

        {/* Task nodes */}
        {isTask &&
          space.tasks.map((t) => (
            <TaskNode
              key={t.id}
              node={t}
              selected={selectedId === t.id}
              scale={camera.scale}
              onSelect={(id) => setSelectedId(id)}
              onMove={moveItem}
              onToggleDone={toggleDone}
            />
          ))}
      </div>

      {/* ── top bar ──────────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-20 flex h-14 items-center border-b border-white/[0.06]"
        style={{ background: 'rgba(22,27,44,0.96)', backdropFilter: 'blur(12px)' }}
      >
        <div className="pointer-events-auto flex items-center gap-2 px-5">
          <span className="font-display text-base font-bold tracking-widest" style={{ color: '#5D82FF' }}>
            ✦ ACHIEVEMENTY
          </span>
        </div>
        <div className="pointer-events-auto mx-auto">
          <ModeSwitch mode={mode} onChange={(m) => setState((s) => ({ ...s, mode: m }))} />
        </div>
        <div className="w-48" />
      </div>

      {/* ── left sidebar ─────────────────────────────────────────────────── */}
      <div className="fixed left-4 top-20 z-20 flex flex-col gap-3">
        {isTask && <ActiveTasksPanel tasks={space.tasks} />}
      </div>

      <SpacesBar
        spaces={spaces}
        activeId={activeSpaceId}
        onSelect={(id) => {
          setState((s) => ({ ...s, activeSpaceId: id }));
          setSelectedId(null);
        }}
        onAdd={addSpace}
      />

      {/* ── toolbar ──────────────────────────────────────────────────────── */}
      <Toolbar
        isTask={isTask}
        onAdd={addItem}
        connecting={!!connectFrom}
        onToggleConnect={() => setConnectFrom(connectFrom ? null : null)}
      />

      {/* ── property panel ───────────────────────────────────────────────── */}
      {selectedItem && (
        <PropertyPanel
          item={selectedItem}
          isTask={isTask}
          onPatch={patchItem}
          onDelete={deleteItem}
        />
      )}

      {/* ── connect hint ─────────────────────────────────────────────────── */}
      {connectFrom && (
        <div
          className="fixed left-1/2 top-20 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 font-sans text-xs font-medium text-white animate-pop-in"
          style={{ background: 'rgba(93,130,255,0.2)', border: '1px solid rgba(93,130,255,0.4)' }}
        >
          Наведите на ачивку и кликните · Esc для отмены
        </div>
      )}

      {/* ── bottom-left: center button ───────────────────────────────────── */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={centerOnAchievements}
        className="fixed bottom-5 left-5 z-20 flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-white"
        style={{ background: 'rgba(32,43,75,0.85)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
        title="Центрировать на ачивках"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 1h5v1.5H2.5V7H1V1zm9 0h5v6h-1.5V2.5H10V1zM1 9h1.5v4H7v1.5H1V9zm12.5 4H10v1.5h6V9h-1.5v4z"/>
          <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
        </svg>
      </button>
    </div>
  );
};

export default Index;
