import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  src: string;
  cropX: number;
  cropY: number;
  cropScale: number;
  onSave: (x: number, y: number, scale: number) => void;
  onClose: () => void;
}

const CropModal = ({ src, cropX, cropY, cropScale, onSave, onClose }: Props) => {
  const [cx, setCx] = useState(cropX);
  const [cy, setCy] = useState(cropY);
  const [sc, setSc] = useState(cropScale);
  const dragRef = useRef<{ sx: number; sy: number; ocx: number; ocy: number } | null>(null);

  const onPD = (e: React.PointerEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, ocx: cx, ocy: cy };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPM = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.sx) / 2;
    const dy = (e.clientY - dragRef.current.sy) / 2;
    setCx(Math.min(100, Math.max(0, dragRef.current.ocx - dx)));
    setCy(Math.min(100, Math.max(0, dragRef.current.ocy - dy)));
  };
  const onPU = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-[24px] p-5 shadow-2xl"
        style={{ background: '#202b4b', border: '1px solid rgba(93,130,255,0.25)', width: 340 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-white">Кадрирование</p>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <Icon name="X" size={18} />
          </button>
        </div>

        <p className="mb-2 font-sans text-[11px] text-white/50">
          Перетащите изображение, чтобы выбрать видимую область
        </p>

        {/* Preview square */}
        <div
          className="relative mx-auto overflow-hidden rounded-[16px]"
          style={{ width: 240, height: 240, background: '#1a1f30', cursor: 'grab' }}
          onPointerDown={onPD}
          onPointerMove={onPM}
          onPointerUp={onPU}
        >
          <img
            src={src}
            draggable={false}
            className="pointer-events-none h-full w-full object-cover"
            style={{
              objectPosition: `${cx}% ${cy}%`,
              transform: `scale(${sc})`,
              transformOrigin: `${cx}% ${cy}%`,
            }}
          />
          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
          {/* Center crosshair */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-0.5 w-10 rounded bg-white/30" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-0.5 rounded bg-white/30" />
          </div>
        </div>

        <div className="mt-4">
          <label className="block font-sans text-[11px] text-white/50 mb-1.5">
            Масштаб изображения
          </label>
          <input
            type="range" min={1} max={3} step={0.05}
            value={sc}
            onChange={(e) => setSc(parseFloat(e.target.value))}
            className="w-full accent-[#5D82FF]"
          />
          <div className="mt-1 flex justify-between font-sans text-[10px] text-white/30">
            <span>×1</span><span>×{sc.toFixed(2)}</span><span>×3</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 font-sans text-sm text-white/70 transition-colors hover:text-white"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            Отмена
          </button>
          <button
            onClick={() => { onSave(cx, cy, sc); onClose(); }}
            className="flex-1 rounded-xl py-2.5 font-display text-sm font-semibold text-white"
            style={{ background: '#5D82FF' }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;
