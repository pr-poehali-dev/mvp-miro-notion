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
      className="flex h-10 w-10 items-center justify-center rounded-xl transition-all"
      style={{
        background: active ? '#5D82FF22' : 'transparent',
        color: active ? '#5D82FF' : 'rgba(255,255,255,0.6)',
        border: active ? '1px solid #5D82FF55' : '1px solid transparent',
      }}
    >
      <Icon name={icon} size={18} />
    </button>
  );

  return (
    <div
      className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl px-2 py-1.5"
      style={{ background: '#1a1f30', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Btn icon="Plus" label={isTask ? 'Добавить задание' : 'Добавить ачивку'} onClick={onAdd} />
      {!isTask && (
        <Btn icon="Spline" label="Создать связь" onClick={onToggleConnect} active={connecting} />
      )}
    </div>
  );
};

export default Toolbar;
