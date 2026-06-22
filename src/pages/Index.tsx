import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import AchievementNode from '@/components/board/AchievementNode';
import Toolbar from '@/components/board/Toolbar';
import InspectorPanel from '@/components/board/InspectorPanel';
import TopBar from '@/components/board/TopBar';
import { Achievement, Connection, COLORS, DEFAULT_IMAGES } from '@/types/board';

const NODE_W = 180;
const NODE_H = 232;

const uid = () => Math.random().toString(36).slice(2, 9);

const initialNodes: Achievement[] = [
  { id: 'a1', x: 200, y: 220, title: 'Первый запуск', image: DEFAULT_IMAGES[1], color: '#2DD4BF' },
  { id: 'a2', x: 560, y: 400, title: 'Первая победа', image: DEFAULT_IMAGES[0], color: '#F59E0B' },
];

const Index = () => {
  const [nodes, setNodes] = useState<Achievement[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>([
    { id: 'c1', from: 'a1', to: 'a2' },
  ]);
  const [selected, setSelected] = useState<string[]>([]);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [saved, setSaved] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const touch = () => setSaved(false);

  const addNode = useCallback(() => {
    const id = uid();
    const cx = (-pan.x + window.innerWidth / 2) / scale - NODE_W / 2;
    const cy = (-pan.y + window.innerHeight / 2) / scale - NODE_H / 2;
    setNodes((n) => [
      ...n,
      {
        id,
        x: cx,
        y: cy,
        title: 'Новая ачивка',
        image: DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      },
    ]);
    setSelected([id]);
    touch();
  }, [pan, scale]);

  const deleteSelected = useCallback(() => {
    if (!selected.length) return;
    setNodes((n) => n.filter((x) => !selected.includes(x.id)));
    setConnections((c) => c.filter((x) => !selected.includes(x.from) && !selected.includes(x.to)));
    setSelected([]);
    touch();
  }, [selected]);

  const moveNode = (id: string, x: number, y: number) => {
    setNodes((n) => n.map((node) => (node.id === id ? { ...node, x, y } : node)));
    touch();
  };

  const updateNode = (id: string, patch: Partial<Achievement>) => {
    setNodes((n) => n.map((node) => (node.id === id ? { ...node, ...patch } : node)));
    touch();
  };

  const selectNode = (id: string, additive: boolean) => {
    setSelected((s) => (additive ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]));
  };

  const startConnect = (id: string) => {
    setConnectFrom(id);
  };

  const completeConnect = (id: string) => {
    if (connectFrom && connectFrom !== id) {
      setConnections((c) =>
        c.some((x) => x.from === connectFrom && x.to === id)
          ? c
          : [...c, { id: uid(), from: connectFrom, to: id }],
      );
      touch();
    }
    setConnectFrom(null);
  };

  const zoom = (dir: number) => setScale((s) => Math.min(2.5, Math.max(0.3, s + dir * 0.15)));

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale((s) => Math.min(2.5, Math.max(0.3, s - e.deltaY * 0.002)));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.bg) return;
    setSelected([]);
    setConnectFrom(null);
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) {
      setMouse({
        x: (e.clientX - rect.left - pan.x) / scale,
        y: (e.clientY - rect.top - pan.y) / scale,
      });
    }
    if (panRef.current) {
      setPan({
        x: panRef.current.ox + (e.clientX - panRef.current.sx),
        y: panRef.current.oy + (e.clientY - panRef.current.sy),
      });
    }
  };

  const onCanvasPointerUp = () => {
    panRef.current = null;
  };

  const doSave = () => {
    setSaved(true);
    setHistory((h) => [`Версия ${h.length + 1} · ${new Date().toLocaleTimeString('ru')}`, ...h]);
  };

  const doExport = () => {
    const data = JSON.stringify({ achievements: nodes, connections }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'achieve-board.json';
    a.click();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if (e.key === 'n' || e.key === 'т') addNode();
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        doSave();
      }
      if (e.key === '?') setShowKeys((v) => !v);
      if (e.key === 'Escape') {
        setConnectFrom(null);
        setSelected([]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addNode, deleteSelected]);

  const center = (n: Achievement) => ({ x: n.x + NODE_W / 2, y: n.y + 90 });
  const path = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = Math.abs(b.x - a.x) * 0.5 + 30;
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  const activeNode = selected.length === 1 ? nodes.find((n) => n.id === selected[0]) : undefined;
  const fromNode = connectFrom ? nodes.find((n) => n.id === connectFrom) : undefined;

  return (
    <div
      ref={wrapRef}
      className="canvas-grid relative h-screen w-screen overflow-hidden"
      style={{
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        cursor: panRef.current ? 'grabbing' : 'default',
      }}
      onWheel={onWheel}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
    >
      <div data-bg="1" className="absolute inset-0" />

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        <svg
          className="pointer-events-none absolute overflow-visible"
          style={{ width: 1, height: 1 }}
        >
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#2DD4BF" />
            </marker>
          </defs>
          {connections.map((c) => {
            const a = nodes.find((n) => n.id === c.from);
            const b = nodes.find((n) => n.id === c.to);
            if (!a || !b) return null;
            return (
              <path
                key={c.id}
                d={path(center(a), center(b))}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth={2.5}
                strokeOpacity={0.7}
                markerEnd="url(#arrow)"
              />
            );
          })}
          {fromNode && (
            <path
              d={path(center(fromNode), mouse)}
              fill="none"
              stroke="#2DD4BF"
              strokeWidth={2.5}
              strokeDasharray="8 8"
              className="flow-line"
            />
          )}
        </svg>

        {nodes.map((n) => (
          <AchievementNode
            key={n.id}
            node={n}
            selected={selected.includes(n.id)}
            scale={scale}
            connecting={!!connectFrom}
            onSelect={selectNode}
            onMove={moveNode}
            onStartConnect={startConnect}
            onCompleteConnect={completeConnect}
            onEditTitle={(id, title) => updateNode(id, { title })}
          />
        ))}
      </div>

      <TopBar
        scale={scale}
        onZoom={zoom}
        onExport={doExport}
        onSave={doSave}
        saved={saved}
        historyCount={history.length}
        onHistory={() => setShowHistory((v) => !v)}
      />

      <Toolbar
        onAdd={addNode}
        onDelete={deleteSelected}
        connecting={!!connectFrom}
        onToggleConnect={() => setConnectFrom(connectFrom ? null : selected[0] || nodes[0]?.id || null)}
        hasSelection={selected.length > 0}
      />

      <InspectorPanel
        node={activeNode}
        onColor={(c) => activeNode && updateNode(activeNode.id, { color: c })}
        onTitle={(t) => activeNode && updateNode(activeNode.id, { title: t })}
        onImage={(url) => activeNode && updateNode(activeNode.id, { image: url })}
      />

      {showHistory && (
        <div className="glass fixed bottom-24 right-6 z-20 w-64 rounded-2xl p-4 animate-pop-in">
          <p className="mb-3 font-display text-sm font-semibold text-white/90">История версий</p>
          {history.length === 0 ? (
            <p className="font-sans text-xs text-white/40">Сохраните проект, чтобы создать версию.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <Icon name="GitCommitHorizontal" size={14} className="text-[#2DD4BF]" />
                  <span className="font-sans text-xs text-white/70">{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setShowKeys((v) => !v)}
        className="glass fixed bottom-6 right-6 z-20 flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 hover:text-white"
        title="Горячие клавиши"
      >
        <Icon name="Keyboard" size={18} />
      </button>

      {showKeys && (
        <div className="glass fixed bottom-20 right-6 z-30 w-60 rounded-2xl p-4 animate-pop-in">
          <p className="mb-3 font-display text-sm font-semibold text-white/90">Горячие клавиши</p>
          {[
            ['N', 'Новая ачивка'],
            ['Del', 'Удалить'],
            ['⌘/Ctrl + S', 'Сохранить'],
            ['Esc', 'Снять выделение'],
            ['Ctrl + колесо', 'Масштаб'],
            ['Двойной клик', 'Изменить название'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1">
              <span className="font-sans text-xs text-white/60">{v}</span>
              <kbd className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/80">
                {k}
              </kbd>
            </div>
          ))}
        </div>
      )}

      {connectFrom && (
        <div className="fixed left-1/2 top-20 z-20 -translate-x-1/2 rounded-full bg-[#2DD4BF] px-4 py-1.5 font-sans text-xs font-medium text-black animate-pop-in">
          Кликните по ачивке, чтобы создать связь · Esc для отмены
        </div>
      )}
    </div>
  );
};

export default Index;
