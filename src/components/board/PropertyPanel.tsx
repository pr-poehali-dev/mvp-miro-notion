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

const PropertyPanel = ({ item, isTask, onPatch, onDelete }: Props) => {
  const task = item as Task;
  const ach = item as Achievement;
  const [showCrop, setShowCrop] = useState(false);

  const isBoss = !isTask && !!ach.isBoss;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onPatch({ image: reader.result as string, cropX: 50, cropY: 50, cropScale: 1 });
    reader.readAsDataURL(file);
  };

  const panelBg = isBoss ? '#1a0808' : '#1e2540';
  const panelBorder = isBoss ? 'rgba(220,38,38,0.35)' : 'rgba(255,255,255,0.08)';
  const labelColor = isBoss ? 'rgba(252,165,165,0.5)' : 'rgba(255,255,255,0.35)';
  const inputBorder = isBoss ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.1)';
  const inputFocus = isBoss ? 'rgba(220,38,38,0.5)' : 'rgba(93,130,255,0.5)';
  const accentColor = isBoss ? '#dc2626' : '#5D82FF';

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="mt-4 block font-sans text-[11px] uppercase tracking-wider"
      style={{ color: labelColor }}>
      {children}
    </label>
  );

  return (
    <>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        className="hide-scroll fixed right-5 top-[72px] z-30 max-h-[calc(100vh-90px)] w-64 overflow-y-auto rounded-[20px] p-4 animate-pop-in"
        style={{
          background: panelBg,
          border: `1px solid ${panelBorder}`,
          boxShadow: isBoss
            ? '0 20px 60px -10px rgba(120,0,0,0.6), 0 0 24px -8px rgba(220,38,38,0.3)'
            : '0 20px 60px -10px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBoss && (
              <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px #dc2626)' }}>☠</span>
            )}
            <p className="font-display text-sm font-semibold"
              style={isBoss ? { color: '#fbbf24', textShadow: '0 0 10px #f59e0b88' } : { color: 'rgba(255,255,255,0.9)' }}>
              {isTask ? 'Задание' : isBoss ? 'БОСС' : 'Ачивка'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Boss toggle — only for achievements */}
            {!isTask && (
              <button
                onClick={() => onPatch({ isBoss: !ach.isBoss })}
                title={isBoss ? 'Снять статус босса' : 'Сделать боссом'}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                style={{
                  background: isBoss ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.05)',
                  border: isBoss ? '1px solid rgba(220,38,38,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  filter: isBoss ? 'drop-shadow(0 0 6px #dc2626)' : 'none',
                }}
              >
                <span style={{ fontSize: 15 }}>☠</span>
              </button>
            )}
            <button
              onClick={onDelete}
              className="text-white/30 hover:text-red-400 transition-colors"
              title="Удалить"
            >
              <Icon name="Trash2" size={15} />
            </button>
          </div>
        </div>

        {/* Boss banner */}
        {isBoss && (
          <div
            className="mb-3 rounded-xl px-3 py-2 font-sans text-xs leading-snug"
            style={{ background: 'rgba(127,29,29,0.4)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}
          >
            ⚠ Это ачивка-босс. Она обозначает главную цель или вызов.
          </div>
        )}

        <Label>Название</Label>
        <input
          value={item.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className="mt-1 w-full rounded-xl bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none ring-1 transition-shadow"
          style={{
            '--tw-ring-color': inputBorder,
            boxShadow: `0 0 0 1px ${inputBorder}`,
          } as React.CSSProperties}
          onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}`)}
          onBlur={(e) => (e.target.style.boxShadow = `0 0 0 1px ${inputBorder}`)}
        />

        <Label>Описание</Label>
        <textarea
          value={item.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          rows={2}
          className="hide-scroll mt-1 w-full resize-y rounded-xl bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none"
          style={{ boxShadow: `0 0 0 1px ${inputBorder}`, minHeight: 56, maxHeight: 200 }}
          onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}`)}
          onBlur={(e) => (e.target.style.boxShadow = `0 0 0 1px ${inputBorder}`)}
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
                boxShadow: item.color === c ? `0 0 0 2px ${panelBg}, 0 0 0 4px ${c}` : 'none',
              }}
            />
          ))}
        </div>

        <Label>Картинка</Label>
        <div className="mt-2 flex gap-2">
          <label
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 font-sans text-xs text-white/70 transition-colors hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${inputBorder}` }}
          >
            <Icon name="Upload" size={13} />
            Загрузить
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {!isTask && item.image && (
            <button
              onClick={() => setShowCrop(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-sans text-xs text-white/70 transition-colors hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${inputBorder}` }}
              title="Кадрировать"
            >
              <Icon name="Crop" size={13} />
              Кадр
            </button>
          )}
        </div>

        {item.image && (
          <div className="mt-2 overflow-hidden rounded-xl" style={{ height: 70 }}>
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
                  style={{ color: s <= task.stars ? '#F59E0B' : 'rgba(255,255,255,0.15)' }}
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
                    background: task.repeat === r ? accentColor + '33' : 'rgba(52,60,82,0.4)',
                    color: task.repeat === r ? '#fff' : 'rgba(255,255,255,0.65)',
                    border: `1px solid ${task.repeat === r ? accentColor + '55' : 'transparent'}`,
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
                      className="h-8 w-8 rounded-lg font-sans text-[11px] transition-colors"
                      style={{
                        background: on ? accentColor : 'rgba(52,60,82,0.4)',
                        color: on ? '#fff' : 'rgba(255,255,255,0.55)',
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
              className="mt-1.5 flex w-full items-center justify-between rounded-xl px-3 py-2 font-sans text-sm transition-all"
              style={{
                background: task.active ? '#2DD4BF18' : 'rgba(52,60,82,0.35)',
                color: task.active ? '#2DD4BF' : 'rgba(255,255,255,0.65)',
                border: `1px solid ${task.active ? '#2DD4BF44' : 'transparent'}`,
              }}
            >
              {task.active ? 'В процессе' : 'Не активно'}
              <Icon name={task.active ? 'Play' : 'Pause'} size={14} />
            </button>
          </>
        )}

        {/* Bottom spacer */}
        <div className="h-2" />
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
