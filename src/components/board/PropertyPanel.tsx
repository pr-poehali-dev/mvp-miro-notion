import { useState } from 'react';
import Icon from '@/components/ui/icon';
import CropModal from '@/components/board/CropModal';
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
  <label className="mt-4 block font-sans text-[11px] uppercase tracking-wider text-white/35">
    {children}
  </label>
);

const PropertyPanel = ({ item, isTask, onPatch, onDelete }: Props) => {
  const task = item as Task;
  const ach = item as Achievement;
  const [showCrop, setShowCrop] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPatch({ image: reader.result as string, cropX: 50, cropY: 50, cropScale: 1 });
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        className="hide-scroll fixed right-5 top-[72px] z-30 max-h-[calc(100vh-90px)] w-64 overflow-y-auto rounded-[20px] p-4 animate-pop-in"
        style={{ background: '#1e2540', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.7)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-white/90">
            {isTask ? 'Задание' : 'Ачивка'}
          </p>
          <button onClick={onDelete} className="text-white/30 hover:text-red-400 transition-colors" title="Удалить">
            <Icon name="Trash2" size={15} />
          </button>
        </div>

        <Label>Название</Label>
        <input
          value={item.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className="mt-1 w-full rounded-xl bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none ring-1 ring-white/10 focus:ring-[#5D82FF]/50"
        />

        <Label>Описание</Label>
        <textarea
          value={item.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          rows={2}
          className="hide-scroll mt-1 w-full resize-none rounded-xl bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none ring-1 ring-white/10 focus:ring-[#5D82FF]/50"
        />

        <Label>Цвет рамки и текста</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onPatch({ color: c })}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110"
              style={{
                background: c,
                boxShadow: item.color === c ? `0 0 0 2px #1e2540, 0 0 0 4px ${c}` : 'none',
              }}
            />
          ))}
        </div>

        <Label>Картинка</Label>
        <div className="mt-2 flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 font-sans text-xs text-white/75 ring-1 ring-white/10 hover:bg-white/10 transition-colors">
            <Icon name="Upload" size={13} />
            Загрузить
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {!isTask && item.image && (
            <button
              onClick={() => setShowCrop(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 font-sans text-xs text-white/75 ring-1 ring-white/10 hover:bg-white/10 transition-colors"
              title="Кадрировать"
            >
              <Icon name="Crop" size={13} />
              Кадр
            </button>
          )}
        </div>

        {/* Image preview */}
        {item.image && (
          <div className="mt-2 overflow-hidden rounded-xl" style={{ height: 80 }}>
            <img
              src={item.image}
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${ach.cropX ?? 50}% ${ach.cropY ?? 50}%`,
                transform: `scale(${ach.cropScale ?? 1})`,
                transformOrigin: `${ach.cropX ?? 50}% ${ach.cropY ?? 50}%`,
              }}
            />
          </div>
        )}

        {isTask && (
          <>
            <Label>Сложность</Label>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onPatch({ stars: s })}
                  className="text-xl leading-none transition-transform hover:scale-110"
                  style={{ color: s <= task.stars ? '#F59E0B' : 'rgba(255,255,255,0.18)' }}
                >
                  ★
                </button>
              ))}
            </div>

            <Label>Повторяемость</Label>
            <div className="mt-1.5 flex flex-col gap-1">
              {(Object.keys(REPEAT_LABELS) as Repeat[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onPatch({ repeat: r })}
                  className="rounded-lg px-3 py-1.5 text-left font-sans text-xs transition-colors"
                  style={{
                    background: task.repeat === r ? '#5D82FF' : 'rgba(52,60,82,0.5)',
                    color: task.repeat === r ? '#fff' : 'rgba(255,255,255,0.7)',
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
                          customDays: on ? task.customDays.filter((x) => x !== i) : [...task.customDays, i],
                        })
                      }
                      className="h-8 w-8 rounded-lg font-sans text-[11px] transition-colors"
                      style={{
                        background: on ? '#5D82FF' : 'rgba(52,60,82,0.5)',
                        color: on ? '#fff' : 'rgba(255,255,255,0.6)',
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
              className="mt-1.5 flex w-full items-center justify-between rounded-xl px-3 py-2 font-sans text-sm transition-colors"
              style={{
                background: task.active ? '#2DD4BF22' : 'rgba(52,60,82,0.4)',
                color: task.active ? '#2DD4BF' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${task.active ? '#2DD4BF44' : 'transparent'}`,
              }}
            >
              {task.active ? 'В процессе' : 'Не активно'}
              <Icon name={task.active ? 'Play' : 'Pause'} size={14} />
            </button>
          </>
        )}
      </div>

      {showCrop && !isTask && (
        <CropModal
          src={item.image}
          cropX={ach.cropX ?? 50}
          cropY={ach.cropY ?? 50}
          cropScale={ach.cropScale ?? 1}
          onSave={(x, y, s) => onPatch({ cropX: x, cropY: y, cropScale: s })}
          onClose={() => setShowCrop(false)}
        />
      )}
    </>
  );
};

export default PropertyPanel;
