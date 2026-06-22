import { useEffect, useRef, useState } from 'react';
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

  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const setCamera = (patch: Partial<typeof camera>) =>
    setState((s) => ({ ...s, camera: { ...s.camera, ...patch } }));

  const updateSpace = (fn: (sp: Space) => Space) =>
    setState((s) => ({
      ...s,
      spaces: s.spaces.map((sp) => (sp.id === activeSpaceId ? fn(sp) : sp)),
    }));

  const addItem = () => {
    const cx = (-camera.x + window.innerWidth / 2) / camera.scale - NODE_W / 2;
    const cy = (-camera.y + window.innerHeight / 2) / camera.scale - NODE_H / 2;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const image = DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
    const id = uid();
    if (isTask) {
      const t: Task = {
        id,
        x: cx,
        y: cy,
        title: 'Новое задание',
        description: '',
        image,
        color,
        stars: 1,
        repeat: 'once',
        customDays: [],
        active: false,
        done: false,
      };
      updateSpace((sp) => ({ ...sp, tasks: [...sp.tasks, t] }));
    } else {
      const a: Achievement = {
        id,
        x: cx,
        y: cy,
        title: 'Новая ачивка',
        description: '',
        image,
        color,
      };
      updateSpace((sp) => ({ ...sp, achievements: [...sp.achievements, a] }));
    }
    setSelectedId(id);
  };

  const patchItem = (patch: Partial<Achievement & Task>) => {
    if (!selectedId) return;
    updateSpace((sp) =>
      isTask
        ? { ...sp, tasks: sp.tasks.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)) }
        : {
            ...sp,
            achievements: sp.achievements.map((a) =>
              a.id === selectedId ? { ...a, ...patch } : a,
            ),
          },
    );
  };

  const moveItem = (id: string, x: number, y: number) => {
    updateSpace((sp) =>
      isTask
        ? { ...sp, tasks: sp.tasks.map((t) => (t.id === id ? { ...t, x, y } : t)) }
        : { ...sp, achievements: sp.achievements.map((a) => (a.id === id ? { ...a, x, y } : a)) },
    );
  };

  const deleteItem = () => {
    if (!selectedId) return;
    updateSpace((sp) =>
      isTask
        ? { ...sp, tasks: sp.tasks.filter((t) => t.id !== selectedId) }
        : {
            ...sp,
            achievements: sp.achievements.filter((a) => a.id !== selectedId),
            connections: sp.connections.filter(
              (c) => c.from !== selectedId && c.to !== selectedId,
            ),
          },
    );
    setSelectedId(null);
  };

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

  const onWheel = (e: React.WheelEvent) => {
    setCamera({ scale: Math.min(2.5, Math.max(0.3, camera.scale - e.deltaY * 0.0018)) });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const onBg = e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg;
    if (e.button === 2) {
      panRef.current = { sx: e.clientX, sy: e.clientY, ox: camera.x, oy: camera.y };
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

  const onPointerUp = () => {
    panRef.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteItem();
      if (e.key === 'Escape') {
        setConnectFrom(null);
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const center = (n: { x: number; y: number }) => ({ x: n.x + NODE_W / 2, y: n.y + 90 });
  const path = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = Math.abs(b.x - a.x) * 0.5 + 30;
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
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
        backgroundSize: `${24 * camera.scale}px ${24 * camera.scale}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
        cursor: panRef.current ? 'grabbing' : 'default',
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div data-bg="1" className="absolute inset-0" />

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}
      >
        {!isTask && (
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" fill="#5D82FF" />
              </marker>
            </defs>
            {space.connections.map((c: Connection) => {
              const a = space.achievements.find((n) => n.id === c.from);
              const b = space.achievements.find((n) => n.id === c.to);
              if (!a || !b) return null;
              return (
                <path
                  key={c.id}
                  d={path(center(a), center(b))}
                  fill="none"
                  stroke="#5D82FF"
                  strokeWidth={2.5}
                  strokeOpacity={0.55}
                  markerEnd="url(#arrow)"
                />
              );
            })}
            {fromNode && (
              <path
                d={path(center(fromNode), mouse)}
                fill="none"
                stroke="#5D82FF"
                strokeWidth={2.5}
                strokeDasharray="8 8"
                className="flow-line"
              />
            )}
          </svg>
        )}

        {!isTask &&
          space.achievements.map((n) => (
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
            />
          ))}

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

      <ModeSwitch mode={mode} onChange={(m) => setState((s) => ({ ...s, mode: m }))} />

      <SpacesBar
        spaces={spaces}
        activeId={activeSpaceId}
        onSelect={(id) => {
          setState((s) => ({ ...s, activeSpaceId: id }));
          setSelectedId(null);
        }}
        onAdd={addSpace}
      />

      {isTask && <ActiveTasksPanel tasks={space.tasks} />}

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
        <div className="panel fixed left-1/2 top-24 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 font-sans text-xs font-medium text-white animate-pop-in">
          Кликните по ачивке, чтобы создать связь · Esc для отмены
        </div>
      )}
    </div>
  );
};

export default Index;
