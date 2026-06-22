import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Achievement } from '@/types/board';

interface Props {
  node: Achievement;
  selected: boolean;
  scale: number;
  connecting: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onMove: (id: string, x: number, y: number) => void;
  onStartConnect: (id: string) => void;
  onCompleteConnect: (id: string) => void;
  onEditTitle: (id: string, title: string) => void;
}

const NODE_W = 180;

const AchievementNode = ({
  node,
  selected,
  scale,
  connecting,
  onSelect,
  onMove,
  onStartConnect,
  onCompleteConnect,
  onEditTitle,
}: Props) => {
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [editing, setEditing] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    e.stopPropagation();
    if (connecting) {
      onCompleteConnect(node.id);
      return;
    }
    onSelect(node.id, e.shiftKey);
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

  return (
    <div
      className="absolute no-select animate-pop-in"
      style={{ left: node.x, top: node.y, width: NODE_W, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="group relative rounded-2xl p-3 transition-shadow"
        style={{
          background: 'rgba(18,22,30,0.9)',
          border: `2px solid ${selected ? node.color : 'rgba(255,255,255,0.08)'}`,
          boxShadow: selected
            ? `0 0 0 4px ${node.color}22, 0 12px 40px -8px ${node.color}88`
            : '0 8px 24px -10px rgba(0,0,0,0.6)',
          cursor: connecting ? 'crosshair' : 'grab',
        }}
      >
        <div
          className="aspect-square w-full overflow-hidden rounded-xl"
          style={{ background: `linear-gradient(135deg, ${node.color}22, ${node.color}05)` }}
        >
          <img
            src={node.image}
            alt={node.title}
            draggable={false}
            className="h-full w-full object-cover"
          />
        </div>

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartConnect(node.id);
          }}
          className="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-black opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: node.color }}
          title="Создать связь"
        >
          <Icon name="Link2" size={14} />
        </button>
      </div>

      {editing ? (
        <input
          autoFocus
          defaultValue={node.title}
          onBlur={(e) => {
            onEditTitle(node.id, e.target.value || 'Без названия');
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 w-full rounded-lg bg-black/60 px-2 py-1 text-center font-sans text-sm text-white outline-none ring-1 ring-white/20"
        />
      ) : (
        <p
          onDoubleClick={() => setEditing(true)}
          className="mt-2 text-center font-display text-sm font-medium text-white/90"
        >
          {node.title}
        </p>
      )}
    </div>
  );
};

export default AchievementNode;
