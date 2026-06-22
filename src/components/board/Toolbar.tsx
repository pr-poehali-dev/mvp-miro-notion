import Icon from '@/components/ui/icon';

interface Props {
  onAdd: () => void;
  onDelete: () => void;
  connecting: boolean;
  onToggleConnect: () => void;
  hasSelection: boolean;
}

const Toolbar = ({ onAdd, onDelete, connecting, onToggleConnect, hasSelection }: Props) => {
  const Btn = ({
    icon,
    label,
    onClick,
    active,
    danger,
    disabled,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="group flex h-11 w-11 items-center justify-center rounded-xl transition-all disabled:opacity-30"
      style={{
        background: active ? '#2DD4BF' : 'transparent',
        color: active ? '#06120f' : danger ? '#f87171' : 'rgba(255,255,255,0.85)',
      }}
    >
      <Icon name={icon} size={20} />
    </button>
  );

  return (
    <div className="glass fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-2 shadow-2xl">
      <Btn icon="Plus" label="Добавить ачивку" onClick={onAdd} />
      <Btn
        icon="Spline"
        label="Создать связь"
        onClick={onToggleConnect}
        active={connecting}
      />
      <div className="mx-1 h-7 w-px bg-white/10" />
      <Btn
        icon="Trash2"
        label="Удалить"
        onClick={onDelete}
        danger
        disabled={!hasSelection}
      />
    </div>
  );
};

export default Toolbar;
