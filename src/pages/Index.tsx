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

const Index = () => {
  const { state, setState } = useBoardStore();
  const { spaces, activeSpaceId, mode, camera } = state;
  const space = spaces.find((s) => s.id === activeSpaceId) || spaces[0];
  const isTask = mode === 'tasks';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Refs for smooth zoom
  const wrapRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const camRef = useRef(camera);
  camRef.current = camera;

  // Smooth zoom animation
  const targetScaleRef = useRef(camera.scale);
  const zoomRafRef = useRef<number>();

  const smoothZoomTo = useCallback((targetScale: number, cx: number, cy: number) => {
    targetScaleRef.current = Math.min(2.5, Math.max(0.3, targetScale));
    if (zoomRafRef.current) cancelAnimationFrame(zoomRafRef.current);

    const animate = () => {
      const current = camRef.current;
      const diff = targetScaleRef.current - current.scale;
      if (Math.abs(diff) < 0.001) {
        setState((s) => ({
          ...s,
          camera: { ...s.camera, scale: targetScaleRef.current },
        }));
        return;
      }
      const next = current.scale + diff * 0.14;
      const ratio = next / current.scale;
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
  }, [setState]);

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
        id, x: cx, y: cy,
        title: 'Новое задание', description: '',
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

  const startConnect = (id: string) => setConnectFrom(id);
  const completeConnect = (id: string) => {
    if (connectFrom && connectFrom !== id) {
      updateSpace((sp) =>
        sp.connections.some((c) => c.from === connectFrom && c.to === id)
          ? sp
          : { ...sp, connections: [...sp.connections, { id: uid(), from: connectFrom, to: id }] },
      );
    }
    setConnectFrom(null);
  };

  const addSpace = () => {
    const sp = newSpace(spaces.length);
    setState((s) => ({ ...s, spaces: [...s.spaces, sp], activeSpaceId: sp.id }));
    setSelectedId(null);
  };

  // Wheel: zoom to cursor point
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    smoothZoomTo(camRef.current.scale * delta, cx, cy);
  }, [smoothZoomTo]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

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
        y: (e.clientY - rect.top - camera.y) / camera.scale,
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

  // Connection lines — straight with slight curve
  const nodeCenter = (n: { x: number; y: number }) => ({ x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 });

  const linePath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    // Slight S-curve
    const cx1 = a.x + dx * 0.4;
    const cy1 = a.y;
    const cx2 = b.x - dx * 0.4;
    const cy2 = b.y;
    void mx; void my;
    return `M ${a.x} ${a.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${b.x} ${b.y}`;
  };

  const selectedItem = selectedId
    ? isTask
      ? space.tasks.find((t) => t.id === selectedId)
      : space.achievements.find((a) => a.id === selectedId)
    : undefined;

  const fromNode = connectFrom ? space.achievements.find((n) => n.id === connectFrom) : undefined;

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

      {/* Canvas world */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}
      >
        {/* Connection lines */}
        {!isTask && (
          <svg className="pointer-events-none absolute overflow-visible" style={{ width: 1, height: 1 }}>
            {space.connections.map((c: Connection) => {
              const a = space.achievements.find((n) => n.id === c.from);
              const b = space.achievements.find((n) => n.id === c.to);
              if (!a || !b) return null;
              const ca = nodeCenter(a);
              const cb = nodeCenter(b);
              return (
                <path
                  key={c.id}
                  d={linePath(ca, cb)}
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1.5}
                />
              );
            })}
            {fromNode && (
              <path
                d={linePath(nodeCenter(fromNode), mouse)}
                fill="none"
                stroke="rgba(93,130,255,0.6)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                className="flow-line"
              />
            )}
          </svg>
        )}

        {!isTask && space.achievements.map((n) => (
          <AchievementNode
            key={n.id}
            node={n}
            selected={selectedId === n.id}
            scale={camera.scale}
            connecting={!!connectFrom}
            onSelect={(id) => setSelectedId(id)}
            onMove={moveItem}
            onStartConnect={startConnect}
            onCompleteConnect={completeConnect}
            onMarkDone={(id) => updateSpace((sp) => ({
              ...sp,
              achievements: sp.achievements.map((a) => a.id === id ? { ...a, done: true } : a),
            }))}
            onMarkUndone={(id) => updateSpace((sp) => ({
              ...sp,
              achievements: sp.achievements.map((a) => a.id === id ? { ...a, done: false } : a),
            }))}
          />
        ))}

        {isTask && space.tasks.map((t) => (
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

      {/* Top bar — matches screenshot: logo left, tabs center */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex h-14 items-center border-b border-white/[0.06]"
        style={{ background: 'rgba(26,31,48,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="pointer-events-auto flex items-center gap-2 px-5">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold" style={{ color: '#5D82FF' }}>✦</span>
            <span className="font-display text-sm font-bold text-white tracking-wide">ACHIEVEMENTY</span>
          </div>
        </div>
        <div className="pointer-events-auto mx-auto">
          <ModeSwitch mode={mode} onChange={(m) => setState((s) => ({ ...s, mode: m }))} />
        </div>
        <div className="w-40" />
      </div>

      {/* Left: spaces + active tasks panel */}
      <div className="fixed left-5 top-20 z-20 flex flex-col gap-3">
        {isTask && <ActiveTasksPanel tasks={space.tasks} />}
      </div>

      <SpacesBar
        spaces={spaces}
        activeId={activeSpaceId}
        onSelect={(id) => { setState((s) => ({ ...s, activeSpaceId: id })); setSelectedId(null); }}
        onAdd={addSpace}
      />

      <Toolbar
        isTask={isTask}
        onAdd={addItem}
        connecting={!!connectFrom}
        onToggleConnect={() =>
          setConnectFrom(connectFrom ? null : selectedId || space.achievements[0]?.id || null)
        }
      />

      {selectedItem && (
        <PropertyPanel
          item={selectedItem}
          isTask={isTask}
          onPatch={patchItem}
          onDelete={deleteItem}
        />
      )}

      {connectFrom && (
        <div
          className="fixed left-1/2 top-20 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 font-sans text-xs font-medium text-white animate-pop-in"
          style={{ background: 'rgba(93,130,255,0.2)', border: '1px solid rgba(93,130,255,0.4)' }}
        >
          Кликните по ачивке, чтобы создать связь · Esc для отмены
        </div>
      )}

      {/* Fullscreen hint bottom-left */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (!document.fullscreenElement) wrapRef.current?.requestFullscreen?.();
          else document.exitFullscreen?.();
        }}
        className="fixed bottom-5 left-5 z-20 flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white/80 transition-colors"
        style={{ background: 'rgba(32,43,75,0.7)' }}
        title="Полный экран"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 1h4v2H3v2H1V1zm10 0h4v4h-2V3h-2V1zM1 11h2v2h2v2H1v-4zm12 2h-2v2h4v-4h-2v2z"/>
        </svg>
      </button>
    </div>
  );
};

export default Index;
