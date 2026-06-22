import Icon from '@/components/ui/icon';

interface Props {
  scale: number;
  onZoom: (dir: number) => void;
  onExport: () => void;
  onSave: () => void;
  saved: boolean;
  historyCount: number;
  onHistory: () => void;
}

const TopBar = ({ scale, onZoom, onExport, onSave, saved, historyCount, onHistory }: Props) => (
  <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2DD4BF] text-black">
        <Icon name="Trophy" size={16} />
      </div>
      <div>
        <p className="font-display text-sm font-semibold leading-none text-white">AchieveBoard</p>
        <p className="mt-0.5 font-sans text-[11px] text-white/40">Мой проект достижений</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <div className="glass flex items-center gap-1 rounded-2xl p-1.5">
        <button
          onClick={() => onZoom(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
        >
          <Icon name="Minus" size={16} />
        </button>
        <span className="w-12 text-center font-sans text-xs text-white/70">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => onZoom(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
        >
          <Icon name="Plus" size={16} />
        </button>
      </div>

      <button
        onClick={onHistory}
        className="glass relative flex h-11 items-center gap-2 rounded-2xl px-4 font-sans text-sm text-white/80 hover:text-white"
      >
        <Icon name="History" size={16} />
        История
        {historyCount > 0 && (
          <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{historyCount}</span>
        )}
      </button>

      <button
        onClick={onExport}
        className="glass flex h-11 items-center gap-2 rounded-2xl px-4 font-sans text-sm text-white/80 hover:text-white"
      >
        <Icon name="Download" size={16} />
        Экспорт
      </button>

      <button
        onClick={onSave}
        className="flex h-11 items-center gap-2 rounded-2xl bg-[#2DD4BF] px-5 font-display text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
      >
        <Icon name={saved ? 'Check' : 'Save'} size={16} />
        {saved ? 'Сохранено' : 'Сохранить'}
      </button>
    </div>
  </div>
);

export default TopBar;
