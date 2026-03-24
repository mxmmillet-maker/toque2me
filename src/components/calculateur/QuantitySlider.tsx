'use client';

interface QuantitySliderProps {
  value: number;
  onChange: (v: number) => void;
}

const STEPS = [1, 5, 10, 25, 50, 100, 150, 200, 250, 300, 400, 500];

export function QuantitySlider({ value, onChange }: QuantitySliderProps) {
  const sliderIndex = STEPS.findIndex((s) => s >= value);
  const idx = sliderIndex === -1 ? STEPS.length - 1 : sliderIndex;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-medium text-neutral-700">Quantité</label>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            min={1}
            max={500}
            value={value}
            onChange={(e) => onChange(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
            className="w-20 text-right text-lg font-semibold text-neutral-900 border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <span className="text-sm text-neutral-400">pièces</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={STEPS.length - 1}
        value={idx}
        onChange={(e) => onChange(STEPS[parseInt(e.target.value)])}
        className="w-full accent-neutral-900"
      />
      <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
        <span>1</span>
        <span>50</span>
        <span>100</span>
        <span>250</span>
        <span>500</span>
      </div>
    </div>
  );
}
