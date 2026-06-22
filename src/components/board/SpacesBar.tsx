import Icon from '@/components/ui/icon';
import { Space } from '@/types/board';

interface Props {
  spaces: Space[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const SpacesBar = ({ spaces, activeId, onSelect, onAdd }: Props) => (
  <div
    className="fixed left-4 top-[72px] z-20 flex flex-col items-center gap-2.5 rounded-[20px] p-2.5"
    style={{ background: '#1a1f30', border: '1px solid rgba(255,255,255,0.07)' }}
  >
    <div className="hide-scroll flex max-h-[300px] flex-col items-center gap-2.5 overflow-y-auto">
      {spaces.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSelect(s.id)}
            title={s.name}
            className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-all hover:scale-105"
            style={{
              background: active ? s.color : 'rgba(255,255,255,0.07)',
              color: active ? '#fff' : 'rgba(255,255,255,0.6)',
              boxShadow: active ? `0 0 0 2px #1a1f30, 0 0 0 4px ${s.color}99` : 'none',
            }}
          >
            {s.name.trim().charAt(0).toUpperCase() || '·'}
            <span
              className="pointer-events-none absolute left-[52px] whitespace-nowrap rounded-lg px-2.5 py-1.5 font-sans text-[11px] text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
              style={{ background: '#2a3152' }}
            >
              {s.name}
            </span>
          </button>
        );
      })}
    </div>

    {spaces.length > 0 && <div className="h-px w-7 bg-white/[0.08]" />}

    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onAdd}
      title="Новое пространство"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
      style={{ color: 'rgba(255,255,255,0.35)' }}
    >
      <Icon name="Plus" size={18} />
    </button>
  </div>
);

export default SpacesBar;
