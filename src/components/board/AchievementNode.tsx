import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Achievement } from '@/types/board';

interface Props {
  node: Achievement;
  selected: boolean;
  scale: number;
  connecting: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onStartConnect: (id: string) => void;
  onCompleteConnect: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMarkUndone: (id: string) => void;
}

export const NODE_W = 120;
export const NODE_H = 148;

type Side = 'right' | 'top' | 'bottom' | 'left';
type FillState = 'idle' | 'waiting' | 'filling-green' | 'filling-red' | 'done';

// Confetti burst
const burst = (x: number, y: number) => {
  const colors = ['#5D82FF', '#2DD4BF', '#F59E0B', '#A855F7', '#EC4899', '#84CC16', '#fff'];
  const count = 48;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;width:8px;height:8px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      background:${colors[Math.floor(Math.random() * colors.length)]};
      pointer-events:none;z-index:9999;
      transform:translate(-50%,-50%);
    `;
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 120 + Math.random() * 180;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 60;
    let px = 0, py = 0, t = 0;
    const anim = () => {
      t += 0.016;
      px += vx * 0.016;
      py += vy * 0.016 + 0.5 * 300 * 0.016 * t;
      el.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${px * 2}deg)`;
      el.style.opacity = String(Math.max(0, 1 - t * 1.2));
      if (t < 1.2) requestAnimationFrame(anim);
      else el.remove();
    };
    requestAnimationFrame(anim);
  }
};

const playDing = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* silent */
  }
};

const AchievementNode = ({
  node,
  selected,
  scale,
  connecting,
  onSelect,
  onMove,
  onStartConnect,
  onCompleteConnect,
  onMarkDone,
  onMarkUndone,
}: Props) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const holdTimerRef = useRef<number>();
  const fillRafRef = useRef<number>();
  const [side, setSide] = useState<Side>('right');
  const [hover, setHover] = useState(false);
  const [fillState, setFillState] = useState<FillState>(node.done ? 'done' : 'idle');
  const [fillProgress, setFillProgress] = useState(node.done ? 1 : 0);

  useEffect(() => {
    if (node.done && fillState === 'idle') {
      setFillState('done');
      setFillProgress(1);
    }
    if (!node.done && fillState === 'done') {
      setFillState('idle');
      setFillProgress(0);
    }
  }, [node.done]);

  const cancelFill = () => {
    clearTimeout(holdTimerRef.current);
    cancelAnimationFrame(fillRafRef.current!);
    if (fillState !== 'done') {
      setFillState('idle');
      setFillProgress(0);
    }
  };

  const startGreenFill = () => {
    setFillState('filling-green');
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setFillProgress(p);
      if (p < 1) {
        fillRafRef.current = requestAnimationFrame(animate);
      } else {
        setFillState('done');
        setFillProgress(1);
        onMarkDone(node.id);
        // Confetti at node center
        const r = wrapRef.current?.getBoundingClientRect();
        if (r) burst(r.left + r.width / 2, r.top + r.height / 2);
        playDing();
      }
    };
    fillRafRef.current = requestAnimationFrame(animate);
  };

  const startRedFill = (e: React.PointerEvent) => {
    if (!node.done) return;
    e.preventDefault();
    e.stopPropagation();
    setFillState('filling-red');
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setFillProgress(1 - p);
      if (p < 1) {
        fillRafRef.current = requestAnimationFrame(animate);
      } else {
        setFillState('idle');
        setFillProgress(0);
        onMarkUndone(node.id);
      }
    };
    fillRafRef.current = requestAnimationFrame(animate);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();

    if (e.button === 2) {
      startRedFill(e);
      return;
    }

    if (e.button !== 0) return;

    if (connecting) {
      onCompleteConnect(node.id);
      return;
    }

    onSelect(node.id);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Hold detection: 0.5s wait then fill
    if (!node.done) {
      holdTimerRef.current = window.setTimeout(() => {
        if (dragRef.current && !dragRef.current.moved) {
          startGreenFill();
        }
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
      if (fillState === 'filling-green' || fillState === 'waiting') {
        cancelFill();
      }
    }
    onMove(node.id, dragRef.current.ox + dx, dragRef.current.oy + dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearTimeout(holdTimerRef.current);
    if (fillState === 'filling-green') cancelFill();
    if (fillState === 'filling-red') cancelFill();
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const onEnter = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const m = 220;
    if (window.innerWidth - r.right > m) setSide('right');
    else if (r.top > m * 0.6) setSide('top');
    else if (window.innerHeight - r.bottom > m * 0.6) setSide('bottom');
    else setSide('left');
    setHover(true);
  };

  const tipPos: Record<Side, string> = {
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  const isDone = fillState === 'done';
  const isFillingGreen = fillState === 'filling-green';
  const isFillingRed = fillState === 'filling-red';

  const fillColor = isFillingRed ? 'rgba(239,68,68,0.45)' : 'rgba(34,197,94,0.45)';
  const fillGradient = isFillingRed
    ? `linear-gradient(to bottom, rgba(239,68,68,0.55) ${fillProgress * 100}%, transparent ${fillProgress * 100}%)`
    : `linear-gradient(to top, rgba(34,197,94,0.55) ${fillProgress * 100}%, transparent ${fillProgress * 100}%)`;

  void fillColor;

  return (
    <div
      ref={wrapRef}
      className="absolute no-select"
      style={{ left: node.x, top: node.y, width: NODE_W, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={onEnter}
      onMouseLeave={() => setHover(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Card */}
      <div
        className="group relative overflow-hidden rounded-[18px]"
        style={{
          background: '#1a1f30',
          border: `2px solid ${selected ? node.color : isDone ? node.color + '88' : node.color + '44'}`,
          boxShadow: selected
            ? `0 0 0 3px ${node.color}22, 0 12px 36px -8px ${node.color}66`
            : isDone
            ? `0 0 16px -4px ${node.color}66`
            : '0 6px 20px -8px rgba(0,0,0,0.8)',
          cursor: connecting ? 'crosshair' : 'grab',
          transition: 'border-color 0.2s, box-shadow 0.3s',
        }}
      >
        {/* Image — square, object-cover */}
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={node.image}
            alt={node.title}
            draggable={false}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${(node.cropX ?? 50)}% ${(node.cropY ?? 50)}%`,
              transform: `scale(${node.cropScale ?? 1})`,
              transformOrigin: `${node.cropX ?? 50}% ${node.cropY ?? 50}%`,
            }}
          />

          {/* Fill overlay */}
          {(isFillingGreen || isFillingRed || isDone) && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: isDone
                  ? 'rgba(34,197,94,0.28)'
                  : fillGradient,
                transition: isDone ? 'background 0.3s' : 'none',
              }}
            />
          )}

          {/* Done checkmark */}
          {isDone && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(34,197,94,0.9)' }}
              >
                <Icon name="Check" size={22} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Connect button */}
        {!connecting && (
          <button
            onPointerDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white/80 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: node.color + 'cc' }}
            title="Создать связь"
          >
            <Icon name="Link2" size={12} />
          </button>
        )}
      </div>

      {/* Title below card */}
      <div className="mt-1.5 text-center">
        <p
          className="truncate font-sans text-[12px] font-medium leading-snug"
          style={{ color: node.color }}
        >
          {node.title}
        </p>
      </div>

      {/* Tooltip */}
      {hover && node.description && (
        <div
          className={`pointer-events-none absolute z-30 w-[180px] rounded-[12px] px-2.5 py-2 ${tipPos[side]}`}
          style={{ background: '#343C52', border: `1px solid ${node.color}88` }}
        >
          <p className="break-words font-sans text-[11px] leading-snug text-white/85">
            {node.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementNode;
