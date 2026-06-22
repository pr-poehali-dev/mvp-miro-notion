import { Mode } from '@/types/board';

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
}

const ModeSwitch = ({ mode, onChange }: Props) => {
  const Tab = ({ value, label }: { value: Mode; label: string }) => {
    const active = mode === value;
    return (
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onChange(value)}
        className="px-5 py-1 font-sans text-sm font-medium transition-colors"
        style={{
          color: active ? '#fff' : 'rgba(255,255,255,0.45)',
          borderBottom: active ? '2px solid #5D82FF' : '2px solid transparent',
          marginBottom: -1,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <Tab value="tree" label="Дерево Навыков" />
      <Tab value="tasks" label="Задание" />
    </div>
  );
};

export default ModeSwitch;
