import { Task, REPEAT_LABELS } from '@/types/board';

interface Props {
  tasks: Task[];
}

const ActiveTasksPanel = ({ tasks }: Props) => {
  const active = tasks.filter((t) => t.active && !t.done);

  return (
    <div
      className="w-64 rounded-[18px] p-4"
      style={{ background: '#1a1f30', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="mb-3 font-sans text-sm font-semibold text-white/90">Задание в процессе</p>
      {active.length === 0 ? (
        <p className="font-sans text-[13px] text-white/35">Не выбрано</p>
      ) : (
        <div className="hide-scroll flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {active.map((t) => (
            <div
              key={t.id}
              className="rounded-[12px] p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.color}33` }}
            >
              <p className="font-sans text-sm font-semibold text-white">{t.title}</p>
              {t.description && (
                <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug text-white/45">
                  {t.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[12px] text-[#F59E0B]">{'★'.repeat(t.stars)}</span>
                <span className="font-sans text-[11px] text-white/40">{REPEAT_LABELS[t.repeat]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveTasksPanel;
