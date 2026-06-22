import Icon from '@/components/ui/icon';
import {
  Achievement,
  Task,
  COLORS,
  REPEAT_LABELS,
  WEEK_DAYS,
  Repeat,
} from '@/types/board';

interface Props {
  item: Achievement | Task;
  isTask: boolean;
  onPatch: (patch: Partial<Achievement & Task>) => void;
  onDelete: () => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mt-4 block font-sans text-[11px] uppercase tracking-wide text-white/40">
    {children}
  </label>
);

const PropertyPanel = ({ item, isTask, onPatch, onDelete }: Props) => {
  const task = item as Task;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPatch({ image: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className="panel hide-scroll fixed right-6 top-24 z-30 max-h-[calc(100vh-130px)] w-72 overflow-y-auto rounded-[24px] p-5 animate-pop-in"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={isTask ? 'ListChecks' : 'Trophy'} size={16} className="text-[#5D82FF]" />
          <p className="font-display text-sm font-semibold text-white/90">
            {isTask ? 'Свойства задания' : 'Свойства ачивки'}
          </p>
        </div>
        <button onClick={onDelete} className="text-white/40 hover:text-red-400" title="Удалить">
          <Icon name="Trash2" size={16} />
        </button>
      </div>

      <Label>Название</Label>
      <input
        value={item.title}
        onChange={(e) => onPatch({ title: e.target.value })}
        className="mt-1 w-full rounded-xl bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none ring-1 ring-white/10 focus:ring-[#5D82FF]/60"
      />

      <Label>Описание</Label>
      <textarea
        value={item.description}
        onChange={(e) => onPatch({ description: e.target.value })}
        rows={3}
        className="hide-scroll mt-1 w-full resize-none rounded-xl bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none ring-1 ring-white/10 focus:ring-[#5D82FF]/60"
      />

      <Label>Цвет</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onPatch({ color: c })}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
            style={{
              background: c,
              boxShadow: item.color === c ? `0 0 0 2px #202b4b, 0 0 0 4px ${c}` : 'none',
            }}
          />
        ))}
      </div>

      <Label>Картинка</Label>
      <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/5 py-2 font-sans text-xs text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10">
        <Icon name="Upload" size={14} />
        Загрузить файл
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>

      {isTask && (
        <>
          <Label>Сложность</Label>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => onPatch({ stars: s })}
                className="text-2xl leading-none transition-transform hover:scale-110"
                style={{ color: s <= task.stars ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}
              >
                ★
              </button>
            ))}
          </div>

          <Label>Повторяемость</Label>
          <div className="mt-2 flex flex-col gap-1.5">
            {(Object.keys(REPEAT_LABELS) as Repeat[]).map((r) => (
              <button
                key={r}
                onClick={() => onPatch({ repeat: r })}
                className="rounded-xl px-3 py-2 text-left font-sans text-sm transition-colors"
                style={{
                  background: task.repeat === r ? '#5D82FF' : 'rgba(52,60,82,0.5)',
                  color: task.repeat === r ? '#0c1024' : 'rgba(255,255,255,0.8)',
                }}
              >
                {REPEAT_LABELS[r]}
              </button>
            ))}
          </div>

          {task.repeat === 'custom' && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WEEK_DAYS.map((d, i) => {
                const on = task.customDays.includes(i);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      onPatch({
                        customDays: on
                          ? task.customDays.filter((x) => x !== i)
                          : [...task.customDays, i],
                      })
                    }
                    className="h-9 w-9 rounded-lg font-sans text-xs transition-colors"
                    style={{
                      background: on ? '#5D82FF' : 'rgba(52,60,82,0.5)',
                      color: on ? '#0c1024' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}

          <Label>Активность</Label>
          <button
            onClick={() => onPatch({ active: !task.active })}
            className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 font-sans text-sm transition-colors"
            style={{
              background: task.active ? '#2DD4BF' : 'rgba(52,60,82,0.5)',
              color: task.active ? '#0c1024' : 'rgba(255,255,255,0.8)',
            }}
          >
            {task.active ? 'В процессе' : 'Не активно'}
            <Icon name={task.active ? 'Play' : 'Pause'} size={16} />
          </button>
        </>
      )}
    </div>
  );
};

export default PropertyPanel;
