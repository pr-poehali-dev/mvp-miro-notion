import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Achievement } from '@/types/board';

export const NODE_W = 120;
export const NODE_H = 148;

type AnchorKey = 'top' | 'right' | 'bottom' | 'left';
type FillState = 'idle' | 'filling-green' | 'filling-red' | 'done';

interface Props {
  node: Achievement;
  selected: boolean;
  locked: boolean;
  scale: number;
  connecting: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onStartConnect: (id: string, anchor: AnchorKey) => void;
  onCompleteConnect: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMarkUndone: (id: string) => void;
}

// ── audio ─────────────────────────────────────────────────────────────────
const playDing = () => {
  try {
    const ctx = new AudioContext();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(880, ctx.currentTime);
    o1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    o1.connect(g);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    o1.start(); o1.stop(ctx.currentTime + 0.55);
  } catch { /* silent */ }
};

const playCancel = () => {
  try {
    const ctx = new AudioContext();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(320, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.35);
    o.connect(g);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    o.start(); o.stop(ctx.currentTime + 0.45);
  } catch { /* silent */ }
};

// ── confetti ──────────────────────────────────────────────────────────────
const burst = (x: number, y: number) => {
  const colors = ['#5D82FF', '#2DD4BF', '#F59E0B', '#A855F7', '#EC4899', '#84CC16', '#fff'];
  for (let i = 0; i < 48; i++) {
    const el = document.createElement('div');
    const c = colors[Math.floor(Math.random() * colors.length)];
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:7px;height:7px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};background:${c};
      pointer-events:none;z-index:9999;transform:translate(-50%,-50%)`;
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i) / 48 + (Math.random() - 0.5) * 0.5;
    const spd = 100 + Math.random() * 200;
    const vx = Math.cos(angle) * spd, vy = Math.sin(angle) * spd - 60;
    let px = 0, py = 0, t = 0;
    const anim = () => {
      t += 0.016; px += vx * 0.016; py += vy * 0.016 + 150 * 0.016 * t;
      el.style.transform = `translate(calc(-50% + ${px}px),calc(-50% + ${py}px)) rotate(${px * 2}deg)`;
      el.style.opacity = String(Math.max(0, 1 - t * 1.1));
      if (t < 1.3) { requestAnimationFrame(anim); } else { el.remove(); }
    };
    requestAnimationFrame(anim);
  }
};

// ── component ────────────────────────────────────────────────────────────
const AchievementNode = ({
  node, selected, locked, scale, connecting,
  onSelect, onMove, onStartConnect, onCompleteConnect,
  onMarkDone, onMarkUndone,
}: Props) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const holdTimerRef = useRef<number>();
  const fillRafRef = useRef<number>();
  const shakeRafRef = useRef<number>();

  const [fillState, setFillState] = useState<FillState>(node.done ? 'done' : 'idle');
  const [fillProgress, setFillProgress] = useState(node.done ? 1 : 0);
  const [shake, setShake] = useState(0); // px offset for shake
  const [connHover, setConnHover] = useState(false); // show connector dots

  // Sync done state from outside
  useEffect(() => {
    if (node.done && fillState === 'idle') { setFillState('done'); setFillProgress(1); }
    if (!node.done && fillState === 'done') { setFillState('idle'); setFillProgress(0); }
  }, [node.done]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopShake = () => { cancelAnimationFrame(shakeRafRef.current!); setShake(0); };

  const startShake = () => {
    const start = performance.now();
    const go = (now: number) => {
      const t = now - start;
      setShake(Math.sin(t * 0.05) * 4 * Math.max(0, 1 - t / 1800));
      shakeRafRef.current = requestAnimationFrame(go);
    };
    shakeRafRef.current = requestAnimationFrame(go);
  };

  const cancelFill = (toDone = false) => {
    clearTimeout(holdTimerRef.current);
    cancelAnimationFrame(fillRafRef.current!);
    stopShake();
    if (!toDone) { setFillState('idle'); setFillProgress(0); }
  };

  const startGreenFill = () => {
    if (locked) return;
    setFillState('filling-green');
    startShake();
    const dur = 1500, t0 = performance.now();
    const go = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setFillProgress(p);
      if (p < 1) { fillRafRef.current = requestAnimationFrame(go); }
      else {
        stopShake();
        setFillState('done'); setFillProgress(1);
        onMarkDone(node.id);
        const r = wrapRef.current?.getBoundingClientRect();
        if (r) burst(r.left + r.width / 2, r.top + r.height / 2);
        playDing();
      }
    };
    fillRafRef.current = requestAnimationFrame(go);
  };

  const startRedFill = (e: React.PointerEvent) => {
    if (!node.done) return;
    e.preventDefault(); e.stopPropagation();
    setFillState('filling-red');
    startShake();
    playCancel();
    const dur = 1000, t0 = performance.now();
    const go = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setFillProgress(1 - p);
      if (p < 1) { fillRafRef.current = requestAnimationFrame(go); }
      else {
        stopShake();
        setFillState('idle'); setFillProgress(0);
        onMarkUndone(node.id);
      }
    };
    fillRafRef.current = requestAnimationFrame(go);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button === 2) { startRedFill(e); return; }
    if (e.button !== 0) return;
    if (connecting) { onCompleteConnect(node.id); return; }
    onSelect(node.id);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (!node.done && !locked) {
      holdTimerRef.current = window.setTimeout(() => {
        if (dragRef.current && !dragRef.current.moved) startGreenFill();
      }, 500);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.sx) / scale;
    const dy = (e.clientY - dragRef.current.sy) / scale;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
      clearTimeout(holdTimerRef.current);
      if (fillState === 'filling-green') cancelFill();
    }
    onMove(node.id, dragRef.current.ox + dx, dragRef.current.oy + dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearTimeout(holdTimerRef.current);
    if (fillState === 'filling-green' || fillState === 'filling-red') cancelFill(fillState === 'done');
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const isDone = fillState === 'done';
  const isFillingGreen = fillState === 'filling-green';
  const isFillingRed = fillState === 'filling-red';

  // Boss styling
  const isBoss = !!node.isBoss;
  const borderColor = isBoss
    ? selected ? '#dc2626' : isDone ? '#991b1b' : '#7f1d1d'
    : selected ? node.color : isDone ? node.color + '99' : node.color + '55';
  const glowShadow = isBoss
    ? `0 0 0 3px #dc262622, 0 12px 36px -8px #dc262699`
    : `0 0 0 3px ${node.color}22, 0 12px 36px -8px ${node.color}66`;

  // Connector dot positions (relative to card top-left)
  const DOTS: Record<AnchorKey, { top: string; left: string }> = {
    top:    { top: '-6px',      left: '50%' },
    right:  { top: '50%',      left: 'calc(100% + 2px)' },
    bottom: { top: '100%',     left: '50%' },
    left:   { top: '50%',      left: '-8px' },
  };

  return (
    <div
      ref={wrapRef}
      className="absolute no-select"
      style={{
        left: node.x + shake,
        top: node.y,
        width: NODE_W,
        touchAction: 'none',
        transition: shake === 0 ? 'left 0.05s' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setConnHover(true)}
      onMouseLeave={() => setConnHover(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[18px]"
        style={{
          background: isBoss ? '#1a0a0a' : '#1a1f30',
          border: `2px solid ${borderColor}`,
          boxShadow: selected ? glowShadow : isDone ? `0 0 14px -4px ${isBoss ? '#dc262688' : node.color + '66'}` : '0 6px 20px -8px rgba(0,0,0,0.8)',
          cursor: connecting ? 'crosshair' : 'grab',
          transition: 'border-color 0.25s, box-shadow 0.25s',
          opacity: locked ? 0.38 : 1,
          filter: locked ? 'grayscale(0.6) brightness(0.7)' : 'none',
        }}
      >
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={node.image}
            alt={node.title}
            draggable={false}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${node.cropX ?? 50}% ${node.cropY ?? 50}%`,
              transform: `scale(${node.cropScale ?? 1})`,
              transformOrigin: `${node.cropX ?? 50}% ${node.cropY ?? 50}%`,
            }}
          />

          {/* Boss red vignette overlay */}
          {isBoss && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(127,29,29,0.55) 100%)' }}
            />
          )}

          {/* Green fill (bottom→top) */}
          {isFillingGreen && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `linear-gradient(to top, rgba(34,197,94,0.6) ${fillProgress * 100}%, transparent ${fillProgress * 100}%)` }}
            />
          )}
          {/* Red fill (top→bottom) */}
          {isFillingRed && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `linear-gradient(to bottom, rgba(239,68,68,0.6) ${fillProgress > 0 ? (1 - fillProgress) * 100 : 0}%, transparent ${fillProgress > 0 ? (1 - fillProgress) * 100 : 0}%)` }}
            />
          )}
          {/* Done overlay */}
          {isDone && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ background: isBoss ? 'rgba(127,29,29,0.25)' : 'rgba(34,197,94,0.22)' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: isBoss ? 'rgba(220,38,38,0.85)' : 'rgba(34,197,94,0.9)' }}>
                <Icon name="Check" size={20} className="text-white" />
              </div>
            </div>
          )}

          {/* Locked overlay */}
          {locked && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.45)' }}>
              <Icon name="Lock" size={22} className="text-white/60" />
            </div>
          )}
        </div>

        {/* 4 connector dots — visible only when connecting mode + hover */}
        {connecting && connHover && !locked &&
          (Object.keys(DOTS) as AnchorKey[]).map((anchor) => (
            <button
              key={anchor}
              onPointerDown={(e) => { e.stopPropagation(); onStartConnect(node.id, anchor); }}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity"
              style={{
                ...DOTS[anchor],
                width: 12, height: 12,
                background: '#fff',
                boxShadow: '0 0 0 2px rgba(93,130,255,0.7), 0 2px 6px rgba(0,0,0,0.5)',
                opacity: connHover ? 1 : 0,
                transition: 'opacity 0.18s ease',
              }}
            />
          ))}
      </div>

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div className="mt-1.5 text-center">
        <p
          className="truncate font-sans text-[12px] font-medium leading-snug"
          style={
            isBoss
              ? { color: '#fbbf24', textShadow: '0 0 8px #f59e0b, 0 0 20px #f59e0b88' }
              : { color: node.color }
          }
        >
          {isBoss ? '☠ ' : ''}{node.title}
        </p>
      </div>

      {/* ── Tooltip (description) ─────────────────────────────────────── */}
      {connHover && node.description && !connecting && (
        <div
          className="pointer-events-none absolute left-full top-1/2 z-30 ml-2 -translate-y-1/2 w-[190px] rounded-[12px] px-2.5 py-2"
          style={{
            background: isBoss ? '#1a0505' : '#2a2f44',
            border: `1px solid ${isBoss ? '#7f1d1d' : node.color + '66'}`,
            boxShadow: isBoss ? '0 0 16px -4px #dc262644' : 'none',
          }}
        >
          <p className="break-words font-sans text-[11px] leading-snug"
            style={{ color: isBoss ? '#fca5a5' : 'rgba(255,255,255,0.85)' }}>
            {node.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementNode;