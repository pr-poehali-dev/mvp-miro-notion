import { Task, REPEAT_LABELS } from '@/types/board';

interface Props {
  tasks: Task[];
}

const ActiveTasksPanel = ({ tasks }: Props) => {
  const active = tasks.filter((t) => t.active && !t.done);
  if (active.length === 0) return null;

  return (
    <div className="panel fixed left-24 top-6 z-10 w-72 rounded-[24px] p-4">
      <p className="mb-3 font-display text-sm font-semibold text-white/90">Задания в процессе</p>
      <div className="hide-scroll flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        {active.map((t) => (
          <div
            key={t.id}
            className="rounded-[16px] p-3"
            style={{ background: '#343C52', border: `1px solid ${t.color}55` }}
          >
            <p className="font-display text-sm font-semibold text-white">{t.title}</p>
            {t.description && (
              <p className="mt-1 line-clamp-2 font-sans text-xs leading-snug text-white/55">
                {t.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-[#F59E0B]">{'★'.repeat(t.stars)}</span>
              <span className="text-white/50">{REPEAT_LABELS[t.repeat]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveTasksPanel;
