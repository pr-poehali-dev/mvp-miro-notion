import Icon from '@/components/ui/icon';
import { Space } from '@/types/board';

interface Props {
  spaces: Space[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const SpacesBar = ({ spaces, activeId, onSelect, onAdd }: Props) => (
  <div className="panel fixed left-6 top-1/2 z-20 flex max-h-[440px] -translate-y-1/2 flex-col items-center gap-3 rounded-[28px] p-3">
    <div className="hide-scroll flex max-h-[372px] flex-col items-center gap-3 overflow-y-auto">
      {spaces.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSelect(s.id)}
            title={s.name}
            className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold transition-transform hover:scale-105"
            style={{
              background: active ? s.color : 'rgba(52,60,82,0.7)',
              color: active ? '#0c1024' : '#fff',
              boxShadow: active ? `0 0 0 3px #202b4b, 0 0 0 5px ${s.color}` : 'none',
            }}
          >
            {s.name.trim().charAt(0).toUpperCase() || '·'}
            <span className="pointer-events-none absolute left-[68px] whitespace-nowrap rounded-lg bg-[#343C52] px-3 py-1.5 font-sans text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {s.name}
            </span>
          </button>
        );
      })}
    </div>

    <div className="h-px w-8 bg-white/10" />

    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onAdd}
      title="Новое пространство"
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[#5D82FF] ring-1 ring-[#5D82FF]/40 transition-colors hover:bg-[#5D82FF] hover:text-[#0c1024]"
    >
      <Icon name="Plus" size={24} />
    </button>
  </div>
);

export default SpacesBar;
