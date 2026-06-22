import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Task, REPEAT_LABELS } from '@/types/board';

interface Props {
  node: Task;
  selected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onToggleDone: (id: string) => void;
}

export const TASK_W = 168;
export const TASK_H = 232;

type Side = 'right' | 'top' | 'bottom' | 'left';

const PERIM = (168 + 220) * 2;

const TaskNode = ({ node, selected, scale, onSelect, onMove, onToggleDone }: Props) => {
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<Side>('right');
  const [hover, setHover] = useState(false);
  const [justDone, setJustDone] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(node.id);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.sx) / scale;
    const dy = (e.clientY - dragRef.current.sy) / scale;
    onMove(node.id, dragRef.current.ox + dx, dragRef.current.oy + dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const onEnter = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const m = 280;
    if (window.innerWidth - r.right > m) setSide('right');
    else if (r.top > m * 0.6) setSide('top');
    else if (window.innerHeight - r.bottom > m * 0.6) setSide('bottom');
    else setSide('left');
    setHover(true);
  };

  const handleCheck = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!node.done) setJustDone(true);
    onToggleDone(node.id);
  };

  const tipPos: Record<Side, string> = {
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  const filled = node.done;
  const animate = filled && justDone;

  return (
    <div
      ref={wrapRef}
      className="absolute no-select"
      style={{ left: node.x, top: node.y, width: TASK_W, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={onEnter}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="group relative animate-pop-in rounded-[24px] p-2.5"
        style={{
          background: '#1E2740',
          border: `3px solid ${filled ? 'transparent' : node.color + '55'}`,
          boxShadow: selected
            ? `0 0 0 4px ${node.color}33, 0 16px 44px -10px ${node.color}99`
            : '0 10px 30px -12px rgba(0,0,0,0.7)',
          cursor: 'grab',
        }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
          <rect
            x="1.5"
            y="1.5"
            width="calc(100% - 3px)"
            height="calc(100% - 3px)"
            rx="22"
            fill="none"
            stroke={node.color}
            strokeWidth="3"
            strokeDasharray={PERIM}
            strokeDashoffset={filled ? 0 : PERIM}
            style={
              animate
                ? { animation: `frame-draw 1.8s linear forwards` }
                : undefined
            }
          />
        </svg>

        <div
          className="aspect-square w-full overflow-hidden rounded-[16px]"
          style={{ background: `linear-gradient(135deg, ${node.color}33, ${node.color}08)` }}
        >
          <img
            src={node.image}
            alt={node.title}
            draggable={false}
            className="h-full w-full object-cover"
          />
        </div>

        <button
          onPointerDown={handleCheck}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#0c1024] transition-transform hover:scale-110"
          style={{ background: filled ? node.color : '#343C52', color: filled ? '#0c1024' : '#fff' }}
          title="Выполнить задание"
        >
          <Icon name="Check" size={16} />
        </button>
      </div>

      <div
        className="mt-2 rounded-[14px] px-2 py-1.5 text-center"
        style={{ background: '#202B4B', border: `1px solid ${node.color}55` }}
      >
        <p className="truncate font-display text-sm font-semibold text-white">{node.title}</p>
        <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-[#F59E0B]">
          {'★'.repeat(node.stars)}
          <span className="text-white/40">{REPEAT_LABELS[node.repeat]}</span>
        </div>
      </div>

      {hover && node.description && (
        <div
          className={`pointer-events-none absolute z-30 w-[200px] rounded-[16px] px-3 py-2 ${tipPos[side]}`}
          style={{ background: '#343C52', border: `1px solid ${node.color}` }}
        >
          <p className="break-words font-sans text-xs leading-snug text-white/90">
            {node.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskNode;
