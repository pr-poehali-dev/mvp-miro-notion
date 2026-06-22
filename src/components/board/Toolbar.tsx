import Icon from '@/components/ui/icon';

interface Props {
  isTask: boolean;
  onAdd: () => void;
  connecting: boolean;
  onToggleConnect: () => void;
}

const Toolbar = ({ isTask, onAdd, connecting, onToggleConnect }: Props) => {
  const Btn = ({
    icon,
    label,
    onClick,
    active,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
  }) => (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      title={label}
      className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all"
      style={{
        background: active ? '#5D82FF' : 'transparent',
        color: active ? '#0c1024' : 'rgba(255,255,255,0.85)',
      }}
    >
      <Icon name={icon} size={20} />
    </button>
  );

  return (
    <div className="panel fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-[24px] p-2">
      <Btn icon="Plus" label={isTask ? 'Добавить задание' : 'Добавить ачивку'} onClick={onAdd} />
      {!isTask && (
        <Btn icon="Spline" label="Создать связь" onClick={onToggleConnect} active={connecting} />
      )}
    </div>
  );
};

export default Toolbar;
