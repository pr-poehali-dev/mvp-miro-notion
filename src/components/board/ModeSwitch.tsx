import Icon from '@/components/ui/icon';
import { Mode } from '@/types/board';

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
}

const ModeSwitch = ({ mode, onChange }: Props) => {
  const Tab = ({ value, icon, label }: { value: Mode; icon: string; label: string }) => {
    const active = mode === value;
    return (
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onChange(value)}
        className="flex h-10 items-center gap-2 rounded-2xl px-5 font-display text-sm font-semibold transition-all"
        style={{
          background: active ? '#5D82FF' : 'transparent',
          color: active ? '#0c1024' : 'rgba(255,255,255,0.7)',
        }}
      >
        <Icon name={icon} size={16} />
        {label}
      </button>
    );
  };

  return (
    <div className="panel fixed left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-1 rounded-[24px] p-1.5">
      <Tab value="tree" icon="GitFork" label="Дерево навыков" />
      <Tab value="tasks" icon="ListChecks" label="Задания" />
    </div>
  );
};

export default ModeSwitch;
