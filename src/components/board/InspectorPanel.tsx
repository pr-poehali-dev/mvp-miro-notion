import Icon from '@/components/ui/icon';
import { Achievement, COLORS } from '@/types/board';

interface Props {
  node?: Achievement;
  onColor: (c: string) => void;
  onTitle: (t: string) => void;
  onImage: (url: string) => void;
}

const InspectorPanel = ({ node, onColor, onTitle, onImage }: Props) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (!node) {
    return (
      <div className="glass fixed right-6 top-24 z-20 w-64 rounded-2xl p-5">
        <p className="font-display text-sm font-semibold text-white/90">Параметры</p>
        <p className="mt-2 font-sans text-xs leading-relaxed text-white/40">
          Выберите ачивку, чтобы изменить её название, картинку и цвет.
        </p>
      </div>
    );
  }

  return (
    <div className="glass fixed right-6 top-24 z-20 w-64 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icon name="Sliders" size={16} className="text-[#2DD4BF]" />
        <p className="font-display text-sm font-semibold text-white/90">Параметры ачивки</p>
      </div>

      <label className="mt-4 block font-sans text-[11px] uppercase tracking-wide text-white/40">
        Название
      </label>
      <input
        value={node.title}
        onChange={(e) => onTitle(e.target.value)}
        className="mt-1 w-full rounded-lg bg-black/40 px-3 py-2 font-sans text-sm text-white outline-none ring-1 ring-white/10 focus:ring-[#2DD4BF]/60"
      />

      <label className="mt-4 block font-sans text-[11px] uppercase tracking-wide text-white/40">
        Цвет
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColor(c)}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
            style={{
              background: c,
              boxShadow: node.color === c ? `0 0 0 2px #0a0c10, 0 0 0 4px ${c}` : 'none',
            }}
          />
        ))}
      </div>

      <label className="mt-4 block font-sans text-[11px] uppercase tracking-wide text-white/40">
        Картинка
      </label>
      <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/5 py-2 font-sans text-xs text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10">
        <Icon name="Upload" size={14} />
        Загрузить файл
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>
    </div>
  );
};

export default InspectorPanel;
